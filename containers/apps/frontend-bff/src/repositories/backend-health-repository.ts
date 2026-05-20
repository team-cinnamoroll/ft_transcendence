import 'server-only';

import type { SignUpRequest } from '@tracen/contracts';

import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';

export type BackendHealthRepositorySpec = {
  backendHealth: () => Promise<Response>;
  getJWKS: () => Promise<Response>;
  signUpUser: (input: SignUpRequest) => Promise<Response>;
  getUserById: (id: string, token: string) => Promise<Response>;
  deleteUserById: (id: string, token: string) => Promise<Response>;
};

export function createBackendHealthRepositoryImpl(): BackendHealthRepositorySpec {
  return {
    backendHealth: async () => {
      return await createBackendClient().api.v1.health.$get();
    },

    getJWKS: async () => {
      return await createBackendClient().api.v1['.well-known']['jwks.json'].$get();
    },

    signUpUser: async (input) => {
      return await createBackendClient().api.v1.auth['sign-up'].$post({ json: input });
    },

    getUserById: async (id, token) => {
      return await createBackendClient(token).api.v1.users[':id'].$get({ param: { id } });
    },

    deleteUserById: async (id, token) => {
      return await createBackendClient(token).api.v1.users[':id'].$delete({ param: { id } });
    },
  };
}

export const backendHealthRepositoryImpl: BackendHealthRepositorySpec =
  createBackendHealthRepositoryImpl();

export const getBackendHealthRepository = createSingletonProvider<BackendHealthRepositorySpec>(
  () => backendHealthRepositoryImpl
);
