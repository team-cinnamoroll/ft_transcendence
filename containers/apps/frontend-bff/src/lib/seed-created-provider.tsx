'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { Seed } from '@/types/seed';

type SeedCreatedListener = (seed: Seed) => void;

type SeedCreatedBus = {
  publishSeedCreated: (seed: Seed) => void;
  subscribeSeedCreated: (listener: SeedCreatedListener) => () => void;
};

// Providerがツリーに存在しない場合（Storybook等）でもuseContextがエラーにならないよう既定値を持たせる
const noopBus: SeedCreatedBus = {
  publishSeedCreated: () => {},
  subscribeSeedCreated: () => () => {},
};

const SeedCreatedContext = createContext<SeedCreatedBus>(noopBus);

/**
 * シード作成イベントをレイアウト配下のどこからでも発行・購読できるようにする。
 * 画面には何も表示せず、子要素をそのまま描画するだけの部品（HeartbeatProviderと同様の構造）。
 */
export const SeedCreatedProvider = ({ children }: { children: React.ReactNode }) => {
  const listenersRef = useRef<Set<SeedCreatedListener>>(new Set());

  const publishSeedCreated = useCallback((seed: Seed) => {
    listenersRef.current.forEach((listener) => listener(seed));
  }, []);

  const subscribeSeedCreated = useCallback((listener: SeedCreatedListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = useMemo(
    () => ({ publishSeedCreated, subscribeSeedCreated }),
    [publishSeedCreated, subscribeSeedCreated]
  );

  return <SeedCreatedContext.Provider value={value}>{children}</SeedCreatedContext.Provider>;
};

export const usePublishSeedCreated = (): ((seed: Seed) => void) =>
  useContext(SeedCreatedContext).publishSeedCreated;

/** シード作成イベントを購読する。フィードを表示する画面側で使う */
export const useSubscribeSeedCreated = (onSeedCreated: (seed: Seed) => void): void => {
  const { subscribeSeedCreated } = useContext(SeedCreatedContext);
  const handlerRef = useRef(onSeedCreated);

  useEffect(() => {
    handlerRef.current = onSeedCreated;
  }, [onSeedCreated]);

  useEffect(() => {
    return subscribeSeedCreated((seed) => handlerRef.current(seed));
  }, [subscribeSeedCreated]);
};
