import { notFound } from 'next/navigation';
import FaceBackButton from '@/components/face/FaceBackButton';
import ProfileView from '@/components/profile/ProfileView';
import { findUserById, getCurrentUser } from '@/server/usecases/users';
import { getAuthSession } from '@/server/usecases/auth';
import { listFacesByUserId } from '@/server/usecases/faces';

type Props = {
  params: Promise<{ userId: string }>;
};

const ProfilePage = async ({ params }: Props) => {
  const { userId } = await params;
  const [profile, currentUser, session] = await Promise.all([
    findUserById(userId),
    getCurrentUser(),
    getAuthSession(),
  ]);

  if (!profile) {
    notFound();
  }

  // 「自分自身かどうか」は、本物のログインセッションのID(バックエンド発行のID)で判定する。
  // モックのID(currentUser.id)は、どの実アカウントでログインしても同じ固定値になるため、
  // 複数の実アカウントを区別する判定には使えない。
  const isOwner = session?.userId === userId;
  // 自分自身の場合は findUserById の結果ではなく getCurrentUser の結果を使う。
  // findUserById はURLのIDをそのままバックエンドに問い合わせるが、そのIDがモックのIDだった場合は
  // 本物のバックエンドとは一致せず、モックデータにフォールバックしてしまう。
  // getCurrentUser は /users/me（JWTから自動で「自分」を判定するAPI）を使うため、この問題が起きない。
  const displayProfile = isOwner ? { ...currentUser, relationship: null } : profile;
  // Faceは本物のバックエンドAPIに接続済みのため、URLのuserId(本物のID)をそのまま使えばよい。
  // isOwnerの場合はsession.userId === userIdが保証されているため、分岐は不要。
  const faces = await listFacesByUserId(userId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '0.5px solid var(--mf-line)',
          background: 'var(--mf-bg-light)',
          padding: '12px 16px',
        }}
      >
        <FaceBackButton />
      </header>

      <main>
        <ProfileView profile={displayProfile} faces={faces} isOwner={isOwner} />
      </main>
    </div>
  );
};

export default ProfilePage;
