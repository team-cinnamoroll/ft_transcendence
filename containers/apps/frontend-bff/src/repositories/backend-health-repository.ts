import 'server-only';

import type { AuthSignUpRequest, AuthSignInRequest } from '@tracen/contracts';

import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';

export type BackendHealthRepositorySpec = {
  backendHealth: () => Promise<Response>;
  backendHealthRedis: () => Promise<Response>;
  getJWKS: () => Promise<Response>;
  signUpUser: (input: AuthSignUpRequest) => Promise<Response>;
  signInUser: (input: AuthSignInRequest) => Promise<Response>;
  getMeUser: (token: string) => Promise<Response>;
  deleteUserById: (id: string, token: string) => Promise<Response>;
  refreshToken: (refreshToken: string) => Promise<Response>;
  logout: (refreshToken: string) => Promise<Response>;
};

export function createBackendHealthRepositoryImpl(): BackendHealthRepositorySpec {
  return {
    backendHealth: async () => {
      return await createBackendClient().api.v1.health.$get();
    },

    backendHealthRedis: async () => {
      return await createBackendClient().api.v1.health.redis.$get();
    },

    getJWKS: async () => {
      return await createBackendClient().api.v1['.well-known']['jwks.json'].$get();
    },

    signUpUser: async (input) => {
      return await createBackendClient().api.v1.auth['sign-up'].$post({ json: input });
    },

    signInUser: async (input) => {
      return await createBackendClient().api.v1.auth['sign-in'].$post({ json: input });
    },

    getMeUser: async (token) => {
      return await createBackendClient(token).api.v1.users.me.$get();
    },

    deleteUserById: async (id, token) => {
      return await createBackendClient(token).api.v1.users[':id'].$delete({ param: { id } });
    },
    refreshToken: async (refreshToken) => {
      return await createBackendClient().api.v1.auth.refresh.$post({ json: { refreshToken } });
    },
    logout: async (refreshToken) => {
      return await createBackendClient().api.v1.auth.refresh.$delete({ json: { refreshToken } });
    },
  };
}

export const backendHealthRepositoryImpl: BackendHealthRepositorySpec =
  createBackendHealthRepositoryImpl();

export const getBackendHealthRepository = createSingletonProvider<BackendHealthRepositorySpec>(
  () => backendHealthRepositoryImpl
);
