'use client';

import { useState } from 'react';
import type { Activity } from '@/types/activity';
import type { Face } from '@/types/face';
import type { User } from '@/types/user';
import FaceFilterBar from './FaceFilterBar';
import ActivityFeed from './ActivityFeed';

/**
 * フェイスフィルタ状態を管理する Client Component。
 * FaceFilterBar と ActivityFeed を束ね、フィルタ連携を担う。
 */
type Props = {
  currentUser: User;
  faces: Face[];
  activities: Activity[];
};

const HomeClient = ({ currentUser, faces, activities }: Props) => {
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);

  const handleSelectFace = (faceId: string | null) => {
    setSelectedFaceId(faceId);
  };

  return (
    <div className="flex flex-col">
      {/* フェイスフィルタバー */}
      <FaceFilterBar faces={faces} selectedFaceId={selectedFaceId} onSelect={handleSelectFace} />

      {/* アクティビティフィード */}
      <div className="px-4 py-4">
        <ActivityFeed
          currentUser={currentUser}
          faces={faces}
          activities={activities}
          selectedFaceId={selectedFaceId}
        />
      </div>
    </div>
  );
};

export default HomeClient;
