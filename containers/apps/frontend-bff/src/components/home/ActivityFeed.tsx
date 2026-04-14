"use client";

import { activityRepository } from "@/repositories/activity-repository";
import { faceRepository } from "@/repositories/face-repository";
import { userRepository } from "@/repositories/user-repository";
import { useDetailPanel } from "@/lib/detail-panel-context";
import { createLookupMap, getFaceTitle } from "@/lib/display";
import ActivityCard from "@/components/ui/ActivityCard";

type ActivityFeedProps = {
  /** フィルタするフェイス ID。null のときは全フェイスを表示 */
  selectedFaceId?: string | null;
};

/**
 * ホームフィード。
 * currentUser のアクティビティを時系列降順（最新が先頭）で表示する。
 * selectedFaceId が指定されている場合は該当フェイスのみに絞り込む。
 */
const ActivityFeed = ({ selectedFaceId }: ActivityFeedProps) => {
  const { openActivity } = useDetailPanel();
  const user = userRepository.getCurrentUser();

  const allActivities = activityRepository.listByUserId(user.id);
  const displayActivities = selectedFaceId
    ? allActivities.filter((a) => a.faceId === selectedFaceId)
    : allActivities;

  // フェイスを O(1) で引けるようにマップ化
  const faceCache = createLookupMap(
    displayActivities.flatMap((activity) => {
      const face = faceRepository.findById(activity.faceId);
      return face ? [face] : [];
    }),
    (face) => face.id,
  );

  if (displayActivities.length === 0) {
    return (
      <p className="text-center text-sm text-zinc-500 py-16">
        アクティビティがありません
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {displayActivities.map((activity, index) => {
        const face = faceCache.get(activity.faceId);
        if (!face) return null;
        return (
          <li key={activity.id}>
            <ActivityCard
              activity={activity}
              user={user}
              faceTitle={getFaceTitle(face)}
              faceId={face.id}
              priority={index === 0}
              onClick={() => openActivity(activity.id)}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default ActivityFeed;
