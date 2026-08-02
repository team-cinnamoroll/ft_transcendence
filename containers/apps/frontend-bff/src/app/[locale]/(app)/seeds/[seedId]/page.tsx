import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import SeedDetailPage from '@/components/seed/SeedDetailPage';
import { getSeedDetailData } from '@/server/usecases/seeds';
import SeedBackButton from '@/components/seed/SeedBackButton';

type Props = {
  params: Promise<{ seedId: string }>;
};

const SeedPage = async ({ params }: Props) => {
  const { seedId } = await params;
  const data = await getSeedDetailData(seedId);

  if (!data) notFound();

  const t = await getTranslations('seedDetail');

  return (
    <div className="flex flex-col">
      <header
        className="sticky top-0 z-10 flex items-center justify-between"
        style={{
          height: 52,
          padding: '0 12px',
          borderBottom: '0.5px solid var(--mf-line-soft)',
          background: 'var(--mf-bg-light)',
        }}
      >
        <SeedBackButton />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--mf-brand)' }}>
          {t('title')}
        </span>
        <button
          type="button"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--mf-brand)',
            fontSize: 18,
            letterSpacing: 1,
          }}
          aria-label={t('moreOptions')}
        >
          ···
        </button>
      </header>

      <main>
        <SeedDetailPage
          seed={data.seed}
          face={data.face}
          author={data.author}
          isOwner={data.isOwner}
          users={data.users}
          outgoingLinks={[]}
          incomingLinks={[]}
        />
      </main>
    </div>
  );
};

export default SeedPage;
