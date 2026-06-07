import HomeProfile from '@/components/home/HomeProfile';
import HomeClient from '@/components/home/HomeClient';
import { listSeedsByUserId } from '@/server/usecases/seeds';
import { getViewerContext } from '@/server/usecases/viewer';

const REFERENCE_DATE = new Date('2026-03-31');

export default async function Home() {
  const { currentUser, myFaces } = await getViewerContext();
  const seeds = await listSeedsByUserId(currentUser.id);

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
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][today.getDay()];
  const dateLabel = `${today.getMonth() + 1}月${today.getDate()}日 (${weekday})`;

  return (
    <div className="flex flex-col">
      <main>
        {/* 上部: プロフィールエリア（Server Component） */}
        <HomeProfile user={currentUser} faces={myFaces} seeds={seeds} />

        {/* 中部〜下部: フェイスフィルタ + シードフィード（Client Component） */}
        <HomeClient
          currentUser={currentUser}
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
