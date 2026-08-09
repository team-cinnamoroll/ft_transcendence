import BottomNav from '@/components/ui/BottomNav';
import SideNav from '@/components/ui/SideNav';
import AppHeader from '@/components/ui/AppHeader';
import ContextRail from '@/components/ui/ContextRail';
import MobileComposeBar from '@/components/ui/MobileComposeBar';
import { HeartbeatProvider } from '@/lib/heartbeat-provider';
import { SeedCreatedProvider } from '@/lib/seed-created-provider';
import { getLayoutData } from '@/server/usecases/layout';
import { getAuthSession } from '@/server/usecases/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  // 未ログイン時はナビゲーション類(SideNav/AppHeader等)を表示しない。
  // 現状ルート(/)以外のページはまだ保護されていないが、その対応は別Issue(ページ保護)で行う。
  if (!session) {
    return <>{children}</>;
  }

  const { currentUser, myFaces, mySeeds, friends } = await getLayoutData();

  return (
    <SeedCreatedProvider>
      <HeartbeatProvider isAuthenticated={true}>
        <div
          className="flex h-screen w-full overflow-hidden"
          style={{ background: 'var(--mf-bg-light)' }}
        >
          <SideNav
            faces={myFaces}
            user={currentUser}
            realUserId={session.userId}
            seeds={mySeeds}
            faceCount={myFaces.length}
            seedCount={mySeeds.length}
            isAuthenticated={true}
          />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <AppHeader
              user={currentUser}
              realUserId={session.userId}
              faceCount={myFaces.length}
              seedCount={mySeeds.length}
              isAuthenticated={true}
            />
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <main
                className="flex-1 min-w-0 overflow-y-auto pb-36 md:pb-0"
                style={{ borderRight: '0.5px solid var(--mf-line)' }}
              >
                {children}
              </main>
              <ContextRail user={currentUser} faces={myFaces} seeds={mySeeds} friends={friends} />
            </div>
          </div>
        </div>
        <BottomNav className="md:hidden" />
        <MobileComposeBar defaultFace={myFaces[0]} />
      </HeartbeatProvider>
    </SeedCreatedProvider>
  );
}
