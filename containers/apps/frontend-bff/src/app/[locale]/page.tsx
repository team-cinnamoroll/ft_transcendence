import HomeProfile from '@/components/home/HomeProfile';
import HomeClient from '@/components/home/HomeClient';
import { listActivitiesByUserId } from '@/server/usecases/activities';
import { getViewerContext } from '@/server/usecases/viewer';

const REFERENCE_DATE = new Date('2026-03-31');

export default async function Home() {
  const { currentUser, myFaces } = await getViewerContext();
  const activities = await listActivitiesByUserId(currentUser.id);

  // On This Day: 同じ月日の過去アクティビティを探す
  const today = REFERENCE_DATE;
  const mmdd = today.toISOString().slice(5, 10);
  const onThisDay = activities.find((a) => {
    const d = a.createdAt.slice(0, 10);
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
        <HomeProfile user={currentUser} faces={myFaces} activities={activities} />

        {/* 中部〜下部: フェイスフィルタ + アクティビティフィード（Client Component） */}
        <HomeClient
          currentUser={currentUser}
          faces={myFaces}
          activities={activities}
          onThisDay={onThisDay}
          onThisDayFace={onThisDayFace}
          yearsAgo={yearsAgo}
          dateLabel={dateLabel}
        />
      </main>
    </div>
  );
}
