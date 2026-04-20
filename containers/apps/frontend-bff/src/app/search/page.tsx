import SearchClient from '@/components/search/SearchClient';
import { listAllActivities } from '@/server/usecases/activities';
import { listAllFaces } from '@/server/usecases/faces';
import { getSubscribedFaceIds } from '@/server/usecases/subscriptions';
import { getCurrentUser, listAllUsers } from '@/server/usecases/users';

export default async function SearchPage() {
  const [currentUser, allActivities, allFaces, allUsers, subscribedFaceIds] = await Promise.all([
    getCurrentUser(),
    listAllActivities(),
    listAllFaces(),
    listAllUsers(),
    getSubscribedFaceIds(),
  ]);

  return (
    <SearchClient
      allActivities={allActivities}
      allFaces={allFaces}
      allUsers={allUsers}
      currentUserId={currentUser.id}
      subscribedFaceIds={subscribedFaceIds}
    />
  );
}
