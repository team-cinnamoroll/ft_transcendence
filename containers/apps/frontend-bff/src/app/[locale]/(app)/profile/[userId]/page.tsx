import { notFound } from 'next/navigation';
import FaceBackButton from '@/components/face/FaceBackButton';
import ProfileView from '@/components/profile/ProfileView';
import { findUserById } from '@/server/usecases/users';
import { listFacesByUserId } from '@/server/usecases/faces';

type Props = {
  params: Promise<{ userId: string }>;
};

const ProfilePage = async ({ params }: Props) => {
  const { userId } = await params;
  const profile = await findUserById(userId);

  if (!profile) {
    notFound();
  }

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
        <ProfileView profile={profile} faces={faces} />
      </main>
    </div>
  );
};

export default ProfilePage;
