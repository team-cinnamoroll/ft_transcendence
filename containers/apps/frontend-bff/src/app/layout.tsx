import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/ui/BottomNav';
import SideNav from '@/components/ui/SideNav';
import TopBar from '@/components/ui/TopBar';
import DetailPanel from '@/components/ui/DetailPanel';
import { DetailPanelProvider } from '@/lib/detail-panel-context';
import { getViewerContext } from '@/server/usecases/viewer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MultiFace',
  description: 'フェイス（多面性）で記録する SNS',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { myFaces } = await getViewerContext();

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} h-full antialiased dark scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">
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
          <BottomNav />
        </DetailPanelProvider>
      </body>
    </html>
  );
}
