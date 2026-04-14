"use client";

import { type Face } from "@/types/face";
import { activityRepository } from "@/repositories/activity-repository";
import { userRepository } from "@/repositories/user-repository";
import { useDetailPanel } from "@/lib/detail-panel-context";
import { createLookupMap, getFaceTitle } from "@/lib/display";
import UIActivityCard from "@/components/ui/ActivityCard";

type FaceActivityFeedProps = {
  face: Face;
};

/**
 * 指定フェイスに属するアクティビティを時系列降順で表示するフィード。
 */
const FaceActivityFeed = ({ face }: FaceActivityFeedProps) => {
  const { openActivity } = useDetailPanel();

  // 該当フェイスのアクティビティを取得（Repository 経由・降順済み）
  const faceActivities = activityRepository.listByFaceId(face.id);

  // ユーザーを O(1) で引けるようにマップ化
  const userMap = createLookupMap(userRepository.listAll(), (user) => user.id);
  const faceTitle = getFaceTitle(face);

  if (faceActivities.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-zinc-500">
        アクティビティがありません
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {faceActivities.map((activity) => {
        const user = userMap.get(activity.userId);
        if (!user) return null;
        return (
          <li key={activity.id}>
            <UIActivityCard
              activity={activity}
              user={user}
              faceTitle={faceTitle}
              faceId={face.id}
              onClick={() => openActivity(activity.id)}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default FaceActivityFeed;
