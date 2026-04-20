import HomeProfile from '@/components/home/HomeProfile';
import HomeClient from '@/components/home/HomeClient';
import FAB from '@/components/ui/FAB';
import { listActivitiesByUserId } from '@/server/usecases/activities';
import { getViewerContext } from '@/server/usecases/viewer';

export default async function Home() {
  const { currentUser, myFaces } = await getViewerContext();
  const activities = await listActivitiesByUserId(currentUser.id);

  return (
    <div className="flex flex-col">
      {/* スティッキーヘッダー */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-bold text-zinc-100">ホーム</h1>
      </header>

      <main>
        {/* 上部: プロフィールエリア（Server Component） */}
        <HomeProfile user={currentUser} faces={myFaces} activities={activities} />

        {/* 中部〜下部: フェイスフィルタ + アクティビティフィード（Client Component） */}
        <HomeClient currentUser={currentUser} faces={myFaces} activities={activities} />
      </main>

      <FAB />
    </div>
  );
}
