import { z } from 'zod';

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    TLS_CERT_PATH: z.string().min(1).optional(),
    TLS_KEY_PATH: z.string().min(1).optional(),
  })
  .superRefine((val, ctx) => {
    const hasCert = Boolean(val.TLS_CERT_PATH);
    const hasKey = Boolean(val.TLS_KEY_PATH);

    if (hasCert !== hasKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TLS_CERT_PATH と TLS_KEY_PATH は両方指定するか、両方未指定にしてください',
        path: hasCert ? ['TLS_KEY_PATH'] : ['TLS_CERT_PATH'],
      });
    }

    if (val.NODE_ENV === 'production' && (!hasCert || !hasKey)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'production では TLS_CERT_PATH と TLS_KEY_PATH が必須です',
        path: ['TLS_CERT_PATH'],
      });
    }
  });

export type AppEnv = z.infer<typeof EnvSchema>;

export function parseEnv(raw: NodeJS.ProcessEnv): AppEnv {
  return EnvSchema.parse({
    NODE_ENV: raw.NODE_ENV,
    PORT: raw.PORT,
    TLS_CERT_PATH: raw.TLS_CERT_PATH,
    TLS_KEY_PATH: raw.TLS_KEY_PATH,
  });
}
