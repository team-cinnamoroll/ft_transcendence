import 'server-only';

import type { CreateUserRequest } from '@tracen/contracts';

import { getBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';

export type BackendHealthRepositorySpec = {
  backendHealth: () => Promise<Response>;
  createUser: (input: CreateUserRequest) => Promise<Response>;
  getUserById: (id: string) => Promise<Response>;
  deleteUserById: (id: string) => Promise<Response>;
};

export function createBackendHealthRepositoryImpl(): BackendHealthRepositorySpec {
  return {
    backendHealth: async () => {
      return await getBackendClient().api.v1.health.$get();
    },

    createUser: async (input) => {
      return await getBackendClient().api.v1.users.$post({ json: input });
    },

    getUserById: async (id) => {
      return await getBackendClient().api.v1.users[':id'].$get({ param: { id } });
    },

    deleteUserById: async (id) => {
      return await getBackendClient().api.v1.users[':id'].$delete({ param: { id } });
    },
  };
}

export const backendHealthRepositoryImpl: BackendHealthRepositorySpec =
  createBackendHealthRepositoryImpl();

export const getBackendHealthRepository = createSingletonProvider<BackendHealthRepositorySpec>(
  () => backendHealthRepositoryImpl
);
