import SettingsClient from '@/components/settings/SettingsClient';
import { getCurrentUser } from '@/server/usecases/users';
import { listFacesByUserId } from '@/server/usecases/faces';
import { listSeedsByUserId } from '@/server/usecases/seeds';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const [faces, seeds] = await Promise.all([
    listFacesByUserId(user.id),
    listSeedsByUserId(user.id),
  ]);

  return <SettingsClient user={user} faceCount={faces.length} seedCount={seeds.length} />;
}
