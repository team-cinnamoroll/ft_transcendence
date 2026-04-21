import 'server-only';

export type Provider<T> = () => T;

export function createSingletonProvider<T>(createImpl: () => T): Provider<T> {
  let cached: T | undefined;

  return () => {
    if (cached !== undefined) return cached;
    cached = createImpl();
    return cached;
  };
}
