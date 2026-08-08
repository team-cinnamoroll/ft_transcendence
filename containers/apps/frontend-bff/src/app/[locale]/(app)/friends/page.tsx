import { getTranslations } from 'next-intl/server';
import FriendsPageClient from '@/components/friends/FriendsPageClient';
import { getMyFriends, getMyPendingRequests } from '@/server/usecases/friendship';

export default async function FriendsPage() {
  const t = await getTranslations('friendsPage');

  const [friendsResult, outgoingResult, incomingResult] = await Promise.all([
    getMyFriends(),
    getMyPendingRequests('outgoing'),
    getMyPendingRequests('incoming'),
  ]);

  const initialFriends = friendsResult.success ? friendsResult.data.friendships : [];
  const friendsNextCursor = friendsResult.success ? friendsResult.data.nextCursor : null;
  const initialOutgoing = outgoingResult.success ? outgoingResult.data.pendingRequests : [];
  const outgoingNextCursor = outgoingResult.success ? outgoingResult.data.nextCursor : null;
  const initialIncoming = incomingResult.success ? incomingResult.data.pendingRequests : [];
  const incomingNextCursor = incomingResult.success ? incomingResult.data.nextCursor : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: '0.5px solid var(--mf-line)',
          background: 'var(--mf-bg-light)',
          padding: '14px 18px',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--mf-brand)' }}>
          {t('title')}
        </span>
      </header>

      <main>
        <FriendsPageClient
          initialFriends={initialFriends}
          friendsNextCursor={friendsNextCursor}
          initialOutgoing={initialOutgoing}
          outgoingNextCursor={outgoingNextCursor}
          initialIncoming={initialIncoming}
          incomingNextCursor={incomingNextCursor}
        />
      </main>
    </div>
  );
}
