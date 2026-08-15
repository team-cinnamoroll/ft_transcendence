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

    // heartbeatAction/checkPendingFriendRequestsActionを同時発火させない。
    // 同時に発火すると、アクセストークンが切れた瞬間に両方が同じリフレッシュトークンを使おうとし、
    // 片方だけが成功して片方が失敗する競合が起きうる(失敗側のCookie削除が成功側を上書きしてしまう)。
    const tick = async () => {
      // MiddlewareでのSet-Cookie握り潰し（Server Actionバグ）を回避するため、
      // 事前に空のGETリクエストを投げて、もし期限切れならここでリフレッシュ(とSet-Cookie)を済ませる
      await fetch('/ping').catch(() => {});

      await heartbeatAction();
      const hasPending = await checkPendingFriendRequestsAction();
      setHasPendingFriendRequest(hasPending);
    };

    void tick();
    const id = setInterval(() => void tick(), HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(id);
  }, [isAuthenticated]);

  return (
    <FriendRequestBadgeContext.Provider value={hasPendingFriendRequest}>
      {children}
    </FriendRequestBadgeContext.Provider>
  );
};
