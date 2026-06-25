'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { UserProfile } from '@/types/user-profile';

type Props = {
  user: UserProfile;
  faceCount: number;
  seedCount: number;
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
};

const AccountMenu = ({ user, faceCount, seedCount, isOpen, onClose }: Props) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('accountMenu');

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems: { icon: React.ReactNode; title: string; sub: string | null; href?: string }[] = [
    {
      icon: (
        <svg
          width={15}
          height={15}
          viewBox="0 0 20 20"
          fill="none"
          stroke="var(--mf-brand)"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 17l1-3.5L13 4.5l3.5 3.5L7.5 17H3z" />
          <path d="M12 5.5l3.5 3.5" />
        </svg>
      ),
      title: t('settings'),
      sub: t('settingsSub'),
      href: '/settings',
    },
    {
      icon: (
        <svg
          width={15}
          height={15}
          viewBox="0 0 20 20"
          fill="none"
          stroke="var(--mf-brand)"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx={10} cy={10} r={2.5} />
          <path d="M10 3v1.5M10 15.5V17M3 10h1.5M15.5 10H17M4.9 4.9l1 1M14.1 14.1l1 1M4.9 15.1l1-1M14.1 5.9l1-1" />
        </svg>
      ),
      title: t('otherSettings'),
      sub: t('otherSettingsSub'),
    },
    {
      icon: (
        <svg
          width={15}
          height={15}
          viewBox="0 0 15 15"
          fill="none"
          stroke="var(--mf-brand)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx={7.5} cy={7.5} r={6} />
          <path d="M5.5 5.5a2 2 0 014 0c0 1.5-2 1.5-2 3M7.5 11h.01" />
        </svg>
      ),
      title: t('help'),
      sub: null,
    },
  ];

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 80,
          background: 'rgba(20,24,36,0.32)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: 60,
          right: 12,
          zIndex: 81,
          width: 304,
          background: 'var(--mf-bg-light)',
          borderRadius: 18,
          padding: '16px 14px 10px',
          boxShadow: '0 20px 60px rgba(20,24,36,0.32), 0 0 0 0.5px rgba(30,42,74,0.1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -7,
            right: 24,
            width: 14,
            height: 14,
            background: 'var(--mf-bg-light)',
            transform: 'rotate(45deg)',
            borderRadius: 3,
            boxShadow: '-0.5px -0.5px 0 rgba(30,42,74,0.1)',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '2px 6px 14px',
            borderBottom: '0.5px solid var(--mf-line)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--mf-brand)',
              color: '#F8F6F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user.name.slice(0, 1)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--mf-brand)' }}>
              {user.name}
            </div>
            {user.badge && (
              <div style={{ fontSize: 11.5, color: 'var(--mf-text-sub)' }}>{user.badge}</div>
            )}
            <div
              style={{
                marginTop: 4,
                display: 'flex',
                gap: 12,
                fontSize: 11,
                color: 'var(--mf-text-muted)',
              }}
            >
              <span>
                <b style={{ color: 'var(--mf-text)', fontWeight: 700 }}>{faceCount}</b>{' '}
                {t('facesUnit', { count: faceCount })}
              </span>
              <span>
                <b style={{ color: 'var(--mf-text)', fontWeight: 700 }}>{seedCount}</b>{' '}
                {t('seedsUnit', { count: seedCount })}
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding: '6px 0 2px' }}>
          {menuItems.map((item, i) => {
            const itemStyle: React.CSSProperties = {
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 6px',
              borderRadius: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              textDecoration: 'none',
            };
            const itemContent = (
              <>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: 'var(--mf-surface-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--mf-brand)' }}>
                    {item.title}
                  </div>
                  {item.sub && (
                    <div style={{ fontSize: 11, color: 'var(--mf-text-sub)', marginTop: 1 }}>
                      {item.sub}
                    </div>
                  )}
                </div>
                <svg
                  width={8}
                  height={8}
                  viewBox="0 0 8 8"
                  fill="none"
                  stroke="var(--mf-text-faint)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                >
                  <path d="M2 1l3 3-3 3" />
                </svg>
              </>
            );

            if (item.href) {
              return (
                <Link key={i} href={item.href} onClick={onClose} style={itemStyle}>
                  {itemContent}
                </Link>
              );
            }

            return (
              <button key={i} type="button" style={itemStyle}>
                {itemContent}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 4,
            padding: '10px 6px',
            borderTop: '0.5px solid var(--mf-line)',
          }}
        >
          <button
            type="button"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'rgba(212,146,42,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width={15}
                height={15}
                viewBox="0 0 20 20"
                fill="none"
                stroke="var(--mf-accent)"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 15l4-5-4-5" />
                <path d="M17 10H7" />
                <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3" />
              </svg>
            </div>
            <div
              style={{
                flex: 1,
                fontSize: 13.5,
                fontWeight: 700,
                color: 'var(--mf-accent)',
                textAlign: 'left',
              }}
            >
              {t('logout')}
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default AccountMenu;
