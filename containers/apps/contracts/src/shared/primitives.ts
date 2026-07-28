import { z } from 'zod';

// ここには、プロジェクト全体で使用される基本的なプリミティブ型やスキーマを定義します。

// Emailアドレスのスキーマと型
export const EmailSchema = z.email();
export type Email = z.infer<typeof EmailSchema>;

// UUIDのスキーマと型
export const UuidSchema = z.uuid();
export type Uuid = z.infer<typeof UuidSchema>;

// ISO 8601形式の日時文字列のスキーマと型
export const IsoDateTimeStringSchema = z.iso.datetime();
export type IsoDateTimeString = z.infer<typeof IsoDateTimeStringSchema>;

// ファイルパス
export const FilePathSchema = z.string().min(1).max(255);
export type FilePath = z.infer<typeof FilePathSchema>;

// オンライン状態
export const IsOnlineSchema = z.boolean();
export type IsOnline = z.infer<typeof IsOnlineSchema>;

// リスト取得のリクエストにおける件数制限のスキーマと型
export const ListRequestLimitSchema = z.coerce.number().int().min(1).max(100).default(20); // 1~100件の範囲で指定、デフォルトは20件
export type ListRequestLimit = z.infer<typeof ListRequestLimitSchema>;
