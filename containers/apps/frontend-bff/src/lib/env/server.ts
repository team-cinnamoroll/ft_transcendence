import 'server-only';

import { z } from 'zod';

const ServerEnvSchema = z
  .object({
    APP_API_BASE_URL: z.string().url(),
    NODE_EXTRA_CA_CERTS: z.string().min(1).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.APP_API_BASE_URL.startsWith('https://') && !val.NODE_EXTRA_CA_CERTS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['NODE_EXTRA_CA_CERTS'],
        message: 'APP_API_BASE_URL が https の場合、NODE_EXTRA_CA_CERTS が必須です',
      });
    }
  });

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (!cached) {
    cached = ServerEnvSchema.parse({
      APP_API_BASE_URL: process.env.APP_API_BASE_URL,
      NODE_EXTRA_CA_CERTS: process.env.NODE_EXTRA_CA_CERTS,
    });
  }
  return cached;
}
