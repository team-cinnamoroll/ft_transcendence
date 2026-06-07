import Image from 'next/image';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import ActivityTileCalendar from './ActivityTileCalendar';
import { useTranslations } from 'next-intl';

type Props = {
  user: UserProfile;
  faces: Face[];
  activities: Activity[];
};

const HomeProfile = ({ user, faces, activities }: Props) => {
  const t = useTranslations('homeProfile');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 28px 12px' }}>
      {/* アバター・名前 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={44}
            height={44}
            style={{ objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--mf-brand)' }}>
            {user.name}
          </div>
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
              {t('faces')}
            </span>
            <span style={{ width: 1, height: 12, background: 'var(--mf-line)', display: 'inline-block' }} />
            <span>
              <b style={{ color: 'var(--mf-text)', fontWeight: 700 }}>{activities.length}</b>{' '}
              {t('activities')}
            </span>
          </div>
        </div>
      </div>

      {/* タイルカレンダー */}
      <ActivityTileCalendar activities={activities} />
    </div>
  );
};

export default HomeProfile;
