import AdminClient from '@/components/admin/AdminClient';
import { listAllUsers } from '@/server/usecases/users';
import { listAllFaces } from '@/server/usecases/faces';
import { listAllSeeds } from '@/server/usecases/seeds';

// 管理コンソール（#252）。現状は mock データ表示のシェル。
// admin ロールによるアクセス制御は #265(B7)、各操作の配線は #263(B5)/#264(B6) で行う。
export default async function AdminPage() {
  const [users, faces, seeds] = await Promise.all([
    listAllUsers(),
    listAllFaces(),
    listAllSeeds(),
  ]);

  return <AdminClient users={users} faceCount={faces.length} activityCount={seeds.length} />;
}
