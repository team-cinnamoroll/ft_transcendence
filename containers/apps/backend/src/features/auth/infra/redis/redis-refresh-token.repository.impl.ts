import type { RefreshToken, UserId } from '@tracen/contracts';
import { AuthRefreshTokenRepositorySpec, ActiveFamilyToken } from '../../domain/auth.repository';
import { RedisClient } from '../../../../shared/infra/redis/client';
import {
  RefreshTokenData,
  ExpiresIn,
  FamilyId,
  refreshTokenDataSchema,
} from '../../domain/auth.entity';
import {
  InternalValidationError,
  ServiceUnavailableError,
} from '../../../../shared/errors/global.error';
import { makeSafeInfraResult } from '../../../../shared/utils/validation';

const refreshKeyPrefix = 'refresh_token:'; // refresh_tokenのデータを管理するためのプレフィックス。キーは「refresh_token:{token}」の形式で保存される。
const familyKeyPrefix = 'family_token:'; // family_tokenに紐づく同世代のrefresh_tokenのSetを管理するためのプレフィックス。キーは「family_token:{familyId}」の形式で保存される。
const userKeyPrefix = 'user_tokens:'; // ユーザーIDに紐づくfamilyIdのSetを管理するためのプレフィックス。キーは「user_tokens:{userId}」の形式で保存される。
const revokedRemainingInSeconds = 3600;

function parseExpiresInToSeconds(expiresIn: ExpiresIn): number {
  const value = String(expiresIn).trim();
  const match = value.match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d|w|y)?$/i);

  if (!match) {
    throw new InternalValidationError(`Invalid expiresIn value: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = (match[2] ?? 'ms').toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1 / 1000,
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
    w: 60 * 60 * 24 * 7,
    y: 60 * 60 * 24 * 365,
  };

  return Math.max(1, Math.ceil(amount * multipliers[unit]));
}

function modifyStatusToRevoked(data: RefreshTokenData): RefreshTokenData {
  return makeSafeInfraResult(refreshTokenDataSchema, {
    ...data,
    status: 'revoked', // トークンの状態を「revoked」に変更
    revokedAt: new Date().toISOString(),
  });
}

// エラー判定用のヘルパー
function isRedisError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

class RedisRefreshTokenRepositoryImpl implements AuthRefreshTokenRepositorySpec {
  constructor(readonly redisClient: RedisClient) {}

  async saveToken(
    token: RefreshToken,
    data: RefreshTokenData,
    expiresIn: ExpiresIn
  ): Promise<void> {
    const tokenKey = `${refreshKeyPrefix}${token}`;
    const familyKey = `${familyKeyPrefix}${data.familyId}`;
    const userKey = `${userKeyPrefix}${data.userId}`;
    const expiresInSeconds = parseExpiresInToSeconds(expiresIn);
    const pipeline = this.redisClient.pipeline();

    try {
      pipeline.set(tokenKey, JSON.stringify(data), 'EX', expiresInSeconds);
      pipeline.sadd(familyKey, token);
      pipeline.sadd(userKey, data.familyId);
      pipeline.expire(familyKey, expiresInSeconds);
      pipeline.expire(userKey, expiresInSeconds);
      await pipeline.exec();
    } catch (error: unknown) {
      if (isRedisError(error)) {
        if (error.message?.includes('OOM')) {
          throw new ServiceUnavailableError('Token storage is full.');
        }
        throw new ServiceUnavailableError('Token storage is currently unavailable.');
      }
      throw new Error('Failed to save refresh token', { cause: error });
    }
  }

  async revokeToken(token: RefreshToken): Promise<void> {
    const tokenKey = `${refreshKeyPrefix}${token}`;
    try {
      const result = await this.redisClient.get(tokenKey);
      if (!result) return; // トークンが見つからない場合は何もしない

      const data = JSON.parse(result) as RefreshTokenData;
      const revokedData = modifyStatusToRevoked(data); // トークンの状態を「revoked」に変更
      await this.redisClient.set(
        tokenKey,
        JSON.stringify(revokedData),
        'EX',
        revokedRemainingInSeconds
      );
    } catch (error: unknown) {
      // JSONパースエラー: データが壊れている場合は、無効化する代わりに削除して安全側に倒すのがベストプラクティス
      if (error instanceof SyntaxError) {
        console.warn(`Corrupted token data found during revoke. Deleting key: ${tokenKey}`);
        try {
          await this.redisClient
            .del(tokenKey)
            .catch((e) => console.error('Failed to clean up corrupted token', e));
          return;
        } catch (cleanupError) {
          console.error('Failed to clean up corrupted token', cleanupError);
          // クリーンアップはベストエフォートで行うため、ここではエラーを再スローせずにログに記録するだけに留める
          return;
        }
      }
      if (isRedisError(error)) {
        throw new ServiceUnavailableError('Token storage is unavailable during revocation.');
      }
      throw new Error(`Failed to revoke token`, { cause: error });
    }
  }

  async findToken(token: RefreshToken): Promise<RefreshTokenData | null> {
    const key = `${refreshKeyPrefix}${token}`;
    try {
      const result = await this.redisClient.get(key);
      if (!result) return null;
      return JSON.parse(result) as RefreshTokenData;
    } catch (error: unknown) {
      // 💡 認証における極めて重要な Fail-Safe 処理
      // データが壊れていて JSON.parse に失敗した場合、システムをクラッシュさせるのではなく
      // 「トークンが見つからなかった（＝無効である）」とみなして null を返すことで、
      // ユーザーに再ログインを促す安全な挙動になります。
      if (error instanceof SyntaxError) {
        console.error(`Corrupted refresh token data for key ${key}. Treating as invalid.`);
        return null;
      }

      if (isRedisError(error)) {
        throw new ServiceUnavailableError('Token storage is unavailable.');
      }
      throw new Error('Failed to retrieve refresh token', { cause: error });
    }
  }

  // 再利用の猶予期間判定用: familyId に紐づくトークン群の中から、現在アクティブな1件を探す。
  // (ローテーション直後は「revokedになった旧トークン」と「新しく発行されたアクティブなトークン」が
  // 同じfamilyKeyのSetに同居しているため、Setを走査してstatus==='active'のものを見つければよい)
  async findActiveTokenOfFamily(familyId: FamilyId): Promise<ActiveFamilyToken | null> {
    const familyKey = `${familyKeyPrefix}${familyId}`;
    try {
      const tokens = await this.redisClient.smembers(familyKey);
      if (tokens.length === 0) return null;

      const keys = tokens.map((token) => `${refreshKeyPrefix}${token}`);
      const tokenDatas = await this.redisClient.mget(...keys);

      for (let i = 0; i < tokens.length; i++) {
        const raw = tokenDatas[i];
        if (!raw) continue;
        try {
          const data = JSON.parse(raw) as RefreshTokenData;
          if (data.status === 'active') {
            return { token: tokens[i] as RefreshToken, data };
          }
        } catch {
          continue; // 壊れたデータはスキップし、他のトークンを探す
        }
      }
      return null;
    } catch (error: unknown) {
      if (isRedisError(error)) throw new ServiceUnavailableError('Token storage is unavailable.');
      throw new Error(`Failed to find active token for family ${familyId}`, { cause: error });
    }
  }

  async deleteToken(token: RefreshToken): Promise<void> {
    const key = `${refreshKeyPrefix}${token}`;
    try {
      await this.redisClient.del(key);
    } catch (error: unknown) {
      if (isRedisError(error)) throw new ServiceUnavailableError('Token storage is unavailable.');
      throw new Error('Failed to delete token', { cause: error });
    }
  }

  async deleteAllTokensOfFamily(familyId: FamilyId): Promise<void> {
    const familyKey = `${familyKeyPrefix}${familyId}`;
    try {
      const tokens = await this.redisClient.smembers(familyKey);
      if (tokens.length === 0) return; // 家族IDに紐づくトークンがない場合は何もしない

      const keysToDelete = tokens.map((token) => `${refreshKeyPrefix}${token}`);

      const tokenDatas = await this.redisClient.mget(...keysToDelete);
      let userId: UserId | null = null;
      // MGETの結果（配列）をメモリ上でループして userId を探す（通信発生なし）
      for (const tokenData of tokenDatas) {
        if (tokenData) {
          try {
            const data = JSON.parse(tokenData) as RefreshTokenData;
            userId = data.userId;
            break; // 見つかったらループ終了
          } catch {
            continue;
          }
        }
      }

      keysToDelete.push(familyKey); // familyKeyも削除対象に追加

      const pipeline = this.redisClient.pipeline();
      pipeline.del(...keysToDelete);

      if (userId) {
        const userKey = `${userKeyPrefix}${userId}`;
        pipeline.srem(userKey, familyId); // 💡 Redisの仕様により、SREMの結果Setが空になれば userKey は自動消滅する
      }

      await pipeline.exec();
    } catch (error: unknown) {
      if (isRedisError(error)) throw new ServiceUnavailableError('Token storage is unavailable.');
      throw new Error(`Failed to delete tokens for family ${familyId}`, { cause: error });
    }
  }

  async deleteAllTokensOfUser(userId: UserId): Promise<void> {
    const userKey = `${userKeyPrefix}${userId}`;
    try {
      // 1. ユーザーに紐づく全ての家族IDを取得（通信1回目）
      const familyIds = await this.redisClient.smembers(userKey);
      if (familyIds.length === 0) return;

      // 2. 各家族に紐づくトークン一覧をパイプラインで一括取得（通信2回目）
      const fetchPipeline = this.redisClient.pipeline();
      for (const familyId of familyIds) {
        fetchPipeline.smembers(`${familyKeyPrefix}${familyId}`);
      }
      const fetchResults = await fetchPipeline.exec();

      // 3. 削除すべき「全てのキー」を配列にまとめる
      const keysToDelete: string[] = [];
      keysToDelete.push(userKey); // 💡 ユーザーキー自体も最後にまとめて消す

      if (fetchResults) {
        for (let i = 0; i < familyIds.length; i++) {
          const familyId = familyIds[i];
          keysToDelete.push(`${familyKeyPrefix}${familyId}`); // 家族のインデックスキー

          // パイプラインの結果からトークン一覧を取り出す
          const [error, tokens] = fetchResults[i];
          if (!error && tokens) {
            for (const token of tokens as string[]) {
              keysToDelete.push(`${refreshKeyPrefix}${token}`); // トークン本体のキー
            }
          }
        }
      }

      // 4. 全てのキーを1回の通信で一括削除（通信3回目）
      if (keysToDelete.length > 0) {
        await this.redisClient.del(...keysToDelete);
      }
    } catch (error: unknown) {
      if (isRedisError(error)) throw new ServiceUnavailableError('Token storage is unavailable.');
      throw new Error(`Failed to delete tokens for user ${userId}`, { cause: error });
    }
  }
}

export function createRedisRefreshTokenRepository(
  redisClient: RedisClient
): AuthRefreshTokenRepositorySpec {
  return new RedisRefreshTokenRepositoryImpl(redisClient);
}
