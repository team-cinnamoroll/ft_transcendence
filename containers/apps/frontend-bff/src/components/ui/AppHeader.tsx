'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { UserProfile } from '@/types/user-profile';
import { getAvatarUrl } from '@/lib/display';
import Wordmark from '@/components/ui/Wordmark';
import AccountMenu from '@/components/ui/AccountMenu';

type Props = {
  user: UserProfile;
  realUserId?: string;
  faceCount?: number;
  seedCount?: number;
  unreadCount?: number;
  isAuthenticated: boolean;
};

const AppHeader = ({
  user,
  realUserId,
  faceCount = 0,
  seedCount = 0,
  unreadCount = 0,
  isAuthenticated,
}: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations('appHeader');
  const tNav = useTranslations('nav');

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
            href="/notifications"
            style={{
              position: 'relative',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label={tNav('notifications')}
          >
            <svg
              width={20}
              height={20}
              viewBox="0 0 20 20"
              fill="none"
              stroke="var(--mf-brand)"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4.5 14.5h11l-1.3-1.7c-.5-.7-.8-1.5-.8-2.3V7.8a3.4 3.4 0 00-6.8 0v2.7c0 .8-.3 1.6-.8 2.3l-1.3 1.7z" />
              <path d="M8.5 16.5a1.5 1.5 0 003 0" />
            </svg>
            {unreadCount > 0 && (
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
