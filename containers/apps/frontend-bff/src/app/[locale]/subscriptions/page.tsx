import SubscriptionFeed from '@/components/subscriptions/SubscriptionFeed';
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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <SubscriptionFeed
        subscribedFaceIds={subscribedFaceIds}
        subscribedActivities={subscribedActivities}
        faces={faces}
        users={users}
      />
    </div>
  );
}
