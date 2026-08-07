import { notFound } from 'next/navigation';
import FaceDetailClient from '@/components/face/FaceDetailClient';
import FaceBackButton from '@/components/face/FaceBackButton';
import { listSeedsByFaceId } from '@/server/usecases/seeds';
import { findFaceById } from '@/server/usecases/faces';
import { getCurrentUser, findUserById, findUsersByIds } from '@/server/usecases/users';
import { getSubscribedFaceIds } from '@/server/usecases/subscriptions';
import type { Face } from '@/types/face';

type Props = {
  params: Promise<{ faceId: string }>;
};

const FaceDetailPage = async ({ params }: Props) => {
  const { faceId } = await params;
  const maybeFace = await findFaceById(faceId);

  if (!maybeFace) {
    notFound();
  }

  const face = maybeFace as Face;

  const [currentUser, seeds, subscribedFaceIds] = await Promise.all([
    getCurrentUser(),
    listSeedsByFaceId(faceId),
    getSubscribedFaceIds(),
  ]);
  const [linkableCurrentUser, users] = await Promise.all([
    findUserById(currentUser.id).then((u) => u ?? currentUser),
    findUsersByIds(seeds.map((seed) => seed.userId)),
  ]);

  const isOwner = face.userId === currentUser.id;
  const isSubscribed = subscribedFaceIds.includes(face.id);

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
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--mf-brand)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: 0,
          }}
        >
          {face.emoji ? `${face.emoji} ${face.name}` : face.name}
        </h2>
      </header>

      <main>
        <FaceDetailClient
          face={face}
          isOwner={isOwner}
          currentUserId={currentUser.id}
          linkableCurrentUser={linkableCurrentUser}
          seeds={seeds}
          users={users}
          isSubscribed={isSubscribed}
        />
      </main>
    </div>
  );
};

export default FaceDetailPage;
