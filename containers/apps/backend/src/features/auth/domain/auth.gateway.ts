export type AuthPassWorkerSpec = {
  createHash: (password: string) => Promise<string>;
  verifyPassword: (password: string) => Promise<boolean>;
};
