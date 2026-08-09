import Image from 'next/image';
import type { Seed } from '@/types/seed';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import { getAvatarUrl } from '@/lib/display';
import SeedTileCalendar from './SeedTileCalendar';
import { useTranslations } from 'next-intl';

type Props = {
  user: UserProfile;
  faces: Face[];
  seeds: Seed[];
  today: Date;
};

const HomeProfile = ({ user, faces, seeds, today }: Props) => {
  const t = useTranslations('homeProfile');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 28px 12px' }}>
      {/* アバター・名前 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}
        >
          <Image
            src={getAvatarUrl(user)}
            alt={user.name}
            width={44}
            height={44}
            style={{ objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--mf-brand)' }}>{user.name}</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12.5,
              color: 'var(--mf-text-muted)',
              marginTop: 2,
            }}
          >
            <span>
              <b style={{ color: 'var(--mf-text)', fontWeight: 700 }}>{faces.length}</b>{' '}
              {t('faces', { count: faces.length })}
            </span>
            <span
              style={{
                width: 1,
                height: 12,
                background: 'var(--mf-line)',
                display: 'inline-block',
              }}
            />
            <span>
              <b style={{ color: 'var(--mf-text)', fontWeight: 700 }}>{seeds.length}</b>{' '}
              {t('seeds', { count: seeds.length })}
            </span>
          </div>
        </div>
      </div>

      {/* タイルカレンダー */}
      <SeedTileCalendar seeds={seeds} today={today} />
    </div>
  );
};

export default HomeProfile;
