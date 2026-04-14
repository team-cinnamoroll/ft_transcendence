import NotificationList from "@/components/notifications/NotificationList";
import { notificationRepository } from "@/repositories/notification-repository";

export default function NotificationsPage() {
  const count = notificationRepository.listAll().length;

  return (
    <div className="flex flex-col">
      {/* スティッキーヘッダー */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-100">通知</h1>
          {count > 0 && (
            <span className="text-xs text-zinc-500">{count} 件</span>
          )}
        </div>
      </header>

      <main className="px-4 py-4">
        <NotificationList />
      </main>
    </div>
  );
}
