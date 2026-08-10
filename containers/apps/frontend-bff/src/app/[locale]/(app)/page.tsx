import HomeProfile from '@/components/home/HomeProfile';
import HomeClient from '@/components/home/HomeClient';
import LandingPage from '@/components/landing/LandingPage';
import { listSeedsByUserId } from '@/server/usecases/seeds';
import { getViewerContext } from '@/server/usecases/viewer';
import { getAuthSession } from '@/server/usecases/auth';
import { getFormatter } from 'next-intl/server';

export default async function Home() {
  const session = await getAuthSession();
  if (!session) {
    return <LandingPage />;
  }

  const { currentUser, linkableCurrentUser, myFaces } = await getViewerContext();
  const seeds = await listSeedsByUserId(currentUser.id);
  const format = await getFormatter();

  // On This Day: 同じ月日の過去シードを探す
  const today = new Date();
  const mmdd = today.toISOString().slice(5, 10);
  const currentYear = String(today.getFullYear());
  const onThisDay = seeds.find((s) => {
    const d = s.createdAt.slice(0, 10);
    return d.slice(5) === mmdd && !d.startsWith(currentYear);
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
        <HomeProfile user={currentUser} faces={myFaces} seeds={seeds} today={today} />

        {/* 中部〜下部: フェイスフィルタ + シードフィード（Client Component） */}
        <HomeClient
          currentUser={currentUser}
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
