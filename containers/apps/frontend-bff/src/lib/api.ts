import { publicEnv } from './env/public';

export type HelloResponse = {
  message: string;
};

function getBffApiBaseUrl(): string {
  return publicEnv.NEXT_PUBLIC_BFF_API_BASE_URL.replace(/\/+$/, '');
}

export async function fetchHelloFromBff(): Promise<HelloResponse> {
  const res = await fetch(`${getBffApiBaseUrl()}/hello`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`BFF /hello failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as HelloResponse;
}
