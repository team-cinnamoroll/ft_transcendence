import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import '../globals.css';
import BottomNav from '@/components/ui/BottomNav';
import SideNav from '@/components/ui/SideNav';
import TopBar from '@/components/ui/TopBar';
import DetailPanel from '@/components/ui/DetailPanel';
import { DetailPanelProvider } from '@/lib/detail-panel-context';
import { getViewerContext } from '@/server/usecases/viewer';
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

  const [{ myFaces }, messages] = await Promise.all([getViewerContext(), getMessages()]);

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
                <TopBar />
                <div className="flex flex-1 min-h-0 overflow-hidden">
                  <main className="flex-1 min-w-0 overflow-y-auto border-r border-zinc-800 pb-16 md:pb-0">
                    {children}
                  </main>
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
