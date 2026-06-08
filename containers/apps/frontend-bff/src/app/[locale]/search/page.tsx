import SearchClient from '@/components/search/SearchClient';
import { listAllSeeds } from '@/server/usecases/seeds';
import { listAllFaces } from '@/server/usecases/faces';
import { getSubscribedFaceIds } from '@/server/usecases/subscriptions';
import { getCurrentUser, listAllUsers } from '@/server/usecases/users';

export default async function SearchPage() {
  const [currentUser, allSeeds, allFaces, allUsers, subscribedFaceIds] = await Promise.all([
    getCurrentUser(),
    listAllSeeds(),
    listAllFaces(),
    listAllUsers(),
    getSubscribedFaceIds(),
  ]);

  return (
    <SearchClient
      allSeeds={allSeeds}
      allFaces={allFaces}
      allUsers={allUsers}
      currentUserId={currentUser.id}
      subscribedFaceIds={subscribedFaceIds}
    />
  );
}
