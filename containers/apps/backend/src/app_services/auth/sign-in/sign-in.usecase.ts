import {
  type AuthSignInRequest,
  type AuthSignInResponse,
  type UserRole,
  AuthSignInResponseSchema,
  UserResponseSchema,
} from '@tracen/contracts';
import type { UserRepositorySpec } from '../../../features/users/domain/users.repository';
import { type AuthPassWorkerSpec } from '../../../features/auth/domain/auth.worker';
import { getUserEntityByEmail } from '../../../features/users/domain/users.usecase';
import { ZodError } from 'zod';

// signIn の結果。role は client レスポンス(AuthSignInResponse)には含めず、
// トークン発行のために handler へ内部的に渡す（認証成功時のみ）。
export type SignInResult = {
  response: AuthSignInResponse;
  role?: UserRole;
};

export async function signIn(
  repo: UserRepositorySpec,
  worker: AuthPassWorkerSpec,
  request: AuthSignInRequest
): Promise<SignInResult> {
  try {
    const user = await getUserEntityByEmail(repo, request.email);
    if (!user) {
      return { response: failure('invalid email or password') };
    }
    const passwordMatch = await worker.verifyPassword(request.password, user.password_hash);
    if (!passwordMatch) {
      return { response: failure('invalid email or password') };
    }
    // 利用制限: suspended はログイン不可（admin が停止したアカウント）
    if (user.status === 'suspended') {
      return { response: failure('account suspended') };
    }
    return {
      response: AuthSignInResponseSchema.parse({
        success: true,
        message: undefined,
        user: UserResponseSchema.parse({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        }),
      }),
      role: user.role,
    };
  } catch (err) {
    // ドメインエラーのみハンドリング
    if (err instanceof ZodError) {
      return { response: failure('invalid request data') };
    }
    // その他のエラーはthrowして、handler側で500エラーとしてハンドリング
    throw err;
  }
}

function failure(message: string): AuthSignInResponse {
  return AuthSignInResponseSchema.parse({
    success: false,
    message,
    user: undefined,
  });
}
