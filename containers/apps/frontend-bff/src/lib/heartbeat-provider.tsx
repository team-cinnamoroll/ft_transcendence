'use client';

import { useEffect } from 'react';
import { heartbeatAction } from '@/server/actions/presence';

// バックエンドのオンライン判定TTL（90秒）より十分短い間隔にする
const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * ログイン中、定期的にオンラインであることをサーバーに伝え続ける。
 * 画面には何も表示せず、子要素をそのまま描画するだけの部品。
 */
export const HeartbeatProvider = ({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
}) => {
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void heartbeatAction();
    const id = setInterval(() => {
      void heartbeatAction();
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(id);
  }, [isAuthenticated]);

  return <>{children}</>;
};
