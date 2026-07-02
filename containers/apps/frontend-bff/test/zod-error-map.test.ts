import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { buildZodErrorMap } from '../src/lib/zod-error-map';

type TCall = { key: string; values?: Record<string, string | number> };

function parseWithMap(schema: z.ZodType, value: unknown) {
  const calls: TCall[] = [];
  const t = (key: string, values?: Record<string, string | number>) => {
    calls.push({ key, values });
    return key;
  };
  const result = schema.safeParse(value, { error: buildZodErrorMap(t) });
  return { result, calls };
}

// 最初の issue のメッセージ(= t が返したキー)を取り出す。
function keyOf(schema: z.ZodType, value: unknown): string {
  const { result } = parseWithMap(schema, value);
  expect(result.success).toBe(false);
  if (result.success) throw new Error('expected parse failure');
  return result.error.issues[0].message;
}

describe('zodIssueToKey (buildZodErrorMap 経由)', () => {
  it('未入力(欠落フィールド)は required', () => {
    expect(keyOf(z.object({ name: z.string() }), {})).toBe('required');
  });

  it('型違いは invalid', () => {
    expect(keyOf(z.object({ name: z.string() }), { name: 123 })).toBe('invalid');
  });

  it('min(1) の空文字は required', () => {
    expect(keyOf(z.object({ name: z.string().min(1) }), { name: '' })).toBe('required');
  });

  it('通常フィールドの min 不足は tooShort', () => {
    expect(keyOf(z.object({ bio: z.string().min(3) }), { bio: 'a' })).toBe('tooShort');
  });

  it('通常フィールドの max 超過は tooLong', () => {
    expect(keyOf(z.object({ bio: z.string().max(3) }), { bio: 'abcd' })).toBe('tooLong');
  });

  it('password の min 不足は password.tooShort', () => {
    expect(keyOf(z.object({ password: z.string().min(8) }), { password: 'abc' })).toBe(
      'password.tooShort'
    );
  });

  it('password の max 超過は password.tooLong', () => {
    expect(keyOf(z.object({ password: z.string().max(8) }), { password: 'a'.repeat(9) })).toBe(
      'password.tooLong'
    );
  });

  it('email 形式違反は email.invalid', () => {
    expect(keyOf(z.object({ email: z.email() }), { email: 'not-email' })).toBe('email.invalid');
  });

  it('url 形式違反は url.invalid', () => {
    expect(keyOf(z.object({ website: z.url() }), { website: 'not-url' })).toBe('url.invalid');
  });

  it('emoji 形式違反は badge.invalid', () => {
    expect(keyOf(z.object({ badge: z.emoji() }), { badge: 'x' })).toBe('badge.invalid');
  });

  it('path に badge を含む custom は badge.single', () => {
    const schema = z.object({ badge: z.string().refine(() => false) });
    expect(keyOf(schema, { badge: 'a' })).toBe('badge.single');
  });

  it('その他の custom は invalid', () => {
    const schema = z.object({ nickname: z.string().refine(() => false) });
    expect(keyOf(schema, { nickname: 'a' })).toBe('invalid');
  });
});

describe('ICU 値の埋め込み', () => {
  it('too_small は { min } を渡す', () => {
    const { calls } = parseWithMap(z.object({ password: z.string().min(8) }), {
      password: 'abc',
    });
    expect(calls[0].values).toEqual({ min: 8 });
  });

  it('too_big は { max } を渡す', () => {
    const { calls } = parseWithMap(z.object({ bio: z.string().max(3) }), { bio: 'abcd' });
    expect(calls[0].values).toEqual({ max: 3 });
  });
});

describe('path ガード(トップレベル primitive の parse)', () => {
  it('path が undefined でも throw せず、非 password キーにフォールバックする', () => {
    expect(() => keyOf(z.string().min(8), 'abc')).not.toThrow();
    expect(keyOf(z.string().min(8), 'abc')).toBe('tooShort');
  });
});
