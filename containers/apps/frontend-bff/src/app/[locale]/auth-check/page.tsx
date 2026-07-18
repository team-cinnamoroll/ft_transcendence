import { notFound } from 'next/navigation';
import { getAuthSession } from '@/server/usecases/auth';
import { createBackendClient } from '@/lib/backend-client';
import SignUpForm from '@/components/auth/SignUpForm';
import SignInForm from '@/components/auth/SignInForm';
import AccountMenuPreview from './AccountMenuPreview';
import type { UserMeResponse } from '@tracen/contracts';

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const headingStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--mf-brand)',
  margin: 0,
};

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: '12px 14px',
  borderRadius: 12,
  border: '0.5px solid var(--mf-line)',
  background: 'var(--mf-surface)',
  fontSize: 12,
  overflowX: 'auto',
};

// getCurrentUser()（モック）とは別経路で、本物のbackendから直接ユーザー情報を取得する。
// このページが削除されるまでの一時的な確認用ロジックのため、repository化はしていない。
async function fetchBackendUser(accessToken: string): Promise<UserMeResponse | null> {
  const res = await createBackendClient(accessToken).api.v1.users.me.$get();
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as UserMeResponse;
}

export default async function AuthCheckPage() {
  // アクセストークンや本物のユーザー情報を表示するため、本番相当環境では非表示にする
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const session = await getAuthSession();
  const backendUser = session ? await fetchBackendUser(session.accessToken) : null;

  return (
    <div
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '24px 20px 60px',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}
    >
      <div style={sectionStyle}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
          ログイン動作確認ページ（一時的）
        </h1>
        <p style={{ fontSize: 13, color: 'var(--mf-text-muted)', margin: 0 }}>
          モック実装と本物のログイン実装が共存している間だけ使う確認用ページです。
          docs/frontend-bff/CONNECTION_PLAN.md
          の繋ぎ込みが進んだら、このページごと削除してください。
        </p>
      </div>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>現在のログイン状態（getAuthSession）</h2>
        <pre style={preStyle}>
          {session
            ? JSON.stringify({ isAuthenticated: true, userId: session.userId }, null, 2)
            : JSON.stringify({ isAuthenticated: false }, null, 2)}
        </pre>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>backendから取得した本物のユーザー情報（GET /users/:id）</h2>
        {!session && (
          <p style={{ fontSize: 13, color: 'var(--mf-text-muted)', margin: 0 }}>
            未ログインのため取得していません。
          </p>
        )}
        {session && !backendUser && (
          <p style={{ fontSize: 13, color: 'var(--mf-accent)', margin: 0 }}>
            取得に失敗しました（backendに存在しないユーザー、通信エラー等）。
          </p>
        )}
        {backendUser && backendUser.success === true && (
          <pre style={preStyle}>{JSON.stringify(backendUser.data.user, null, 2)}</pre>
        )}
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>AccountMenu（ログイン中 / 未ログイン）</h2>
        <AccountMenuPreview />
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>SignUpForm</h2>
        <SignUpForm />
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>SignInForm</h2>
        <SignInForm />
      </section>
    </div>
  );
}
