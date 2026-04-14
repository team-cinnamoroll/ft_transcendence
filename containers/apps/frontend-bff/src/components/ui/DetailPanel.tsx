"use client";

import { useDetailPanel } from "@/lib/detail-panel-context";
import ActivityDetail from "./ActivityDetail";
import FaceDetail from "./FaceDetail";

type DetailPanelPlaceholderProps = {
  emoji?: string;
  message?: string;
};

/**
 * DetailPanel 未選択時のプレースホルダー
 */
const DetailPanelPlaceholder = ({
  emoji = "🗂️",
  message,
}: DetailPanelPlaceholderProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
      <span className="text-4xl text-zinc-700">{emoji}</span>
      {message && <p className="text-sm text-zinc-600">{message}</p>}
    </div>
  );
};

/**
 * DetailPanel（右カラム詳細パネル）
 * PC 表示時に MainColumn の右側に固定表示される。
 * DetailPanelContext の state に基づいて ActivityDetail / FaceDetail を表示する。
 */
const DetailPanel = () => {
  const { state } = useDetailPanel();

  const contentKey =
    state.type === "activity"
      ? `activity-${state.activityId}`
      : state.type === "face"
        ? `face-${state.faceId}`
        : "none";

  const renderContent = () => {
    switch (state.type) {
      case "activity":
        return <ActivityDetail activityId={state.activityId} />;
      case "face":
        return <FaceDetail faceId={state.faceId} />;
      default:
        return (
          <DetailPanelPlaceholder
            emoji="🗂️"
            message="← 左のリストから選択してください"
          />
        );
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-96 shrink-0 overflow-y-auto">
      <div key={contentKey} className="flex flex-col flex-1">
        {renderContent()}
      </div>
    </aside>
  );
};

export default DetailPanel;
