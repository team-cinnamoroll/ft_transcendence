import { userRepository } from "@/repositories/user-repository";
import { faceRepository } from "@/repositories/face-repository";
import { activityRepository } from "@/repositories/activity-repository";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import ActivityTileCalendar from "./ActivityTileCalendar";

/**
 * ホーム上部のプロフィールエリア（Server Component）。
 * ユーザーアイコン・名前・バッジ・フェイス数・アクティビティ数・タイルカレンダーを表示する。
 */
const HomeProfile = () => {
  const user = userRepository.getCurrentUser();
  const faces = faceRepository.listByUserId(user.id);
  const activities = activityRepository.listByUserId(user.id);

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
              <span className="font-semibold text-zinc-200">{faces.length}</span>{" "}
              フェイス
            </span>
            <span className="w-px h-3.5 bg-zinc-700 inline-block" />
            <span>
              <span className="font-semibold text-zinc-200">
                {activities.length}
              </span>{" "}
              アクティビティ
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
