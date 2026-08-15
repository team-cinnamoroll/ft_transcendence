import { type RefreshToken, type AuthRefreshRequest } from '@tracen/contracts';
import {
  type RefreshTokenData,
  refreshTokenDataSchema,
} from '../../../features/auth/domain/auth.entity';
import { type AuthRefreshTokenRepositorySpec } from '../../../features/auth/domain/auth.repository';
import { makeSafeUsecaseResult } from '../../../shared/utils/validation';

// リフレッシュトークンのローテーション後、古いトークンが再送されてきても
// 「盗用」として即座にfamilyを全滅させず、猶予期間内であれば正当な競合(heartbeatの
// バックグラウンド更新とページ読み込みの競合など)とみなして許容する秒数。
// 長すぎると本物のトークン盗用の検知能力が下がるため、短めに設定する。
const REUSE_GRACE_PERIOD_SECONDS = 10;

/** revokedAt(失効時刻)から現在までの経過秒数が、猶予期間内かどうかを判定する */
function isWithinReuseGracePeriod(revokedAt: string | undefined): boolean {
  if (!revokedAt) return false;
  const revokedAtMs = new Date(revokedAt).getTime();
  if (Number.isNaN(revokedAtMs)) return false;
  return Date.now() - revokedAtMs <= REUSE_GRACE_PERIOD_SECONDS * 1000;
}

export type AcceptRefreshResult =
  // 通常どおりローテーションしてよい（アクティブなトークン）
  | { kind: 'rotate'; data: RefreshTokenData }
  // 猶予期間内の古いトークンの再送。既にローテーション済みのアクティブなトークンを
  // そのまま使い回す（ローテーションはしない）
  | { kind: 'reuse-grace'; token: RefreshToken; data: RefreshTokenData }
  // トークンが無効（盗用の疑い、または猶予期間を過ぎた再利用）
  | null;

/**
 * リフレッシュトークンの有効性を検証し、呼び出し元(refresh.handler.ts)が取るべき動作を判定する。
 * - 'rotate': 通常どおり、新しいトークンペアを発行してこのトークンをローテーションしてよい
 * - 'reuse-grace': 猶予期間内の古いトークン再送。ローテーションはせず、既に発行済みの
 *   アクティブなトークンをそのまま返す(heartbeatのバックグラウンド更新とページ読み込みが
 *   競合し、Cookie反映前に古いトークンで再送されるケースなどを正当な挙動として吸収する)
 * - null: トークンが無効、またはユーザーID不一致、または猶予期間を過ぎた再利用(盗用の疑い)
 */
export async function acceptRefreshRequest(
  repo: AuthRefreshTokenRepositorySpec,
  request: AuthRefreshRequest
): Promise<AcceptRefreshResult> {
  const existingTokenData = await repo.findToken(request.refreshToken);
  if (!existingTokenData) {
    return null; // トークンが見つからない場合はnullを返す
  }
  if (existingTokenData.userId !== request.userId) {
    return null; // トークンのユーザーIDがリクエストのユーザーIDと一致しない場合はnullを返す
  }
  if (existingTokenData.status !== 'active') {
    if (isWithinReuseGracePeriod(existingTokenData.revokedAt)) {
      const active = await repo.findActiveTokenOfFamily(existingTokenData.familyId);
      if (active) {
        return { kind: 'reuse-grace', token: active.token, data: active.data };
      }
      // familyに現在アクティブなトークンが見つからない場合は安全側に倒し、下の削除処理に進む
    }
    await repo.deleteAllTokensOfFamily(existingTokenData.familyId); // 盗用の疑い、または猶予期間を過ぎた再利用の場合は同一familyIdのトークンを全て削除
    return null;
  }
  return {
    kind: 'rotate',
    data: makeSafeUsecaseResult(refreshTokenDataSchema, existingTokenData),
  };
}

export async function logoutByRefreshToken(
  repo: AuthRefreshTokenRepositorySpec,
  request: AuthRefreshRequest
): Promise<void> {
  const existingTokenData = await repo.findToken(request.refreshToken);
  if (!existingTokenData) {
    console.warn('Refresh token not found for logout:', request.refreshToken);
    return; // トークンが見つからない場合は何もしない
  }
  if (existingTokenData.userId !== request.userId) {
    console.warn(
      'User ID mismatch for logout. Token userId:',
      existingTokenData.userId,
      'Request userId:',
      request.userId
    );
    return; // トークンのユーザーIDがリクエストのユーザーIDと一致しない場合は何もしない
  }
  if (existingTokenData && existingTokenData.familyId) {
    await repo.deleteAllTokensOfFamily(existingTokenData.familyId);
  } else {
    await repo.deleteToken(request.refreshToken);
  }
}
