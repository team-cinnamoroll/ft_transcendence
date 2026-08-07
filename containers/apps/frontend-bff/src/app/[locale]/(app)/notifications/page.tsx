import NotificationList from '@/components/notifications/NotificationList';
import { listAllSeeds } from '@/server/usecases/seeds';
import { listAllFaces } from '@/server/usecases/faces';
import { listNotifications } from '@/server/usecases/notifications';
import { getTranslations } from 'next-intl/server';

export default async function NotificationsPage() {
  const [notifications, faces, seeds] = await Promise.all([
    listNotifications(),
    listAllFaces(),
    listAllSeeds(),
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
        <NotificationList notifications={notifications} faces={faces} seeds={seeds} />
      </main>
    </div>
  );
}
