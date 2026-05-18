import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { UserProfile } from '@/types/user-profile';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import ActivityTileCalendar from './ActivityTileCalendar';
import { getTranslations } from 'next-intl/server';

/**
 * ホーム上部のプロフィールエリア（Server Component）。
 * ユーザーアイコン・名前・バッジ・フェイス数・アクティビティ数・タイルカレンダーを表示する。
 */
type Props = {
  user: UserProfile;
  faces: Face[];
  activities: Activity[];
};

const HomeProfile = async ({ user, faces, activities }: Props) => {
  const t = await getTranslations('homeProfile');
  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
      {/* アバター・名前・バッジ */}
      <div className="flex items-center gap-3">
        <Avatar
          src={user.avatarUrl}
          alt={user.name}
          size="lg"
          className="ring-2 ring-violet-500/60"
        />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-zinc-100">{user.name}</span>
            {user.badge && <Badge emoji={user.badge} />}
          </div>
          {/* フェイス数・アクティビティ数 */}
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span>
              <span className="font-semibold text-zinc-200">{faces.length}</span> {t('faces')}
            </span>
            <span className="w-px h-3.5 bg-zinc-700 inline-block" />
            <span>
              <span className="font-semibold text-zinc-200">{activities.length}</span>{' '}
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
