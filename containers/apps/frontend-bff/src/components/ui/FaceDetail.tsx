"use client";

import { X } from "lucide-react";
import { faceRepository } from "@/repositories/face-repository";
import { activityRepository } from "@/repositories/activity-repository";
import { userRepository } from "@/repositories/user-repository";
import { useDetailPanel } from "@/lib/detail-panel-context";
import { createLookupMap, getFaceTitle } from "@/lib/display";
import FaceHeader from "@/components/face/FaceHeader";
import ActivityCard from "./ActivityCard";

type FaceDetailProps = {
  faceId: string;
};

const FaceDetail = ({ faceId }: FaceDetailProps) => {
  const { close, openActivity } = useDetailPanel();

  const face = faceRepository.findById(faceId);
  const currentUser = userRepository.getCurrentUser();
  const userMap = createLookupMap(userRepository.listAll(), (user) => user.id);

  if (!face) {
    return (
      <div className="flex flex-col h-full">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-zinc-400">フェイス詳細</h2>
          <button
            type="button"
            aria-label="閉じる"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
          <p className="text-sm text-zinc-600">フェイスが見つかりませんでした</p>
        </div>
      </div>
    );
  }

  const activities = activityRepository.listByFaceId(faceId);
  const user = userRepository.findById(face.userId);
  const isOwner = face.userId === currentUser.id;
  const faceTitle = getFaceTitle(face) || face.name;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ヘッダー */}
      <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-zinc-400">フェイス詳細</h2>
        <button
          type="button"
          aria-label="閉じる"
          onClick={close}
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <X size={16} />
        </button>
      </div>

      {/* FaceHeader（既存コンポーネントを流用） */}
      <FaceHeader face={face} isOwner={isOwner} />

      {/* 区切り */}
      <div className="border-b border-zinc-800" />

      {/* アクティビティ一覧 */}
      <div className="px-4 py-4 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          このフェイスのアクティビティ
        </p>
        {activities.length === 0 ? (
          <p className="text-sm text-zinc-600">まだアクティビティがありません</p>
        ) : (
          activities.map((activity, i) => {
            const activityUser = userMap.get(activity.userId) ?? user;
            if (!activityUser) return null;

            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                user={activityUser}
                faceTitle={faceTitle}
                faceId={faceId}
                priority={i === 0}
                onClick={() => openActivity(activity.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default FaceDetail;
