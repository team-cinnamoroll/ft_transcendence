'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import type { UserProfile } from '@/types/user-profile';

type Props = {
  users: UserProfile[];
  faceCount: number;
  activityCount: number;
};

// 管理コンソールの器（shell）。各操作は後続 Issue が配線する:
//   利用制限 → #263(B5) API + #265(B7) authz、コンテンツ削除 → #264(B6)、Kibana → #251。
// データは既存アプリ mock を利用。デザインは settings 系（--mf-* トークン + カード）に統一。
const AdminClient = ({ users, faceCount, activityCount }: Props) => {
  const t = useTranslations('admin');

  return (
    <div
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: '24px 20px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--mf-brand)' }}>{t('title')}</h1>
        <p style={{ fontSize: 12.5, color: 'var(--mf-text-sub)', lineHeight: 1.6 }}>
          {t('subtitle')}
        </p>
      </header>

      {/* ユーザー管理 */}
      <AdminSection title={t('users.title')} description={t('users.description')}>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {users.map((user) => (
            <li
              key={user.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: 'var(--mf-bg-paper)',
                border: '0.5px solid var(--mf-line)',
                borderRadius: 12,
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  width={36}
                  height={36}
                  style={{ objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--mf-text)' }}>
                  {user.name} {user.badge && <span style={{ fontWeight: 400 }}>{user.badge}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--mf-text-muted)' }}>{user.id}</div>
              </div>
              {/* 現状は全員 active 表示（実ステータスは #260/#261 で導入） */}
              <span style={statusChipStyle}>{t('users.status.active')}</span>
              {/* TODO(#263 B5 / #265 B7): 実際の利用制限アクションを配線 */}
              <button type="button" style={dangerActionStyle}>
                {t('users.restrict')}
              </button>
            </li>
          ))}
        </ul>
      </AdminSection>

      {/* コンテンツ管理 */}
      <AdminSection title={t('content.title')} description={t('content.description')}>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <StatTile value={faceCount} label={t('content.facesLabel')} />
          <StatTile value={activityCount} label={t('content.activitiesLabel')} />
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--mf-text-muted)', marginTop: 8 }}>
          {t('content.note')}
        </p>
      </AdminSection>

      {/* 分析（Kibana 導線） */}
      <AdminSection title={t('analytics.title')} description={t('analytics.description')}>
        {/* TODO(#251): Kibana 構築後に実 URL / 埋め込みへ差し替え */}
        <button type="button" style={sectionActionStyle} disabled>
          {t('analytics.open')}
        </button>
        <span style={{ fontSize: 11.5, color: 'var(--mf-text-muted)', marginLeft: 10 }}>
          {t('analytics.unavailable')}
        </span>
      </AdminSection>
    </div>
  );
};

type AdminSectionProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

const AdminSection = ({ title, description, children }: AdminSectionProps) => (
  <section
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '16px 18px',
      background: 'var(--mf-surface)',
      border: '0.5px solid var(--mf-line)',
      borderRadius: 16,
    }}
  >
    <h2 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--mf-brand)' }}>{title}</h2>
    <p style={{ fontSize: 12.5, color: 'var(--mf-text-sub)', lineHeight: 1.6 }}>{description}</p>
    {children}
  </section>
);

const StatTile = ({ value, label }: { value: number; label: string }) => (
  <div
    style={{
      flex: 1,
      padding: '14px 16px',
      background: 'var(--mf-bg-paper)',
      border: '0.5px solid var(--mf-line)',
      borderRadius: 12,
    }}
  >
    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--mf-brand)' }}>{value}</div>
    <div style={{ fontSize: 12, color: 'var(--mf-text-muted)', marginTop: 2 }}>{label}</div>
  </div>
);

const statusChipStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--mf-brand)',
  background: 'var(--mf-surface-tint)',
  border: '0.5px solid var(--mf-line)',
  borderRadius: 999,
  padding: '2px 10px',
};

const sectionActionStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 10,
  border: '0.5px solid var(--mf-line)',
  background: 'var(--mf-surface)',
  color: 'var(--mf-brand)',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  marginTop: 8,
};

const dangerActionStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: '0.5px solid var(--mf-line)',
  background: 'var(--mf-surface)',
  color: 'var(--mf-danger, #d64545)',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  flexShrink: 0,
};

export default AdminClient;
