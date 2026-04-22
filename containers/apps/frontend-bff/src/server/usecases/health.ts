import 'server-only';

import crypto from 'node:crypto';

import { createUserSchema, type User } from '@tracen/contracts';

import { getBackendHealthRepository } from '@/repositories/backend-health-repository';

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
  | 'get-user-exists'
  | 'delete-user'
  | 'get-user-deleted'
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

    const nonce = crypto.randomUUID();
    const email = `healthcheck+${Date.now()}-${nonce.slice(0, 8)}@example.com`;
    const name = `healthcheck-${nonce.slice(0, 8)}`;

    const createUserInput = createUserSchema.parse({ email, name });

    log('STEP 2/5: backend POST /users (create test user)');
    const createRes = await repo.createUser(createUserInput);
    if (createRes.status === 409) {
      // Should be unlikely with randomized email, but keep message clear.
      return await failWithResponse('create-user', createRes, 'email already exists (conflict)');
    }
    if (!createRes.ok) {
      return await failWithResponse('create-user', createRes, 'user creation returned non-2xx');
    }

    const created = (await createRes.json()) as { id?: string };
    const createdUserId = created.id;
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

    log('STEP 3/5: backend GET /users/:id (exists check)');
    const getExistsRes = await repo.getUserById(createdUserId);
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

    log('STEP 4/5: backend DELETE /users/:id');
    const deleteRes = await repo.deleteUserById(createdUserId);
    if (deleteRes.status === 404) {
      return await failWithResponse('delete-user', deleteRes, 'user not found on delete');
    }
    if (deleteRes.status !== 204) {
      return await failWithResponse('delete-user', deleteRes, 'expected 204 No Content on delete');
    }
    log('OK (delete-user): 204');

    log('STEP 5/5: backend GET /users/:id (deleted check)');
    const getDeletedRes = await repo.getUserById(createdUserId);
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
