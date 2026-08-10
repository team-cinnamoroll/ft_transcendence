'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

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

const NAV_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'nav.home', icon: (a) => <HomeIcon active={a} /> },
  { href: '/faces', labelKey: 'nav.faces', icon: (a) => <LayersIcon active={a} /> },
  {
    href: '/collection',
    labelKey: 'nav.collection',
    icon: (a) => <CompassIcon active={a} />,
  },
];

type Props = {
  className?: string;
};

const BottomNav = ({ className }: Props = {}) => {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center',
        className
      )}
      style={{
        paddingBottom: 26,
        paddingTop: 10,
        background: 'rgba(248,246,241,0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '0.5px solid var(--mf-line)',
      }}
    >
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
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '0 14px',
              color: isActive ? 'var(--mf-brand)' : 'var(--mf-text-muted)',
              textDecoration: 'none',
            }}
          >
            {item.icon(isActive)}
            <span
              style={{
                fontFamily: 'var(--mf-font-sans)',
                fontSize: 10.5,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: 0.4,
              }}
            >
              {t(item.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
