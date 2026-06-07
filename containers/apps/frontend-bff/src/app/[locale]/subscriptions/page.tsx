import SubscriptionFeed from '@/components/subscriptions/SubscriptionFeed';
import { listSeedsByFaceIds } from '@/server/usecases/seeds';
import { listAllFaces } from '@/server/usecases/faces';
import { getSubscribedFaceIds } from '@/server/usecases/subscriptions';
import { listAllUsers } from '@/server/usecases/users';
export default async function SubscriptionsPage() {
  const subscribedFaceIds = await getSubscribedFaceIds();
  const [subscribedSeeds, faces, users] = await Promise.all([
    listSeedsByFaceIds(subscribedFaceIds),
    listAllFaces(),
    listAllUsers(),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <SubscriptionFeed
        subscribedFaceIds={subscribedFaceIds}
        subscribedSeeds={subscribedSeeds}
        faces={faces}
        users={users}
      />
    </div>
  );
}
