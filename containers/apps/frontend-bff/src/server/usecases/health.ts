import 'server-only';

import crypto from 'node:crypto';

import { SignUpRequestSchema } from '@tracen/contracts';
import type { AuthSignUp, AuthSignIn, AuthRefresh } from '@/types/auth';
import type { User } from '@/types/user';

import { getBackendHealthRepository } from '@/repositories/backend-health-repository';
import { verifyToken } from '@/lib/backend-client';

export type HealthCheckLogFn = (line: string) => void;

export type ApiHealthCheckResult =
  | {
      ok: true;
      logs: string[];
      createdUser: {
        id: string;
        email: string;
      };
    }
  | {
      ok: false;
      logs: string[];
      failedStep: FailedStep;
      error: {
        message: string;
        status?: number;
        responseText?: string;
      };
    };

type FailedStep =
  | 'backend-health'
  | 'create-user'
  | 'refresh-token'
  | 'get-user-exists'
  | 'delete-user'
  | 'get-user-deleted'
  | 'sign-in-user'
  | 'logout'
  | 'unexpected';

function nowIso(): string {
  return new Date().toISOString();
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

export async function runApiHealthCheck(
  logToTerminal: HealthCheckLogFn
): Promise<ApiHealthCheckResult> {
  const logs: string[] = [];

  const log = (line: string) => {
    const msg = `${nowIso()} ${line}`;
    logs.push(msg);
    logToTerminal(msg);
  };

  const repo = getBackendHealthRepository();

  const failWithResponse = async (
    failedStep: FailedStep,
    res: Response,
    message: string
  ): Promise<ApiHealthCheckResult> => {
    const responseText = await safeReadText(res);
    log(`FAIL (${failedStep}): ${message} (status=${res.status})`);
    if (responseText) {
      log(`Response body: ${responseText.slice(0, 2000)}`);
    }

    return {
      ok: false,
      logs,
      failedStep,
      error: {
        message,
        status: res.status,
        responseText: responseText || undefined,
      },
    };
  };

  const failWithError = (
    failedStep: FailedStep,
    err: unknown,
    message: string
  ): ApiHealthCheckResult => {
    const errMsg = err instanceof Error ? err.message : String(err);
    log(`FAIL (${failedStep}): ${message}`);
    log(`Error: ${errMsg}`);

    return {
      ok: false,
      logs,
      failedStep,
      error: {
        message: `${message}: ${errMsg}`,
      },
    };
  };

  try {
    log('STEP 1/5: backend GET /health');
    // API: ヘルスチェック
    const healthRes = await repo.backendHealth();
    if (!healthRes.ok) {
      return await failWithResponse(
        'backend-health',
        healthRes,
        'backend health endpoint returned non-2xx'
      );
    }
    const healthJson = (await healthRes.json()) as unknown;
    log(`OK (backend-health): ${JSON.stringify(healthJson)}`);

    // API: ヘルスチェック（Redis）
    const healthRedisRes = await repo.backendHealthRedis();
    if (!healthRedisRes.ok) {
      return await failWithResponse(
        'backend-health',
        healthRedisRes,
        'backend health redis endpoint returned non-2xx'
      );
    }
    const healthRedisJson = (await healthRedisRes.json()) as unknown;
    log(`OK (backend-health-redis): ${JSON.stringify(healthRedisJson)}`);

    const nonce = crypto.randomUUID();
    const email = `healthcheck+${Date.now()}-${nonce.slice(0, 8)}@example.com`;
    const name = `healthcheck-${nonce.slice(0, 8)}`;
    const password = 'password1234567890';

    const createUserInput = SignUpRequestSchema.parse({
      email: email,
      name: name,
      password: password,
    });

    log('STEP 2/5: backend POST /auth/sign-up (create test user)');
    // API: 公開鍵を取得する
    const publicKey = await repo.getJWKS();
    if (!publicKey.ok) {
      return await failWithResponse('create-user', publicKey, 'failed to retrieve JWKS');
    }
    log(`OK (get-jwks): retrieved JWKS successfully ${JSON.stringify(await publicKey.json())}`);

    // API: サインインする
    const createRes = await repo.signUpUser(createUserInput);
    if (createRes.status === 409) {
      // Should be unlikely with randomized email, but keep message clear.
      return await failWithResponse('create-user', createRes, 'email already exists (conflict)');
    }
    if (!createRes.ok) {
      return await failWithResponse('create-user', createRes, 'user creation returned non-2xx');
    }

    const created = (await createRes.json()) as AuthSignUp;
    const createdUserId = created.user?.id;
    if (!createdUserId) {
      log('FAIL (create-user): response JSON missing id');
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: 'create user response missing id' },
      };
    }
    log(`OK (create-user): id=${createdUserId}`);
    const createdJwt = created.accessToken;
    if (!createdJwt) {
      log('FAIL (create-user): response JSON missing accessToken');
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: 'create user response missing accessToken' },
      };
    }
    log(`OK (create-user): accessToken=${createdJwt}`);
    const createdRefreshToken = created.refreshToken;
    if (!createdRefreshToken) {
      log('FAIL (create-user): response JSON missing refreshToken');
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: 'create user response missing refreshToken' },
      };
    }
    log(`OK (create-user): refreshToken=${createdRefreshToken}`);
    const verifiedPayload = await verifyToken(createdJwt);
    if (!verifiedPayload) {
      log('FAIL (create-user): failed to verify returned JWT');
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: 'failed to verify returned JWT' },
      };
    }
    log(`OK (create-user): verified JWT payload ${JSON.stringify(verifiedPayload)}`);
    if (verifiedPayload.sub !== createdUserId) {
      log(
        `FAIL (create-user): JWT payload sub mismatch (expected=${createdUserId}, got=${verifiedPayload.sub})`
      );
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: 'JWT payload sub mismatch' },
      };
    }
    log(`OK (create-user): JWT payload sub matches created user id`);

    // API: リフレッシュトークンを使用する
    const refreshRes = await repo.refreshToken(createdRefreshToken);
    if (!refreshRes.ok) {
      return await failWithResponse(
        'refresh-token',
        refreshRes,
        'refresh token endpoint returned non-2xx'
      );
    }
    const refreshJson = (await refreshRes.json()) as AuthRefresh;
    log(`OK (refresh-token): refresh token response ${JSON.stringify(refreshJson)}`);
    const refreshedAccessToken = refreshJson.accessToken;
    if (!refreshedAccessToken) {
      log('FAIL (refresh-token): response JSON missing accessToken');
      return {
        ok: false,
        logs,
        failedStep: 'refresh-token',
        error: { message: 'refresh token response missing accessToken' },
      };
    }
    log(`OK (refresh-token): refresh token returned accessToken=${refreshedAccessToken}`);
    const refreshedVerifiedPayload = await verifyToken(refreshedAccessToken);
    if (!refreshedVerifiedPayload) {
      log('FAIL (refresh-token): failed to verify refresh token returned JWT');
      return {
        ok: false,
        logs,
        failedStep: 'refresh-token',
        error: { message: 'failed to verify refresh token returned JWT' },
      };
    }
    log(
      `OK (refresh-token): verified refresh token returned JWT payload ${JSON.stringify(
        refreshedVerifiedPayload
      )}`
    );
    if (refreshedVerifiedPayload.sub !== createdUserId) {
      log(
        `FAIL (refresh-token): refresh token JWT payload sub mismatch (expected=${createdUserId}, got=${refreshedVerifiedPayload.sub})`
      );
      return {
        ok: false,
        logs,
        failedStep: 'refresh-token',
        error: { message: 'refresh token JWT payload sub mismatch' },
      };
    }
    log(`OK (refresh-token): refresh token JWT payload sub matches created user id`);
    if (!refreshJson.refreshToken) {
      log('FAIL (refresh-token): response JSON missing refreshToken');
      return {
        ok: false,
        logs,
        failedStep: 'refresh-token',
        error: { message: 'refresh token response missing refreshToken' },
      };
    }
    if (refreshJson.refreshToken === createdRefreshToken) {
      log('FAIL (refresh-token): response JSON refreshToken mismatch');
      return {
        ok: false,
        logs,
        failedStep: 'refresh-token',
        error: { message: 'refresh token response refreshToken mismatch' },
      };
    }
    log(
      `OK (refresh-token): refresh token response includes new refreshToken=${refreshJson.refreshToken}`
    );

    // API: 失効したリフレッシュトークンを使用する
    const noRefreshRes = await repo.refreshToken(createdRefreshToken);
    if (noRefreshRes.ok) {
      return await failWithResponse(
        'refresh-token',
        noRefreshRes,
        'refresh token endpoint returned 2xx for revoked token'
      );
    }
    log('OK (refresh-token): revoked refresh token cannot be used');

    // API: 追放したリフレッシュトークンを使用する
    const noRefreshRes2 = await repo.refreshToken(refreshJson.refreshToken);
    if (noRefreshRes2.ok) {
      return await failWithResponse(
        'refresh-token',
        noRefreshRes,
        'refresh token endpoint returned 2xx for revoked token'
      );
    }
    log('OK (refresh-token): force revoked refresh token cannot be used');

    log('STEP 3/5: backend GET /users/:id (exists check)');

    // API: ユーザー情報の取得（存在確認）
    const getExistsRes = await repo.getUserById(createdUserId, createdJwt);
    if (!getExistsRes.ok) {
      return await failWithResponse('get-user-exists', getExistsRes, 'get user returned non-2xx');
    }
    const user = (await getExistsRes.json()) as User;
    if (user.id !== createdUserId) {
      log(
        `FAIL (get-user-exists): returned id mismatch (expected=${createdUserId}, got=${user.id})`
      );
      return {
        ok: false,
        logs,
        failedStep: 'get-user-exists',
        error: { message: 'returned user id mismatch' },
      };
    }
    if (user.email !== email) {
      log(`FAIL (get-user-exists): returned email mismatch (expected=${email}, got=${user.email})`);
      return {
        ok: false,
        logs,
        failedStep: 'get-user-exists',
        error: { message: 'returned user email mismatch' },
      };
    }
    log(`OK (get-user-exists): id=${user.id} email=${user.email}`);

    log('STEP 3.5/5: backend POST /auth/sign-in (sign in with created user)');
    // API: （既存ユーザーで）サインインする
    const signInRes = await repo.signInUser({ email, password });
    if (!signInRes.ok) {
      return await failWithResponse(
        'sign-in-user',
        signInRes,
        'sign in with created user returned non-2xx'
      );
    }
    const signInJson = (await signInRes.json()) as AuthSignIn;
    log(`OK (sign-in-user): sign in with created user succeeded ${JSON.stringify(signInJson)}`);
    const signInJwt = signInJson.accessToken;
    if (!signInJwt) {
      log('FAIL (sign-in-user): sign in response JSON missing accessToken');
      return {
        ok: false,
        logs,
        failedStep: 'sign-in-user',
        error: { message: 'sign in response missing accessToken' },
      };
    }
    log(`OK (sign-in-user): sign in returned accessToken=${signInJwt}`);
    const signInRefreshToken = signInJson.refreshToken;
    if (!signInRefreshToken) {
      log('FAIL (sign-in-user): sign in response JSON missing refreshToken');
      return {
        ok: false,
        logs,
        failedStep: 'sign-in-user',
        error: { message: 'sign in response missing refreshToken' },
      };
    }
    log(`OK (sign-in-user): sign in returned refreshToken=${signInRefreshToken}`);
    const signInVerifiedPayload = await verifyToken(signInJwt);
    if (!signInVerifiedPayload) {
      log('FAIL (sign-in-user): failed to verify sign in returned JWT');
      return {
        ok: false,
        logs,
        failedStep: 'sign-in-user',
        error: { message: 'failed to verify sign in returned JWT' },
      };
    }
    log(
      `OK (sign-in-user): verified sign in returned JWT payload ${JSON.stringify(signInVerifiedPayload)}`
    );
    if (signInVerifiedPayload.sub !== createdUserId) {
      log(
        `FAIL (sign-in-user): sign in JWT payload sub mismatch (expected=${createdUserId}, got=${signInVerifiedPayload.sub})`
      );
      return {
        ok: false,
        logs,
        failedStep: 'sign-in-user',
        error: { message: 'sign in JWT payload sub mismatch' },
      };
    }
    log(`OK (sign-in-user): sign in JWT payload sub matches created user id`);

    log('STEP 4/5: backend DELETE /users/:id');

    // API: ユーザーの削除
    const deleteRes = await repo.deleteUserById(createdUserId, createdJwt);
    if (deleteRes.status === 404) {
      return await failWithResponse('delete-user', deleteRes, 'user not found on delete');
    }
    if (deleteRes.status !== 204) {
      return await failWithResponse('delete-user', deleteRes, 'expected 204 No Content on delete');
    }
    log('OK (delete-user): 204');

    log('STEP 5/5: backend GET /users/:id (deleted check)');

    // API: ユーザー情報の取得（削除確認）
    const getDeletedRes = await repo.getUserById(createdUserId, createdJwt);
    if (getDeletedRes.status !== 404) {
      return await failWithResponse(
        'get-user-deleted',
        getDeletedRes,
        'expected 404 Not Found after deletion'
      );
    }
    log('OK (get-user-deleted): 404');

    log('STEP: backend DELETE /auth/refresh (logout)');

    // API: ログアウトする
    const logoutRes = await repo.logout(signInRefreshToken);
    if (!logoutRes.ok) {
      return await failWithResponse('logout', logoutRes, 'logout returned non-2xx');
    }
    log('OK (logout): 200');

    // API: ログアウトしたリフレッシュトークンを使用する
    const unexpectedLogoutRes = await repo.refreshToken(signInRefreshToken);
    if (unexpectedLogoutRes.ok) {
      return await failWithResponse(
        'logout',
        unexpectedLogoutRes,
        'refresh token still valid after logout'
      );
    }
    log('OK (logout): refresh token invalid after logout');

    log('DONE: api health check success');
    return {
      ok: true,
      logs,
      createdUser: {
        id: createdUserId,
        email,
      },
    };
  } catch (err) {
    return failWithError('unexpected', err, 'unexpected error while running api health check');
  }
}
