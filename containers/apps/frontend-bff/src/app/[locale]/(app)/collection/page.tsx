import FriendSeedFeed from '@/components/collection/FriendSeedFeed';
import { listFriendSeeds } from '@/server/usecases/collection';
import { listAllFaces } from '@/server/usecases/faces';
import { findUsersByIds, getCurrentUser } from '@/server/usecases/users';

export default async function CollectionPage() {
  const [seeds, currentUser] = await Promise.all([listFriendSeeds(), getCurrentUser()]);
  const [faces, users] = await Promise.all([
    listAllFaces(),
    findUsersByIds(seeds.map((seed) => seed.userId)),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <FriendSeedFeed seeds={seeds} faces={faces} users={users} currentUserId={currentUser.id} />
    </div>
  );
}
