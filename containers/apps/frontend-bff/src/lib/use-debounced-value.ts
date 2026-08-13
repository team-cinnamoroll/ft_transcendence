'use client';

import { useEffect, useState } from 'react';

/**
 * 値の変化から指定時間(delayMs)だけ経過したら反映する。
 * 検索入力のように、連続入力のたびにAPIを呼びたくない場面で使う。
 */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
