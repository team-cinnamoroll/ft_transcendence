import BottomNav from '@/components/ui/BottomNav';
import SideNav from '@/components/ui/SideNav';
import AppHeader from '@/components/ui/AppHeader';
import ContextRail from '@/components/ui/ContextRail';
import MobileComposeBar from '@/components/ui/MobileComposeBar';
import { DetailPanelProvider } from '@/lib/detail-panel-context';
import { HeartbeatProvider } from '@/lib/heartbeat-provider';
import { getLayoutData } from '@/server/usecases/layout';
import { getAuthSession } from '@/server/usecases/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [
    { currentUser, myFaces, mySeeds, subscribedFaces, latestSeedByFaceId, allUsers },
    session,
  ] = await Promise.all([getLayoutData(), getAuthSession()]);
  const isAuthenticated = session !== null;

  return (
    <HeartbeatProvider isAuthenticated={isAuthenticated}>
      <DetailPanelProvider>
        <div
          className="flex h-screen w-full overflow-hidden"
          style={{ background: 'var(--mf-bg-light)' }}
        >
          <SideNav
            faces={myFaces}
            user={currentUser}
            seeds={mySeeds}
            faceCount={myFaces.length}
            seedCount={mySeeds.length}
            isAuthenticated={isAuthenticated}
          />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <AppHeader
              user={currentUser}
              faceCount={myFaces.length}
              seedCount={mySeeds.length}
              isAuthenticated={isAuthenticated}
            />
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <main
                className="flex-1 min-w-0 overflow-y-auto pb-36 md:pb-0"
                style={{ borderRight: '0.5px solid var(--mf-line)' }}
              >
                {children}
              </main>
              <ContextRail
                user={currentUser}
                faces={myFaces}
                seeds={mySeeds}
                subscribedFaces={subscribedFaces}
                latestSeedByFaceId={latestSeedByFaceId}
                users={allUsers}
              />
            </div>
          </div>
        </div>
        <BottomNav className="md:hidden" />
        <MobileComposeBar defaultFace={myFaces[0]} />
      </DetailPanelProvider>
    </HeartbeatProvider>
  );
}
