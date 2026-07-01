import { notFound } from 'next/navigation';
import Link from 'next/link';
import FaceDetailClient from '@/components/face/FaceDetailClient';
import { listSeedsByFaceId } from '@/server/usecases/seeds';
import { findFaceById } from '@/server/usecases/faces';
import { getCurrentUser, listAllUsers } from '@/server/usecases/users';
import { getSubscribedFaceIds } from '@/server/usecases/subscriptions';
import { getTranslations } from 'next-intl/server';
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

  const [currentUser, seeds, users, subscribedFaceIds, t] = await Promise.all([
    getCurrentUser(),
    listSeedsByFaceId(faceId),
    listAllUsers(),
    getSubscribedFaceIds(),
    getTranslations('faceDetailPage'),
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
        <Link
          href="/faces"
          aria-label={t('backAriaLabel')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            borderRadius: '50%',
            color: 'var(--mf-text-muted)',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
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
          seeds={seeds}
          users={users}
          isSubscribed={isSubscribed}
        />
      </main>
    </div>
  );
};

export default FaceDetailPage;
