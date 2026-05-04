import { z } from 'zod';

const BooleanFromEnv = z.preprocess((val) => {
  if (typeof val === 'string') {
    const normalized = val.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return val;
}, z.boolean().optional().default(false));

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    TLS_CERT_PATH: z.string().min(1).optional(),
    TLS_KEY_PATH: z.string().min(1).optional(),
    DATABASE_URL: z.string().url().optional(),
    RUN_MIGRATIONS: BooleanFromEnv,
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

    if (val.NODE_ENV === 'production' && !val.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'production では DATABASE_URL が必須です',
        path: ['DATABASE_URL'],
      });
    }

    if (val.RUN_MIGRATIONS && !val.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'RUN_MIGRATIONS=true の場合、DATABASE_URL が必須です',
        path: ['DATABASE_URL'],
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
    DATABASE_URL: raw.DATABASE_URL,
    RUN_MIGRATIONS: raw.RUN_MIGRATIONS,
  });
}
