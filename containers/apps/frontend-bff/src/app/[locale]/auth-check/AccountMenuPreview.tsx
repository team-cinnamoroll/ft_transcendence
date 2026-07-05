'use client';

import { useState } from 'react';
import AccountMenu from '@/components/ui/AccountMenu';
import type { UserProfile } from '@/types/user-profile';

const previewUser: UserProfile = {
  id: 'preview-user',
  name: 'プレビュー用ユーザー',
  avatarUrl: 'https://i.pravatar.cc/150?u=auth-check-preview',
  badge: '🔍',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  border: '0.5px solid var(--mf-line)',
  background: 'var(--mf-surface)',
  color: 'var(--mf-brand)',
  cursor: 'pointer',
};

// AccountMenuはposition:fixedの全画面ポップオーバーのため、
// ログイン中/未ログインを同時に2つ開くと重なって表示が崩れる。
// そのためどちらか一方だけを開けるトグル形式にしている。
export default function AccountMenuPreview() {
  const [mode, setMode] = useState<'authenticated' | 'unauthenticated' | null>(null);

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button type="button" style={buttonStyle} onClick={() => setMode('authenticated')}>
        ログイン中の見た目を表示
      </button>
      <button type="button" style={buttonStyle} onClick={() => setMode('unauthenticated')}>
        未ログインの見た目を表示
      </button>

      <AccountMenu
        user={previewUser}
        faceCount={0}
        seedCount={0}
        isOpen={mode !== null}
        isAuthenticated={mode === 'authenticated'}
        onClose={() => setMode(null)}
      />
    </div>
  );
}
