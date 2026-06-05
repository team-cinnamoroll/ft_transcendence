import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import '../globals.css';
import BottomNav from '@/components/ui/BottomNav';
import SideNav from '@/components/ui/SideNav';
import TopBar from '@/components/ui/TopBar';
import DetailPanel from '@/components/ui/DetailPanel';
import AppHeader from '@/components/ui/AppHeader';
import ContextRail from '@/components/ui/ContextRail';
import { DetailPanelProvider } from '@/lib/detail-panel-context';
import { getLayoutData } from '@/server/usecases/layout';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

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
  const { currentUser, myFaces, myActivities, subscribedFaces, latestActivityByFaceId, allUsers } =
    layoutData;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} h-full antialiased dark scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">
        <NextIntlClientProvider messages={messages}>
          <DetailPanelProvider>
            <div className="flex h-screen w-full overflow-hidden">
              <SideNav faces={myFaces} />
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* モバイルヘッダー（md 未満のみ表示） */}
                <AppHeader
                  user={currentUser}
                  faceCount={myFaces.length}
                  activityCount={myActivities.length}
                />
                <TopBar />
                <div className="flex flex-1 min-h-0 overflow-hidden">
                  <main className="flex-1 min-w-0 overflow-y-auto border-r border-zinc-800 pb-16 md:pb-0">
                    {children}
                  </main>
                  {/* コンテキストレール（lg 以上のみ表示） */}
                  <ContextRail
                    user={currentUser}
                    faces={myFaces}
                    activities={myActivities}
                    subscribedFaces={subscribedFaces}
                    latestActivityByFaceId={latestActivityByFaceId}
                    users={allUsers}
                  />
                  <DetailPanel />
                </div>
              </div>
            </div>
            <BottomNav className="md:hidden" />
          </DetailPanelProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
