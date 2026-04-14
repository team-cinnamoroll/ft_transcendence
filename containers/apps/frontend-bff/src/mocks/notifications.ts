import { type Notification } from "@/types/notification";

/**
 * currentUser（山田 太郎 / user-1）宛の通知ダミーデータ。
 *
 * - link: 誰かが user-1 のアクティビティをリンクした
 * - subscribe: 誰かが user-1 のフェイスをサブスクライブした
 *
 * createdAt 降順（最新が先頭）で定義。
 */
export const notifications: Notification[] = [
  {
    id: "notif-1",
    type: "subscribe",
    fromUserId: "user-4",
    faceId: "face-1-1",
    createdAt: "2026-03-30T09:12:00+09:00",
  },
  {
    id: "notif-2",
    type: "link",
    fromUserId: "user-2",
    activityId: "act-1-1-7",
    createdAt: "2026-03-28T18:45:00+09:00",
  },
  {
    id: "notif-3",
    type: "subscribe",
    fromUserId: "user-3",
    faceId: "face-1-2",
    createdAt: "2026-03-25T14:00:00+09:00",
  },
  {
    id: "notif-4",
    type: "link",
    fromUserId: "user-3",
    activityId: "act-1-1-6",
    createdAt: "2026-03-20T21:30:00+09:00",
  },
  {
    id: "notif-5",
    type: "subscribe",
    fromUserId: "user-2",
    faceId: "face-1-1",
    createdAt: "2026-03-15T10:22:00+09:00",
  },
  {
    id: "notif-6",
    type: "link",
    fromUserId: "user-4",
    activityId: "act-1-1-5",
    createdAt: "2026-03-10T08:05:00+09:00",
  },
];
