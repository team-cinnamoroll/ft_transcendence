import HomeProfile from '@/components/home/HomeProfile';
import HomeClient from '@/components/home/HomeClient';
import { listSeedsByUserId } from '@/server/usecases/seeds';
import { getViewerContext } from '@/server/usecases/viewer';
import { getAuthSession } from '@/server/usecases/auth';
import { getFormatter } from 'next-intl/server';

const REFERENCE_DATE = new Date('2026-03-31');

export default async function Home() {
  const { currentUser, linkableCurrentUser, myFaces } = await getViewerContext();
  const [seeds, session] = await Promise.all([listSeedsByUserId(currentUser.id), getAuthSession()]);
  const format = await getFormatter();

  // On This Day: 同じ月日の過去シードを探す
  const today = REFERENCE_DATE;
  const mmdd = today.toISOString().slice(5, 10);
  const onThisDay = seeds.find((s) => {
    const d = s.createdAt.slice(0, 10);
    return d.slice(5) === mmdd && !d.startsWith('2026');
  });
  const onThisDayFace = onThisDay ? myFaces.find((f) => f.id === onThisDay.faceId) : undefined;
  const yearsAgo = onThisDay
    ? today.getFullYear() - parseInt(onThisDay.createdAt.slice(0, 4), 10)
    : 0;
  const dateLabel = format.dateTime(today, {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  return (
    <div className="flex flex-col">
      <main>
        {/* 上部: プロフィールエリア（Server Component） */}
        <HomeProfile user={currentUser} faces={myFaces} seeds={seeds} />

        {/* 中部〜下部: フェイスフィルタ + シードフィード（Client Component） */}
        <HomeClient
          currentUser={currentUser}
          realUserId={session?.userId}
          linkableCurrentUser={linkableCurrentUser}
          faces={myFaces}
          seeds={seeds}
          onThisDay={onThisDay}
          onThisDayFace={onThisDayFace}
          yearsAgo={yearsAgo}
          dateLabel={dateLabel}
        />
      </main>
    </div>
  );
}
