import { z } from 'zod';
import * as fs from 'fs';
import * as crypto from 'crypto';
// import * as path from 'path';

const BooleanFromEnv = z.preprocess((val) => {
  if (typeof val === 'string') {
    const normalized = val.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return val;
}, z.boolean().optional().default(false));

const jwksCacheSchema = z
  .object({
    keys: z.array(
      z.looseObject({
        // 記述していない他のプロパティ（RSA鍵の n や e など）があってもエラーにせず保持します
        kty: z.string(), // 鍵の種類（"RSA" など）
        kid: z.string(), // 鍵の識別子（"key_v1" など）
        alg: z.string().optional(), // アルゴリズム（"RS256" など）
        use: z.string().optional(), // 用途（"sig" など）
      })
    ),
  })
  .nullable();

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    TLS_CERT_PATH: z.string().min(1).optional(),
    TLS_KEY_PATH: z.string().min(1).optional(),
    DATABASE_URL: z.string().url(),
    PEPPER: z.string().min(1),
    JWKS_PUBLIC: jwksCacheSchema,
    JWT_PRIVATE_KEY_PEM: z.string().min(1),
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

export type RawEnv = z.input<typeof EnvSchema>;
export type JWKSCache = z.infer<typeof jwksCacheSchema>;
export type Config = z.infer<typeof EnvSchema>;

let PUBLIC_KEY_PATH = '/jwt-certs/public.pem';
if (process.env.NODE_ENV === 'development') {
  PUBLIC_KEY_PATH = '/workspace/jwt-certs/public.pem';
}
let jwksCache: JWKSCache = null;

console.warn('🔍 JWKS の初期化を開始します...');

try {
  // 1. 起動時に公開鍵ファイルが存在するか確認して読み込む
  if (fs.existsSync(PUBLIC_KEY_PATH)) {
    const pemString = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

    // 2. Node.js標準のcryptoを使って、PEM文字列を鍵オブジェクトに変換
    const publicKey = crypto.createPublicKey(pemString);

    // 3. 鍵オブジェクトを JWK (JSON Web Key) 形式にエクスポート
    const jwk = publicKey.export({ format: 'jwk' });

    // 4. JWKSの規格に適合するようにメタデータを付与してキャッシュ
    const rawJwks = {
      keys: [
        {
          ...jwk,
          kid: 'key_v1', // 【重要】鍵の識別子。BFF側が鍵を識別・キャッシュするために必須
          alg: 'RS256', // 使用する署名アルゴリズム
          use: 'sig', // 用途が署名（signature）であることを明示
        },
      ],
    };

    jwksCache = jwksCacheSchema.parse(rawJwks);
    console.warn('✅ JWKS の初期化に成功しました。');
  } else {
    console.error(`❌ 公開鍵ファイルが見つかりません。cwd=${process.cwd()}`);
  }
} catch (err) {
  console.error('❌ JWKSの生成中にエラーが発生しました:', err);
}

let PRIVATE_KEY_PATH = '/jwt-certs/private.pem';
if (process.env.NODE_ENV === 'development') {
  PRIVATE_KEY_PATH = '/workspace/jwt-certs/private.pem';
}
let privateKey: string | null = null;
try {
  if (fs.existsSync(PRIVATE_KEY_PATH)) {
    privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  }
} catch (err) {
  console.error('❌ 秘密鍵ファイルの読み込み中にエラーが発生しました:', err);
  throw err; // 秘密鍵がないとサーバーは正常に動作しないため、ここで例外を投げて起動を停止します
}

export function parseEnv(raw: NodeJS.ProcessEnv): Config {
  return EnvSchema.parse({
    NODE_ENV: raw.NODE_ENV,
    PORT: raw.PORT,
    TLS_CERT_PATH: raw.TLS_CERT_PATH,
    TLS_KEY_PATH: raw.TLS_KEY_PATH,
    DATABASE_URL: raw.DATABASE_URL,
    PEPPER: raw.PEPPER,
    JWKS_PUBLIC: jwksCache,
    JWT_PRIVATE_KEY_PEM: privateKey,
    RUN_MIGRATIONS: raw.RUN_MIGRATIONS,
  });
}
