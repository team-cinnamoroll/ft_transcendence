import SubscriptionSeed from '@/components/subscriptions/SubscriptionSeed';
import { listSeedsByFaceIds, listAllSeeds } from '@/server/usecases/seeds';
import { listAllFaces } from '@/server/usecases/faces';
import { getSubscribedFaceIds } from '@/server/usecases/subscriptions';
import { listAllUsers, getCurrentUser, findUserById } from '@/server/usecases/users';
export default async function SubscriptionsPage() {
  const subscribedFaceIds = await getSubscribedFaceIds();
  const [subscribedSeeds, allSeeds, faces, users, currentUser] = await Promise.all([
    listSeedsByFaceIds(subscribedFaceIds),
    listAllSeeds(),
    listAllFaces(),
    listAllUsers(),
    getCurrentUser(),
  ]);
  const linkableCurrentUser = (await findUserById(currentUser.id)) ?? currentUser;

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
