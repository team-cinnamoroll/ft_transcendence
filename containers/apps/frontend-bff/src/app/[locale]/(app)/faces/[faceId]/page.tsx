import { notFound } from 'next/navigation';
import FaceDetailClient from '@/components/face/FaceDetailClient';
import FaceBackButton from '@/components/face/FaceBackButton';
import { listSeedsByFaceId } from '@/server/usecases/seeds';
import { findFaceById } from '@/server/usecases/faces';
import { getCurrentUser, findUserById, listAllUsers } from '@/server/usecases/users';
import { getSubscribedFaceIds } from '@/server/usecases/subscriptions';
import { getAuthSession } from '@/server/usecases/auth';
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

  const [currentUser, seeds, users, subscribedFaceIds, session] = await Promise.all([
    getCurrentUser(),
    listSeedsByFaceId(faceId),
    listAllUsers(),
    getSubscribedFaceIds(),
    getAuthSession(),
  ]);
  const linkableCurrentUser = (await findUserById(currentUser.id)) ?? currentUser;

  // Faceは本物のバックエンドAPIに接続済みのため、モックID(currentUser.id)ではなく
  // 本物のログインID(session.userId)で所有者判定する必要がある(#314で発覚した不整合、#318で解消予定)
  const isOwner = face.userId === session?.userId;
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
          currentUserId={session?.userId ?? currentUser.id}
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
