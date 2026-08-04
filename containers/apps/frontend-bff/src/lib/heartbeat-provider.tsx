'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { heartbeatAction } from '@/server/actions/presence';
import { checkPendingFriendRequestsAction } from '@/server/actions/friendship';

// バックエンドのオンライン判定TTL（90秒）より十分短い間隔にする
export const HEARTBEAT_INTERVAL_MS = 30_000;

const FriendRequestBadgeContext = createContext(false);

/** ナビゲーションの「フレンド」項目に通知バッジを出すかどうか */
export const useHasPendingFriendRequest = (): boolean => useContext(FriendRequestBadgeContext);

/**
 * ログイン中、定期的にオンラインであることをサーバーに伝え続ける。
 * 同じ間隔で、自分宛ての未処理フレンド申請が届いているかどうかも確認し、
 * 結果を useHasPendingFriendRequest() で参照できるようにする。
 * 画面には何も表示せず、子要素をそのまま描画するだけの部品。
 */
export const HeartbeatProvider = ({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
}) => {
  const [hasPendingFriendRequest, setHasPendingFriendRequest] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setHasPendingFriendRequest(false);
      return;
    }

    const tick = () => {
      void heartbeatAction();
      void checkPendingFriendRequestsAction().then(setHasPendingFriendRequest);
    };

    tick();
    const id = setInterval(tick, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(id);
  }, [isAuthenticated]);

  return (
    <FriendRequestBadgeContext.Provider value={hasPendingFriendRequest}>
      {children}
    </FriendRequestBadgeContext.Provider>
  );
};
