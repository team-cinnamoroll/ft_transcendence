import 'server-only';

import crypto from 'node:crypto';

import { AuthSignUpRequestSchema } from '@tracen/contracts';

import type { AuthSignUp, AuthSignIn, AuthRefresh } from '@/types/auth';
import type { UserMe } from '@/types/user';
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

    const createUserInput = AuthSignUpRequestSchema.parse({
      email: email,
      name: name,
      password: password,
    });

    log('STEP 2/5: backend POST /auth/sign-up (create test user)');
    // API: 公開鍵を取得する
    const publicKey = await repo.getJWKS();
    if (!publicKey.ok || publicKey.status !== 200) {
      return await failWithResponse('create-user', publicKey, 'failed to retrieve JWKS');
    }
    log(`OK (get-jwks): retrieved JWKS successfully ${JSON.stringify(await publicKey.json())}`);

    // API: サインアップする
    const createRes = await repo.signUpUser(createUserInput);
    if (createRes.status === 409) {
      // Should be unlikely with randomized email, but keep message clear.
      return await failWithResponse('create-user', createRes, 'email already exists (conflict)');
    }
    if (!createRes.ok || createRes.status !== 201) {
      return await failWithResponse('create-user', createRes, 'user creation returned non-2xx');
    }

    const createErrorRes = await repo.signUpUser(createUserInput);
    if (createErrorRes.status !== 409) {
      return await failWithResponse(
        'create-user',
        createErrorRes,
        'user creation did not return 409 on duplicate'
      );
    }
    log('OK (create-user): duplicate user creation returned 409 as expected');

    const createErrorRes2 = await repo.signUpUser({
      email: 'testexample.com',
      name: 'Test User',
      password: 'pa1ddew222daa',
    });
    if (createErrorRes2.status !== 400) {
      return await failWithResponse(
        'create-user',
        createErrorRes2,
        'user creation did not return 400 on invalid input'
      );
    }
    const createErrorRes3 = await repo.signUpUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'pa',
    });
    if (createErrorRes3.status !== 400) {
      return await failWithResponse(
        'create-user',
        createErrorRes3,
        'user creation did not return 400 on invalid input'
      );
    }
    log('OK (create-user): invalid user creation returned 400 as expected');
    const created = (await createRes.json()) as AuthSignUp;
    if (!created.success) {
      log(`FAIL (create-user): response JSON success=false, message=${created.message}`);
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: `create user failed: ${created.message}` },
      };
    }
    const createdUserId = created.data.user.id;
    if (!createdUserId) {
      log('FAIL (create-user): response JSON missing id');
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: 'create user response missing id' },
      };
    }
    const createdUserName = created.data.user.name;
    if (!createdUserName) {
      log('FAIL (create-user): response JSON missing name');
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: 'create user response missing name' },
      };
    }
    const createdUserProfileName = created.data.userProfile.name;
    if (!createdUserProfileName) {
      log('FAIL (create-user): response JSON missing userProfile.name');
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: 'create user response missing userProfile.name' },
      };
    }
    if (createdUserName !== createdUserProfileName) {
      log(
        `FAIL (create-user): response JSON user.name and userProfile.name mismatch (user.name=${createdUserName}, userProfile.name=${createdUserProfileName})`
      );
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: 'create user response user.name and userProfile.name mismatch' },
      };
    }
    const createdUserProfileUserId = created.data.userProfile.id;
    if (!createdUserProfileUserId) {
      log('FAIL (create-user): response JSON missing userProfile.id');
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: 'create user response missing userProfile.id' },
      };
    }
    if (createdUserId !== createdUserProfileUserId) {
      log(
        `FAIL (create-user): response JSON user.id and userProfile.id mismatch (user.id=${createdUserId}, userProfile.id=${createdUserProfileUserId})`
      );
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: { message: 'create user response user.id and userProfile.id mismatch' },
      };
    }
    const createdUserProfileAvatarUrl = created.data.userProfile.avatar?.url;
    if (createdUserProfileAvatarUrl) {
      log(
        `FAIL (create-user): response JSON userProfile.avatarUrl should be undefined on creation (got=${createdUserProfileAvatarUrl})`
      );
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: {
          message: 'create user response userProfile.avatarUrl should be undefined on creation',
        },
      };
    }
    const createdUserProfileBadge = created.data.userProfile.badge;
    if (createdUserProfileBadge) {
      log(
        `FAIL (create-user): response JSON userProfile.badge should be undefined on creation (got=${createdUserProfileBadge})`
      );
      return {
        ok: false,
        logs,
        failedStep: 'create-user',
        error: {
          message: 'create user response userProfile.badge should be undefined on creation',
        },
      };
    }
    log(`OK (create-user): id=${createdUserId}`);
    const createdJwt = created.data.accessToken;
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
    const createdRefreshToken = created.data.refreshToken;
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
    const refreshRes = await repo.refreshToken(createdUserId, createdRefreshToken);
    if (!refreshRes.ok || refreshRes.status !== 200) {
      return await failWithResponse(
        'refresh-token',
        refreshRes,
        'refresh token endpoint returned non-2xx'
      );
    }
    const refreshJson = (await refreshRes.json()) as AuthRefresh;
    if (!refreshJson.success) {
      log(`FAIL (refresh-token): response JSON success=false, message=${refreshJson.message}`);
      return {
        ok: false,
        logs,
        failedStep: 'refresh-token',
        error: { message: `refresh token failed: ${refreshJson.message}` },
      };
    }
    log(`OK (refresh-token): refresh token response ${JSON.stringify(refreshJson)}`);
    const refreshedAccessToken = refreshJson.data.accessToken;
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
    if (!refreshJson.data.refreshToken) {
      log('FAIL (refresh-token): response JSON missing refreshToken');
      return {
        ok: false,
        logs,
        failedStep: 'refresh-token',
        error: { message: 'refresh token response missing refreshToken' },
      };
    }
    if (refreshJson.data.refreshToken === createdRefreshToken) {
      log('FAIL (refresh-token): response JSON refreshToken mismatch');
      return {
        ok: false,
        logs,
        failedStep: 'refresh-token',
        error: { message: 'refresh token response refreshToken mismatch' },
      };
    }
    log(
      `OK (refresh-token): refresh token response includes new refreshToken=${refreshJson.data.refreshToken}`
    );

    // API: 失効したリフレッシュトークンを使用する
    const noRefreshRes = await repo.refreshToken(createdUserId, createdRefreshToken);
    if (noRefreshRes.ok && noRefreshRes.status !== 401) {
      return await failWithResponse(
        'refresh-token',
        noRefreshRes,
        'refresh token endpoint returned 2xx for revoked token'
      );
    }
    log('OK (refresh-token): revoked refresh token cannot be used');

    // API: 追放したリフレッシュトークンを使用する
    const noRefreshRes2 = await repo.refreshToken(createdUserId, refreshJson.data.refreshToken);
    if (noRefreshRes2.ok && noRefreshRes2.status !== 401) {
      return await failWithResponse(
        'refresh-token',
        noRefreshRes2,
        'refresh token endpoint returned 2xx for revoked token'
      );
    }
    log('OK (refresh-token): force revoked refresh token cannot be used');

    log('STEP 3/5: backend GET /users/:id (exists check)');

    // API: ユーザー情報の取得（存在確認）
    const getExistsRes = await repo.getMeUser(createdJwt);
    if (!getExistsRes.ok || getExistsRes.status !== 200) {
      return await failWithResponse('get-user-exists', getExistsRes, 'get user returned non-2xx');
    }
    const userMe = (await getExistsRes.json()) as UserMe;
    if (!userMe.success) {
      log(`FAIL (get-user-exists): response JSON success=false, message=${userMe.message}`);
      return {
        ok: false,
        logs,
        failedStep: 'get-user-exists',
        error: { message: `get user failed: ${userMe.message}` },
      };
    }
    if (userMe.data.user.id !== createdUserId) {
      log(
        `FAIL (get-user-exists): returned id mismatch (expected=${createdUserId}, got=${userMe.data.user.id})`
      );
      return {
        ok: false,
        logs,
        failedStep: 'get-user-exists',
        error: { message: 'returned user id mismatch' },
      };
    }
    if (userMe.data.user.email !== email) {
      log(
        `FAIL (get-user-exists): returned email mismatch (expected=${email}, got=${userMe.data.user.email})`
      );
      return {
        ok: false,
        logs,
        failedStep: 'get-user-exists',
        error: { message: 'returned user email mismatch' },
      };
    }
    log(`OK (get-user-exists): id=${userMe.data.user.id} email=${userMe.data.user.email}`);

    log('STEP 3.5/5: backend POST /auth/sign-in (sign in with created user)');
    // API: （既存ユーザーで）サインインする
    const signInRes = await repo.signInUser({ email, password });
    if (!signInRes.ok || signInRes.status !== 200) {
      return await failWithResponse(
        'sign-in-user',
        signInRes,
        'sign in with created user returned non-2xx'
      );
    }

    const signInErrorRes = await repo.signInUser({ email, password: 'wrongpassword' });
    if (signInErrorRes.status !== 401) {
      return await failWithResponse(
        'sign-in-user',
        signInErrorRes,
        'sign in with wrong password did not return 401'
      );
    }
    log('OK (sign-in-user): sign in with wrong password returned 401 as expected');
    const signInErrorRes2 = await repo.signInUser({
      email: 'testexample.com',
      password: 'wrongpassword',
    });
    if (signInErrorRes2.status !== 400) {
      return await failWithResponse(
        'sign-in-user',
        signInErrorRes2,
        'sign in with invalid email did not return 400'
      );
    }
    log('OK (sign-in-user): sign in with invalid email returned 400 as expected');
    const signInJson = (await signInRes.json()) as AuthSignIn;
    log(`OK (sign-in-user): sign in with created user succeeded ${JSON.stringify(signInJson)}`);
    if (!signInJson.success) {
      log(`FAIL (sign-in-user): response JSON success=false, message=${signInJson.message}`);
      return {
        ok: false,
        logs,
        failedStep: 'sign-in-user',
        error: { message: `sign in failed: ${signInJson.message}` },
      };
    }
    const signInJwt = signInJson.data.accessToken;
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
    const signInRefreshToken = signInJson.data.refreshToken;
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

    log('STEP 4/5: backend DELETE /auth/refresh (logout)');

    // API: ログアウトする
    const logoutRes = await repo.logout(createdUserId, signInRefreshToken);
    if (!logoutRes.ok || logoutRes.status !== 204) {
      return await failWithResponse('logout', logoutRes, 'logout returned non-2xx');
    }
    log('OK (logout): 204');

    // API: ログアウトしたリフレッシュトークンを使用する
    const unexpectedLogoutRes = await repo.refreshToken(createdUserId, signInRefreshToken);
    if (unexpectedLogoutRes.ok && unexpectedLogoutRes.status !== 401) {
      return await failWithResponse(
        'logout',
        unexpectedLogoutRes,
        'refresh token still valid after logout'
      );
    }
    log('OK (logout): refresh token invalid after logout');

    log('STEP 4.5/5: backend DELETE /users/:id');

    // API: ユーザーの削除
    const deleteRes = await repo.deleteUserById(createdUserId, createdJwt);
    if (deleteRes.status === 404) {
      return await failWithResponse('delete-user', deleteRes, 'user not found on delete');
    }
    if (deleteRes.status !== 204) {
      return await failWithResponse('delete-user', deleteRes, 'expected 204 No Content on delete');
    }
    log('OK (delete-user): 204');
    const deleteRes2 = await repo.deleteUserById(createdUserId, createdJwt);
    if (deleteRes2.status !== 404) {
      return await failWithResponse(
        'delete-user',
        deleteRes2,
        'expected 404 Not Found on second delete'
      );
    }
    log('OK (delete-user): 404 on second delete as expected');

    log('STEP 5/5: backend GET /users/:id (deleted check)');

    // API: ユーザー情報の取得（削除確認）
    const getDeletedRes = await repo.getMeUser(createdJwt);
    if (getDeletedRes.status !== 404) {
      return await failWithResponse(
        'get-user-deleted',
        getDeletedRes,
        'expected 404 Not Found after deletion'
      );
    }
    log('OK (get-user-deleted): 404');

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
