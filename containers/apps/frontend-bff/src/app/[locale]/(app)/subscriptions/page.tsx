import SubscriptionSeed from '@/components/subscriptions/SubscriptionSeed';
import { listSeedsByFaceIds, listAllSeeds } from '@/server/usecases/seeds';
import { listAllFaces } from '@/server/usecases/faces';
import { getSubscribedFaceIds } from '@/server/usecases/subscriptions';
import { getCurrentUser, findUserById, findUsersByIds } from '@/server/usecases/users';
export default async function SubscriptionsPage() {
  const subscribedFaceIds = await getSubscribedFaceIds();
  const [subscribedSeeds, allSeeds, faces, currentUser] = await Promise.all([
    listSeedsByFaceIds(subscribedFaceIds),
    listAllSeeds(),
    listAllFaces(),
    getCurrentUser(),
  ]);
  const [linkableCurrentUser, users] = await Promise.all([
    findUserById(currentUser.id).then((u) => u ?? currentUser),
    findUsersByIds([...subscribedSeeds, ...allSeeds].map((seed) => seed.userId)),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <SubscriptionSeed
        subscribedFaceIds={subscribedFaceIds}
        subscribedSeeds={subscribedSeeds}
        allSeeds={allSeeds}
        faces={faces}
        users={users}
        currentUserId={currentUser.id}
        linkableCurrentUser={linkableCurrentUser}
      />
    </div>
  );
}
