import { z } from 'zod';

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_BFF_API_BASE_URL: z.string().url(),
});

export const publicEnv = PublicEnvSchema.parse({
  NEXT_PUBLIC_BFF_API_BASE_URL: process.env.NEXT_PUBLIC_BFF_API_BASE_URL,
});
