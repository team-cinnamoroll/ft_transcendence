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
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: '0.5px solid var(--mf-line)',
          background: 'var(--mf-bg-light)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
          {t('title')}
        </h1>
        {count > 0 && (
          <span style={{ fontSize: 12, color: 'var(--mf-text-muted)' }}>
            {t('count', { count })}
          </span>
        )}
      </header>

      <main>
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
