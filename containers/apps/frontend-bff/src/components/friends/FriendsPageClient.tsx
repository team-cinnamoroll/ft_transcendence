'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { FriendProfileWithOnlineStatus, UnconfirmedFriendProfile } from '@/types/friendship';
import type { UserProfile } from '@/types/user-profile';
import { getAvatarUrl } from '@/lib/display';
import {
  acceptFriendRequestAction,
  rejectFriendRequestAction,
  removeFriendAction,
  loadMoreFriendsAction,
  loadMorePendingRequestsAction,
} from '@/server/actions/friendship';
import { refreshOnlineStatusesAction } from '@/server/actions/presence';
import { HEARTBEAT_INTERVAL_MS } from '@/lib/heartbeat-provider';

type Tab = 'friend' | 'outgoing' | 'incoming';

type Props = {
  initialFriends: FriendProfileWithOnlineStatus[];
  friendsNextCursor: string | null;
  initialOutgoing: UnconfirmedFriendProfile[];
  outgoingNextCursor: string | null;
  initialIncoming: UnconfirmedFriendProfile[];
  incomingNextCursor: string | null;
};

const actionButtonStyle: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 9,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

const neutralButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: 'var(--mf-surface)',
  border: '0.5px solid var(--mf-line)',
  color: 'var(--mf-text)',
};

const primaryButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: 'var(--mf-brand)',
  border: 'none',
  color: '#fff',
};

// ── PersonRow ───────────────────────────────────────────────────

type PersonRowProps = {
  profile: UserProfile;
  isOnline?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

const PersonRow = ({ profile, isOnline, disabled, children }: PersonRowProps) => {
  const t = useTranslations('friendsPage');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: '0.5px solid var(--mf-line-soft)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Link
        href={`/profile/${profile.id}`}
        style={{ position: 'relative', flexShrink: 0, display: 'block' }}
      >
        <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden' }}>
          <Image
            src={getAvatarUrl(profile)}
            alt={profile.name}
            width={44}
            height={44}
            style={{ objectFit: 'cover', display: 'block', width: '100%', height: '100%' }}
          />
        </div>
        {isOnline !== undefined && (
          <span
            role="img"
            aria-label={isOnline ? t('online') : t('offline')}
            style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              width: 11,
              height: 11,
              borderRadius: '50%',
              background: isOnline ? '#4caf50' : '#9aa0a6',
              border: '2px solid var(--mf-bg-light)',
            }}
          />
        )}
      </Link>
      <Link
        href={`/profile/${profile.id}`}
        className="hover:underline"
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--mf-brand)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {profile.name}
      </Link>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{children}</div>
    </div>
  );
};

// ── FriendsPageClient ────────────────────────────────────────────

const FriendsPageClient = ({
  initialFriends,
  friendsNextCursor,
  initialOutgoing,
  outgoingNextCursor,
  initialIncoming,
  incomingNextCursor,
}: Props) => {
  const t = useTranslations('friendsPage');
  const [tab, setTab] = useState<Tab>('friend');
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<FriendProfileWithOnlineStatus | null>(null);

  const [friends, setFriends] = useState(initialFriends);
  const [friendsCursor, setFriendsCursor] = useState(friendsNextCursor);
  const [outgoing, setOutgoing] = useState(initialOutgoing);
  const [outgoingCursor, setOutgoingCursor] = useState(outgoingNextCursor);
  const [incoming, setIncoming] = useState(initialIncoming);
  const [incomingCursor, setIncomingCursor] = useState(incomingNextCursor);

  const sortedFriends = [...friends].sort((a, b) => Number(b.isOnline) - Number(a.isOnline));

  // 表示中フレンドの userId 一覧を setInterval のクロージャから最新の状態で参照するための ref
  const friendsRef = useRef(friends);
  friendsRef.current = friends;

  useEffect(() => {
    const tick = () => {
      const userIds = friendsRef.current.map((friend) => friend.friendProfile.id);
      if (userIds.length === 0) return;

      void refreshOnlineStatusesAction(userIds).then((onlineStatuses) => {
        if (!onlineStatuses) return;
        setFriends((prev) =>
          prev.map((friend) => ({
            ...friend,
            isOnline: onlineStatuses[friend.friendProfile.id] ?? friend.isOnline,
          }))
        );
      });
    };

    const id = setInterval(tick, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const handleLoadMoreFriends = () => {
    startTransition(async () => {
      const result = await loadMoreFriendsAction(friendsCursor);
      if (!result.success) {
        setErrorMessage(t('errorGeneric'));
        return;
      }
      setFriends((prev) => [...prev, ...result.data.friendships]);
      setFriendsCursor(result.data.nextCursor);
    });
  };

  const handleLoadMoreOutgoing = () => {
    startTransition(async () => {
      const result = await loadMorePendingRequestsAction('outgoing', outgoingCursor);
      if (!result.success) {
        setErrorMessage(t('errorGeneric'));
        return;
      }
      setOutgoing((prev) => [...prev, ...result.data.pendingRequests]);
      setOutgoingCursor(result.data.nextCursor);
    });
  };

  const handleLoadMoreIncoming = () => {
    startTransition(async () => {
      const result = await loadMorePendingRequestsAction('incoming', incomingCursor);
      if (!result.success) {
        setErrorMessage(t('errorGeneric'));
        return;
      }
      setIncoming((prev) => [...prev, ...result.data.pendingRequests]);
      setIncomingCursor(result.data.nextCursor);
    });
  };

  const handleCancelOutgoing = (requestId: string, targetUserId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await rejectFriendRequestAction(requestId, targetUserId);
      if (result.success && result.data.success) {
        setOutgoing((prev) => prev.filter((item) => item.requestId !== requestId));
      } else {
        setErrorMessage(t('errorGeneric'));
      }
    });
  };

  const handleAcceptIncoming = (requestId: string, targetUserId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await acceptFriendRequestAction(requestId, targetUserId);
      if (result.success && result.data.success) {
        setIncoming((prev) => prev.filter((item) => item.requestId !== requestId));
      } else {
        setErrorMessage(t('errorGeneric'));
      }
    });
  };

  const handleRejectIncoming = (requestId: string, targetUserId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await rejectFriendRequestAction(requestId, targetUserId);
      if (result.success && result.data.success) {
        setIncoming((prev) => prev.filter((item) => item.requestId !== requestId));
      } else {
        setErrorMessage(t('errorGeneric'));
      }
    });
  };

  const handleRemoveFriend = () => {
    if (!confirmTarget) return;
    const targetUserId = confirmTarget.friendProfile.id;
    setErrorMessage(null);
    startTransition(async () => {
      const result = await removeFriendAction(targetUserId);
      if (result.success && result.data.success) {
        setFriends((prev) => prev.filter((item) => item.friendProfile.id !== targetUserId));
      } else {
        setErrorMessage(t('errorGeneric'));
      }
      setConfirmTarget(null);
    });
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'friend', label: t('tabFriend') },
    { key: 'outgoing', label: t('tabOutgoing') },
    { key: 'incoming', label: t('tabIncoming') },
  ];

  return (
    <div>
      <div
        style={{
          padding: '14px 18px 10px',
          display: 'flex',
          gap: 6,
          borderBottom: '0.5px solid var(--mf-line-soft)',
        }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              padding: '5px 11px',
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 600,
              background: tab === key ? 'var(--mf-brand)' : 'transparent',
              color: tab === key ? '#fff' : 'var(--mf-text-sub)',
              border: tab === key ? 'none' : '1px solid var(--mf-line)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {errorMessage && (
        <p style={{ fontSize: 12, color: 'var(--mf-danger, #e53e3e)', padding: '10px 18px 0' }}>
          {errorMessage}
        </p>
      )}

      {tab === 'friend' && (
        <div style={{ padding: '4px 18px' }}>
          {sortedFriends.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: 'var(--mf-text-muted)',
                textAlign: 'center',
                padding: '60px 0',
              }}
            >
              {t('noFriends')}
            </p>
          ) : (
            sortedFriends.map((friend) => (
              <PersonRow
                key={friend.friendshipId}
                profile={friend.friendProfile}
                isOnline={friend.isOnline}
                disabled={isPending}
              >
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setConfirmTarget(friend)}
                  style={neutralButtonStyle}
                >
                  {t('removeFriend')}
                </button>
              </PersonRow>
            ))
          )}
          {friendsCursor && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <button
                type="button"
                onClick={handleLoadMoreFriends}
                disabled={isPending}
                style={neutralButtonStyle}
              >
                {isPending ? t('loading') : t('loadMore')}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'outgoing' && (
        <div style={{ padding: '4px 18px' }}>
          {outgoing.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: 'var(--mf-text-muted)',
                textAlign: 'center',
                padding: '60px 0',
              }}
            >
              {t('noOutgoing')}
            </p>
          ) : (
            outgoing.map((item) => (
              <PersonRow key={item.requestId} profile={item.userProfile} disabled={isPending}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleCancelOutgoing(item.requestId, item.userProfile.id)}
                  style={neutralButtonStyle}
                >
                  {t('cancelRequest')}
                </button>
              </PersonRow>
            ))
          )}
          {outgoingCursor && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <button
                type="button"
                onClick={handleLoadMoreOutgoing}
                disabled={isPending}
                style={neutralButtonStyle}
              >
                {isPending ? t('loading') : t('loadMore')}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'incoming' && (
        <div style={{ padding: '4px 18px' }}>
          {incoming.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: 'var(--mf-text-muted)',
                textAlign: 'center',
                padding: '60px 0',
              }}
            >
              {t('noIncoming')}
            </p>
          ) : (
            incoming.map((item) => (
              <PersonRow key={item.requestId} profile={item.userProfile} disabled={isPending}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleAcceptIncoming(item.requestId, item.userProfile.id)}
                  style={primaryButtonStyle}
                >
                  {t('accept')}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRejectIncoming(item.requestId, item.userProfile.id)}
                  style={neutralButtonStyle}
                >
                  {t('reject')}
                </button>
              </PersonRow>
            ))
          )}
          {incomingCursor && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <button
                type="button"
                onClick={handleLoadMoreIncoming}
                disabled={isPending}
                style={neutralButtonStyle}
              >
                {isPending ? t('loading') : t('loadMore')}
              </button>
            </div>
          )}
        </div>
      )}

      {confirmTarget && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(20,24,36,0.50)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => {
              if (!isPending) setConfirmTarget(null);
            }}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              zIndex: 50,
              width: 'calc(100% - 2rem)',
              maxWidth: 360,
              borderRadius: 18,
              background: 'var(--mf-bg-light)',
              border: '0.5px solid var(--mf-line)',
              boxShadow: '0 20px 60px rgba(30,42,74,0.18)',
              padding: '24px 20px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
              {t('removeFriendConfirmTitle')}
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--mf-text-sub)', margin: 0, lineHeight: 1.6 }}>
              {t('removeFriendConfirmMessage', { name: confirmTarget.friendProfile.name })}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                disabled={isPending}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  background: 'var(--mf-surface)',
                  border: '0.5px solid var(--mf-line)',
                  color: 'var(--mf-text)',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {t('removeFriendCancel')}
              </button>
              <button
                type="button"
                onClick={handleRemoveFriend}
                disabled={isPending}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 700,
                  background: isPending ? 'var(--mf-surface-tint)' : 'var(--mf-danger, #e53e3e)',
                  border: 'none',
                  color: isPending ? 'var(--mf-text-faint)' : '#fff',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? t('processing') : t('removeFriendConfirmButton')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsPageClient;
