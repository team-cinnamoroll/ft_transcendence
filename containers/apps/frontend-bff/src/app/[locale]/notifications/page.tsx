import NotificationList from '@/components/notifications/NotificationList';
import { listAllActivities } from '@/server/usecases/activities';
import { listAllFaces } from '@/server/usecases/faces';
import { listNotifications } from '@/server/usecases/notifications';
import { listAllUsers } from '@/server/usecases/users';
import { getTranslations } from 'next-intl/server';

export default async function NotificationsPage() {
  const [notifications, users, faces, activities] = await Promise.all([
    listNotifications(),
    listAllUsers(),
    listAllFaces(),
    listAllActivities(),
  ]);

  const count = notifications.length;
  const t = await getTranslations('notifications');

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <main>
        {count > 0 && (
          <p
            style={{
              fontSize: 11.5,
              color: 'var(--mf-text-muted)',
              padding: '20px 18px 0',
              marginBottom: 14,
              fontWeight: 600,
            }}
          >
            {t('count', { count })}
          </p>
        )}
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
