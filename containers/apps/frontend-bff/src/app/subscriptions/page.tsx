import SubscriptionFeed from '@/components/subscriptions/SubscriptionFeed';
import FAB from '@/components/ui/FAB';
import { listActivitiesByFaceIds } from '@/server/usecases/activities';
import { listAllFaces } from '@/server/usecases/faces';
import { getSubscribedFaceIds } from '@/server/usecases/subscriptions';
import { listAllUsers } from '@/server/usecases/users';

export default async function SubscriptionsPage() {
  const subscribedFaceIds = await getSubscribedFaceIds();
  const [subscribedActivities, faces, users] = await Promise.all([
    listActivitiesByFaceIds(subscribedFaceIds),
    listAllFaces(),
    listAllUsers(),
  ]);

  return (
    <div className="flex flex-col">
      {/* スティッキーヘッダー */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-100">サブスク</h1>
          <span className="text-xs text-zinc-500">
            {subscribedFaceIds.length} フェイスをサブスク中
          </span>
        </div>
      </header>

      <main className="px-4 py-4">
        <SubscriptionFeed
          subscribedFaceIds={subscribedFaceIds}
          subscribedActivities={subscribedActivities}
          faces={faces}
          users={users}
        />
      </main>

      <FAB />
    </div>
  );
}
