import type { Metadata } from 'next';
import '../globals.css';
import BottomNav from '@/components/ui/BottomNav';
import SideNav from '@/components/ui/SideNav';
import AppHeader from '@/components/ui/AppHeader';
import ContextRail from '@/components/ui/ContextRail';
import MobileComposeBar from '@/components/ui/MobileComposeBar';
import { DetailPanelProvider } from '@/lib/detail-panel-context';
import { getLayoutData } from '@/server/usecases/layout';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const [layoutData, messages] = await Promise.all([getLayoutData(), getMessages()]);
  const { currentUser, myFaces, mySeeds, subscribedFaces, latestSeedByFaceId, allUsers } =
    layoutData;

  return (
    <html
      lang={locale}
      className="h-full scroll-smooth"
      data-scroll-behavior="smooth"
      style={{ background: 'var(--mf-bg-light)' }}
    >
      <body
        className="min-h-full"
        style={{ background: 'var(--mf-bg-light)', color: 'var(--mf-text)' }}
      >
        <NextIntlClientProvider messages={messages}>
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
              />
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <AppHeader
                  user={currentUser}
                  faceCount={myFaces.length}
                  seedCount={mySeeds.length}
                />
                <div className="flex flex-1 min-h-0 overflow-hidden">
                  <main
                    className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0"
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
