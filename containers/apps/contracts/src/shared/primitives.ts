import { z } from 'zod';

// ここには、プロジェクト全体で使用される基本的なプリミティブ型やスキーマを定義します。

// Emailアドレスのスキーマと型
export const EmailSchema = z.string().email();
export type Email = z.infer<typeof EmailSchema>;

// UUIDのスキーマと型
export const UuidSchema = z.string().uuid();
export type Uuid = z.infer<typeof UuidSchema>;

// ISO 8601形式の日時文字列のスキーマと型
export const IsoDateTimeStringSchema = z.string().datetime();
export type IsoDateTimeString = z.infer<typeof IsoDateTimeStringSchema>;
