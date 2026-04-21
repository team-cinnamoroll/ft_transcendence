'use client';

import Avatar from '@/components/ui/Avatar';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import { type Notification } from '@/types/notification';
import { type User } from '@/types/user';
import { formatRelativeTime } from '@/lib/format-relative-time';
import { createLookupMap, getFaceTitle } from '@/lib/display';
import { cn } from '@/lib/utils';
import { useDetailPanel } from '@/lib/detail-panel-context';

// ─── 通知アイテム ──────────────────────────────────────────────

type NotificationItemProps = {
  notification: Notification;
  fromUser: User;
  detail: string;
  /** リンク通知の場合のアクティビティ本文スニペット（任意） */
  activitySnippet?: string;
  /** リンク通知の場合の紐づくアクティビティID */
  activityId?: string;
};

const NotificationItem = ({
  notification,
  fromUser,
  detail,
  activitySnippet,
  activityId,
}: NotificationItemProps) => {
  const { openActivity, state } = useDetailPanel();
  const isLink = notification.type === 'link';

  const isSelected =
    state.type === 'activity' && activityId !== undefined && state.activityId === activityId;

  const handleClick = () => {
    if (activityId) openActivity(activityId);
  };

  return (
    <li
      onClick={handleClick}
      className={cn(
        'flex gap-3 rounded-2xl bg-zinc-800/60 p-4 transition',
        activityId && 'md:cursor-pointer hover:bg-zinc-800',
        isSelected && 'ring-1 ring-violet-500/40 bg-zinc-800'
      )}
    >
      {/* アバター */}
      <div className="shrink-0">
        <Avatar src={fromUser.avatarUrl} alt={fromUser.name} size="md" />
      </div>

      {/* 本文 */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
        {/* アクション行 */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-zinc-200 leading-snug">
            <span className="font-semibold text-zinc-100">{fromUser.name}</span>
            {' さんが '}
            <span className="text-violet-400">{detail}</span>
          </p>
          <span className="shrink-0 text-xs text-zinc-500">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        {/* リンク通知: アクティビティ本文スニペット */}
        {isLink && activitySnippet && (
          <blockquote className="rounded-lg border-l-2 border-violet-500/60 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400 line-clamp-2">
            {activitySnippet}
          </blockquote>
        )}

        {/* 通知種別バッジ */}
        <span className="self-start rounded-full bg-zinc-700/60 px-2 py-0.5 text-xs text-zinc-400">
          {isLink ? '🔗 リンク' : '📥 サブスク'}
        </span>
      </div>
    </li>
  );
};

// ─── NotificationList ──────────────────────────────────────────

/**
 * 通知一覧コンポーネント（Client Component）。
 * notificationRepository から全通知を取得し、時系列降順で表示する。
 * リンク通知のアイテムをクリックすると DetailPanel に紐づくアクティビティを表示する。
 */
type Props = {
  notifications: Notification[];
  users: User[];
  faces: Face[];
  activities: Activity[];
};

const NotificationList = ({ notifications, users, faces, activities }: Props) => {
  const userMap = createLookupMap(users, (user) => user.id);
  const faceMap = createLookupMap(faces, (face) => face.id);
  const activityMap = createLookupMap(activities, (activity) => activity.id);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-4xl">🔔</p>
        <p className="text-sm text-zinc-400">まだ通知はありません</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {notifications.map((notification) => {
        const fromUser = userMap.get(notification.fromUserId);
        if (!fromUser) return null;

        if (notification.type === 'link') {
          const activity = activityMap.get(notification.activityId);
          const detail = 'あなたの投稿をリンクしました';
          return (
            <NotificationItem
              key={notification.id}
              notification={notification}
              fromUser={fromUser}
              detail={detail}
              activitySnippet={activity?.body}
              activityId={notification.activityId}
            />
          );
        }

        // subscribe
        const face = faceMap.get(notification.faceId);
        const faceName = face ? getFaceTitle(face) : notification.faceId;
        const detail = `${faceName} をサブスクライブしました`;
        return (
          <NotificationItem
            key={notification.id}
            notification={notification}
            fromUser={fromUser}
            detail={detail}
          />
        );
      })}
    </ul>
  );
};

export default NotificationList;
