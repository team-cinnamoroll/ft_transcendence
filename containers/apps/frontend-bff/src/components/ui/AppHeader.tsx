'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { UserProfile } from '@/types/user-profile';
import { getAvatarUrl } from '@/lib/display';
import { useHasPendingFriendRequest } from '@/lib/heartbeat-provider';
import Wordmark from '@/components/ui/Wordmark';
import AccountMenu from '@/components/ui/AccountMenu';

type Props = {
  user: UserProfile;
  realUserId?: string;
  faceCount?: number;
  seedCount?: number;
  isAuthenticated: boolean;
};

const AppHeader = ({ user, realUserId, faceCount = 0, seedCount = 0, isAuthenticated }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations('appHeader');
  const tNav = useTranslations('nav');
  const hasPendingFriendRequest = useHasPendingFriendRequest();

  return (
    <>
      <header
        className="md:hidden flex items-center justify-between shrink-0"
        style={{
          height: 52,
          padding: '0 18px',
          background: 'var(--mf-bg-light)',
          borderBottom: '0.5px solid var(--mf-line)',
        }}
      >
        <Wordmark size={19} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/friends"
            style={{
              position: 'relative',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={tNav('friends')}
          >
            <svg
              width={20}
              height={20}
              viewBox="0 0 22 22"
              fill="none"
              stroke="var(--mf-brand)"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx={8} cy={8} r={3} />
              <path d="M3 18c0-3 2.2-5 5-5s5 2 5 5" />
              <circle cx={15.5} cy={7} r={2.3} />
              <path d="M14.3 12.3c2.3.3 3.9 2.1 3.9 4.4" />
            </svg>
            {hasPendingFriendRequest && (
              <span
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 9,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--mf-accent)',
                  boxShadow: '0 0 0 2px var(--mf-bg-light)',
                }}
              />
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label={t('accountMenuAriaLabel')}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Image
              src={getAvatarUrl(user)}
              alt={user.name}
              width={30}
              height={30}
              style={{ objectFit: 'cover', display: 'block' }}
            />
          </button>
        </div>
      </header>

      <AccountMenu
        user={user}
        realUserId={realUserId}
        faceCount={faceCount}
        seedCount={seedCount}
        isOpen={menuOpen}
        isAuthenticated={isAuthenticated}
        onClose={() => setMenuOpen(false)}
      />
    </>
  );
};

export default AppHeader;
