export type AuthPassWorkerSpec = {
  createHash: (password: string) => Promise<string>;
  verifyPassword: (password: string, storedHash: string) => Promise<boolean>;
};
