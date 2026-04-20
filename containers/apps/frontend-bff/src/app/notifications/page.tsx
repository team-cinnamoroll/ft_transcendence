import NotificationList from '@/components/notifications/NotificationList';
import { listAllActivities } from '@/server/usecases/activities';
import { listAllFaces } from '@/server/usecases/faces';
import { listNotifications } from '@/server/usecases/notifications';
import { listAllUsers } from '@/server/usecases/users';

export default async function NotificationsPage() {
  const [notifications, users, faces, activities] = await Promise.all([
    listNotifications(),
    listAllUsers(),
    listAllFaces(),
    listAllActivities(),
  ]);

  const count = notifications.length;

  return (
    <div className="flex flex-col">
      {/* スティッキーヘッダー */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-100">通知</h1>
          {count > 0 && <span className="text-xs text-zinc-500">{count} 件</span>}
        </div>
      </header>

      <main className="px-4 py-4">
        <NotificationList
          notifications={notifications}
          users={users}
          faces={faces}
          activities={activities}
        />
      </main>
    </div>
  );
}
