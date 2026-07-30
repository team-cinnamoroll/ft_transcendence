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

// 絵文字のスキーマと型
// 見た目上の文字数（書記素クラスター）を分割するためのセグメンター
const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
export const EmojiSchema = z
  .emoji() // 絵文字判定（メッセージは errorMap で i18n）
  .refine((val) => {
    // 見た目上の文字数が1文字であるかを判定
    return [...segmenter.segment(val)].length === 1;
  }); // バッジ絵文字

// 公開範囲を表す列挙型のスキーマと型
export const VisibilityStatusSchema = z.enum(['public', 'private']);
export type VisibilityStatus = z.infer<typeof VisibilityStatusSchema>;
