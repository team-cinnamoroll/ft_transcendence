import { notFound } from 'next/navigation';
import FaceBackButton from '@/components/face/FaceBackButton';
import ProfileView from '@/components/profile/ProfileView';
import { findUserById, getCurrentUser } from '@/server/usecases/users';
import { listFacesByUserId } from '@/server/usecases/faces';

type Props = {
  params: Promise<{ userId: string }>;
};

const ProfilePage = async ({ params }: Props) => {
  const { userId } = await params;
  const [profile, currentUser] = await Promise.all([findUserById(userId), getCurrentUser()]);

  if (!profile) {
    notFound();
  }

  const isOwner = profile.id === currentUser.id;
  const displayProfile = isOwner ? { ...currentUser, relationship: null } : profile;
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
