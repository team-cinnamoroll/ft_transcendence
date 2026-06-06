import { notFound } from 'next/navigation';
import Link from 'next/link';
import FaceDetailClient from '@/components/face/FaceDetailClient';
import { listActivitiesByFaceId } from '@/server/usecases/activities';
import { findFaceById } from '@/server/usecases/faces';
import { getCurrentUser, listAllUsers } from '@/server/usecases/users';
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

  const [currentUser, activities, users, subscribedFaceIds] = await Promise.all([
    getCurrentUser(),
    listActivitiesByFaceId(faceId),
    listAllUsers(),
    getSubscribedFaceIds(),
  ]);

  const isOwner = face.userId === currentUser.id;
  const isSubscribed = subscribedFaceIds.includes(face.id);

  return (
    <div className="flex flex-col">
      {/* スティッキーヘッダー */}
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <Link
          href="/faces"
          className="flex items-center justify-center rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="フェイス一覧へ戻る"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h2 className="truncate text-base font-bold text-zinc-100">
          {face.emoji ? `${face.emoji} ${face.name}` : face.name}
        </h2>
      </header>

      <main>
        <FaceDetailClient
          face={face}
          isOwner={isOwner}
          activities={activities}
          users={users}
          isSubscribed={isSubscribed}
        />
      </main>
    </div>
  );
};

export default FaceDetailPage;
