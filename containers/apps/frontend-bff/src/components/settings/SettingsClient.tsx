'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import type { UserProfile } from '@/types/user-profile';

type Props = {
  user: UserProfile;
  faceCount: number;
  seedCount: number;
};

/**
 * 設定ページの器（shell）。
 * - 上部にプロフィール概要（表示専用）を出す。
 * - 各操作（プロフィール編集 / データエクスポート / アカウント削除）は
 *   子 Issue (#128 / #148 / #150) が各セクションのスロットに差し込む。
 */
const SettingsClient = ({ user, faceCount, seedCount }: Props) => {
  const t = useTranslations('settings');

  return (
    <div
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '24px 20px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--mf-brand)' }}>{t('title')}</h1>

      {/* プロフィール概要（表示専用 / #114 のホーム上部と役割を分ける） */}
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 18px',
          background: 'var(--mf-surface)',
          border: '0.5px solid var(--mf-line)',
          borderRadius: 16,
        }}
      >
        <div
          style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}
        >
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={52}
            height={52}
            style={{ objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--mf-brand)' }}>
              {user.name}
            </span>
            {user.badge && <span style={{ fontSize: 14 }}>{user.badge}</span>}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12.5,
              color: 'var(--mf-text-muted)',
              marginTop: 3,
            }}
          >
            <span>
              <b style={{ color: 'var(--mf-text)', fontWeight: 700 }}>{faceCount}</b>{' '}
              {t('facesUnit', { count: faceCount })}
            </span>
            <span
              style={{ width: 1, height: 12, background: 'var(--mf-line)', display: 'inline-block' }}
            />
            <span>
              <b style={{ color: 'var(--mf-text)', fontWeight: 700 }}>{seedCount}</b>{' '}
              {t('seedsUnit', { count: seedCount })}
            </span>
          </div>
        </div>
      </section>

      {/* プロフィール編集 */}
      <SettingsSection title={t('profile.title')} description={t('profile.description')}>
        {/* slot: #128 プロフィール編集モーダル（name / badge / avatar）のトリガーをここに配置する */}
      </SettingsSection>

      {/* データとプライバシー */}
      <SettingsSection title={t('data.title')} description={t('data.description')}>
        {/* slot: #148 データエクスポート UI（GDPR）をここに配置する */}
      </SettingsSection>

      {/* アカウント */}
      <SettingsSection title={t('account.title')} description={t('account.description')}>
        {/* slot: #150 アカウント削除 UI（パスワード再認証 / GDPR）をここに配置する */}
      </SettingsSection>
    </div>
  );
};

type SettingsSectionProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

/** 設定セクションの枠。子 Issue は children スロットに操作 UI を差し込む。 */
const SettingsSection = ({ title, description, children }: SettingsSectionProps) => {
  return (
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
};

export default SettingsClient;
