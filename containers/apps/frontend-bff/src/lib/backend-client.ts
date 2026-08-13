import 'server-only';

import { hc } from 'hono/client';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { AppType } from '@tracen/backend';

import { getServerEnv } from './env/server';

export function createBackendClient(token?: string) {
  return hc<AppType>(getServerEnv().APP_API_BASE_URL, {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : { 'X-API-Key': getServerEnv().MASTER_API_KEY },
  });
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  if (!jwks) {
    const jwksUrl = createBackendClient().api.v1['.well-known']['jwks.json'].$url();
    jwks = createRemoteJWKSet(jwksUrl);
  }
  return jwks;
}

export async function verifyToken(token: string) {
  try {
    // 2. トークンとJWKSを渡して検証
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: 'https://ft_transcendence.42.fr/', // 発行元のチェック（必須）
      // audience: 'YOUR_CLIENT_ID', // 利用者のチェック（必須）
      clockTolerance: '5s', // サーバー間の時計のズレを最大「5秒」まで許容する
    });

    // 検証成功、デコードされたペイロードが返る
    return payload;
  } catch (error) {
    // 期限切れや、改ざんされたトークンの場合はエラーになります
    console.error('JWTの検証に失敗しました:', error);
    return null;
  }
}
