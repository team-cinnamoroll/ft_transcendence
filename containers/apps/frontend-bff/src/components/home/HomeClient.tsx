"use client";

import { useState } from "react";
import { faceRepository } from "@/repositories/face-repository";
import { userRepository } from "@/repositories/user-repository";
import FaceFilterBar from "./FaceFilterBar";
import ActivityFeed from "./ActivityFeed";

/**
 * フェイスフィルタ状態を管理する Client Component。
 * FaceFilterBar と ActivityFeed を束ね、フィルタ連携を担う。
 */
const HomeClient = () => {
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);

  const user = userRepository.getCurrentUser();
  const faces = faceRepository.listByUserId(user.id);

  const handleSelectFace = (faceId: string | null) => {
    setSelectedFaceId(faceId);
  };

  return (
    <div className="flex flex-col">
      {/* フェイスフィルタバー */}
      <FaceFilterBar
        faces={faces}
        selectedFaceId={selectedFaceId}
        onSelect={handleSelectFace}
      />

      {/* アクティビティフィード */}
      <div className="px-4 py-4">
        <ActivityFeed selectedFaceId={selectedFaceId} />
      </div>
    </div>
  );
};

export default HomeClient;
