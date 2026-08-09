'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Wordmark from '@/components/ui/Wordmark';
import FaceNavItem from '@/components/ui/FaceNavItem';
import AccountMenu from '@/components/ui/AccountMenu';
import CreateFaceModal from '@/components/face/CreateFaceModal';
import PostModal from '@/components/ui/PostModal';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getAvatarUrl } from '@/lib/display';
import { useHasPendingFriendRequest } from '@/lib/heartbeat-provider';

type NavItem = {
  href: string;
  labelKey: string;
  icon: (active: boolean) => React.ReactNode;
};

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M3 10L11 3L19 10V19H3V10Z"
      fill={active ? 'currentColor' : 'none'}
      fillOpacity={active ? 0.18 : 0}
    />
    <path d="M9 19v-5h4v5" />
  </svg>
);

const LayersIcon = ({ active }: { active: boolean }) => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 3L3 7l8 4 8-4-8-4z" fill={active ? 'currentColor' : 'none'} />
    <path d="M3 11l8 4 8-4" opacity={active ? 0.6 : 1} />
    {!active && <path d="M3 15l8 4 8-4" />}
  </svg>
);

const CompassIcon = ({ active }: { active: boolean }) => (
  <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <circle
      cx={11}
      cy={11}
      r={8}
      fill={active ? 'currentColor' : 'none'}
      fillOpacity={active ? 0.18 : 0}
      stroke="currentColor"
      strokeWidth={1.6}
    />
    <path d="M14.5 7.5L12.5 12.5 7.5 14.5 9.5 9.5z" fill="currentColor" />
  </svg>
);

const FriendsIcon = ({ active }: { active: boolean }) => (
  <svg
    width={22}
    height={22}
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx={8}
      cy={8}
      r={3}
      fill={active ? 'currentColor' : 'none'}
      fillOpacity={active ? 0.18 : 0}
    />
    <path d="M3 18c0-3 2.2-5 5-5s5 2 5 5" />
    <circle cx={15.5} cy={7} r={2.3} />
    <path d="M14.3 12.3c2.3.3 3.9 2.1 3.9 4.4" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'nav.home', icon: (a) => <HomeIcon active={a} /> },
  { href: '/faces', labelKey: 'nav.faces', icon: (a) => <LayersIcon active={a} /> },
  {
    href: '/collection',
    labelKey: 'nav.collection',
    icon: (a) => <CompassIcon active={a} />,
  },
  { href: '/friends', labelKey: 'nav.friends', icon: (a) => <FriendsIcon active={a} /> },
];

type Props = {
  faces: Face[];
  user: UserProfile;
  realUserId?: string;
  seeds: Seed[];
  faceCount: number;
  seedCount: number;
  isAuthenticated: boolean;
};

const SideNav = ({
  faces,
  user,
  realUserId,
  seeds,
  faceCount,
  seedCount,
  isAuthenticated,
}: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const hasPendingFriendRequest = useHasPendingFriendRequest();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  const activeFaceId = pathname.startsWith('/faces/') ? pathname.split('/')[2] : undefined;

  const handleFaceNavItemClick = (face: Face) => {
    router.push(`/faces/${face.id}`);
  };

  return (
    <>
      <nav
        className="hidden md:flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto mf-scroll"
        style={{
          width: 260,
          padding: '24px 14px',
          borderRight: '0.5px solid var(--mf-line)',
        }}
      >
        {/* Wordmark */}
        <div style={{ padding: '0 12px 28px' }}>
          <Wordmark size={26} />
        </div>

        {/* メインナビゲーション */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/' || pathname === `/${pathname.split('/')[1]}`
                : pathname.includes(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '11px 14px',
                  borderRadius: 11,
                  background: isActive ? 'rgba(30,42,74,0.10)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
              >
                <span
                  style={{
                    position: 'relative',
                    color: isActive ? 'var(--mf-brand)' : 'var(--mf-text-sub)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {item.icon(isActive)}
                  {item.href === '/friends' && hasPendingFriendRequest && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -1,
                        right: -1,
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: 'var(--mf-accent)',
                        boxShadow: '0 0 0 2px var(--mf-bg-light)',
                      }}
                    />
                  )}
                </span>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? 'var(--mf-brand)' : 'var(--mf-text)',
                    letterSpacing: 0.1,
                  }}
                >
                  {t(item.labelKey)}
                </div>
              </Link>
            );
          })}
        </div>

        {/* 投稿ボタン */}
        <button
          type="button"
          onClick={() => setIsPostModalOpen(true)}
          style={{
            marginTop: 18,
            padding: '13px 16px',
            borderRadius: 12,
            background: 'var(--mf-accent)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.3,
            boxShadow: '0 4px 14px rgba(212,146,42,0.25)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 17l1-3.5L13 4.5l3.5 3.5L7.5 17H3z" />
            <path d="M12 5.5l3.5 3.5" />
          </svg>
          {t('sideNav.newSeed')}
        </button>

        {/* マイフェイスセクション */}
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              padding: '0 14px 8px',
              fontSize: 10.5,
              color: 'var(--mf-text-muted)',
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            {t('sideNav.facesSection')}
          </div>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {faces.map((face) => (
              <FaceNavItem
                key={face.id}
                face={face}
                activeFaceId={activeFaceId}
                seedCount={seeds.filter((s) => s.faceId === face.id).length}
                onClick={handleFaceNavItemClick}
              />
            ))}
          </ul>
        </div>

        {/* 新規フェイス作成ボタン */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '8px 14px',
            marginTop: 8,
            borderRadius: 8,
            background: 'transparent',
            border: '1.5px dashed var(--mf-line)',
            cursor: 'pointer',
            fontSize: 12.5,
            fontWeight: 600,
            color: 'var(--mf-text-muted)',
          }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M10 4v12M4 10h12" />
          </svg>
          {t('sideNav.createFace')}
        </button>

        <div style={{ flex: 1 }} />

        {/* ユーザーピル */}
        <button
          ref={userButtonRef}
          type="button"
          onClick={() => setMenuOpen((p) => !p)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'var(--mf-surface)',
            border: '0.5px solid var(--mf-line)',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <Image
              src={getAvatarUrl(user)}
              alt={user.name}
              width={44}
              height={44}
              style={{ objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--mf-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
            >
              {user.name}
            </div>
          </div>
          <svg width={16} height={16} viewBox="0 0 18 18" fill="var(--mf-text-muted)">
            <circle cx={3} cy={9} r={1.5} />
            <circle cx={9} cy={9} r={1.5} />
            <circle cx={15} cy={9} r={1.5} />
          </svg>
        </button>
      </nav>

      <AccountMenu
        user={user}
        realUserId={realUserId}
        faceCount={faceCount}
        seedCount={seedCount}
        isOpen={menuOpen}
        isAuthenticated={isAuthenticated}
        onClose={() => setMenuOpen(false)}
        anchorRef={userButtonRef}
      />

      <CreateFaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={() => setIsCreateModalOpen(false)}
      />

      <PostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
    </>
  );
};

export default SideNav;
