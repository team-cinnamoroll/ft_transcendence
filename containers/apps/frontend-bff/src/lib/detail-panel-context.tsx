"use client";

import { createContext, useContext, useState } from "react";
import type { DetailPanelState } from "@/types/detail-panel";

type DetailPanelContextValue = {
  state: DetailPanelState;
  openActivity: (activityId: string) => void;
  openFace: (faceId: string) => void;
  close: () => void;
};

const DetailPanelContext = createContext<DetailPanelContextValue | null>(null);

export const DetailPanelProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<DetailPanelState>({ type: "none" });

  const openActivity = (activityId: string) => {
    setState({ type: "activity", activityId });
  };

  const openFace = (faceId: string) => {
    setState({ type: "face", faceId });
  };

  const close = () => {
    setState({ type: "none" });
  };

  return (
    <DetailPanelContext.Provider value={{ state, openActivity, openFace, close }}>
      {children}
    </DetailPanelContext.Provider>
  );
};

export const useDetailPanel = (): DetailPanelContextValue => {
  const context = useContext(DetailPanelContext);
  if (!context) {
    throw new Error("useDetailPanel は DetailPanelProvider の内側で使用してください");
  }
  return context;
};
