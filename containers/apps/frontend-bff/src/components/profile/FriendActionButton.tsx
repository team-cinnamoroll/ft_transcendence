'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Relationship } from '@/types/user-profile';
import {
  sendFriendRequestAction,
  acceptFriendRequestAction,
  rejectFriendRequestAction,
  removeFriendAction,
} from '@/server/actions/friendship';

type Props = {
  targetUserId: string;
  targetUserName: string;
  relationship: Relationship | null;
  isOwner: boolean;
};

const buttonBaseStyle: React.CSSProperties = {
  padding: '9px 20px',
  borderRadius: 10,
  fontSize: 13.5,
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
};

const FriendActionButton = ({ targetUserId, targetUserName, relationship, isOwner }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const t = useTranslations('profilePage');

  if (isOwner || !relationship) {
    return null;
  }

  const runAction = (
    action: () => Promise<{ success: boolean; data?: { success: boolean; message?: string } }>
  ) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.success && result.data && !result.data.success) {
        setErrorMessage(result.data.message ?? t('errorGeneric'));
        return;
      }
      router.refresh();
    });
  };

  if (relationship.status === 'NONE') {
    return (
      <div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => sendFriendRequestAction(targetUserId))}
          style={{
            ...buttonBaseStyle,
            background: 'var(--mf-brand)',
            color: '#fff',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? t('removing') : t('sendRequest')}
        </button>
        {errorMessage && (
          <p style={{ fontSize: 12, color: 'var(--mf-danger, #e53e3e)', marginTop: 6 }}>
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  if (relationship.status === 'PENDING_OUTGOING' && relationship.friendshipId) {
    const friendshipId = relationship.friendshipId;
    return (
      <div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(() => rejectFriendRequestAction(friendshipId, targetUserId))}
          style={{
            ...buttonBaseStyle,
            background: 'var(--mf-surface)',
            color: 'var(--mf-text)',
            border: '0.5px solid var(--mf-line)',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? t('removing') : t('pendingRequest')}
        </button>
        {errorMessage && (
          <p style={{ fontSize: 12, color: 'var(--mf-danger, #e53e3e)', marginTop: 6 }}>
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  if (relationship.status === 'PENDING_INCOMING' && relationship.friendshipId) {
    const friendshipId = relationship.friendshipId;
    return (
      <div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction(() => acceptFriendRequestAction(friendshipId, targetUserId))}
            style={{
              ...buttonBaseStyle,
              background: 'var(--mf-brand)',
              color: '#fff',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? t('removing') : t('accept')}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => runAction(() => rejectFriendRequestAction(friendshipId, targetUserId))}
            style={{
              ...buttonBaseStyle,
              background: 'var(--mf-surface)',
              color: 'var(--mf-text)',
              border: '0.5px solid var(--mf-line)',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {t('reject')}
          </button>
        </div>
        {errorMessage && (
          <p style={{ fontSize: 12, color: 'var(--mf-danger, #e53e3e)', marginTop: 6 }}>
            {errorMessage}
          </p>
        )}
      </div>
    );
  }

  if (relationship.status === 'FRIEND') {
    return (
      <div>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setShowConfirm(true)}
          style={{
            ...buttonBaseStyle,
            background: 'var(--mf-surface)',
            color: 'var(--mf-text)',
            border: '0.5px solid var(--mf-line)',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? t('removing') : t('removeFriend')}
        </button>
        {errorMessage && (
          <p style={{ fontSize: 12, color: 'var(--mf-danger, #e53e3e)', marginTop: 6 }}>
            {errorMessage}
          </p>
        )}

        {showConfirm && (
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
                if (!isPending) setShowConfirm(false);
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
              <p
                style={{ fontSize: 13.5, color: 'var(--mf-text-sub)', margin: 0, lineHeight: 1.6 }}
              >
                {t('removeFriendConfirmMessage', { name: targetUserName })}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
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
                  onClick={() => {
                    setShowConfirm(false);
                    runAction(() => removeFriendAction(targetUserId));
                  }}
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
                  {isPending ? t('removing') : t('removeFriendConfirmButton')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

export default FriendActionButton;
