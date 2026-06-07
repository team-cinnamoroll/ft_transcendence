import { NextResponse } from 'next/server';

import { getSeedDetailPanelData } from '@/server/usecases/detail-panel';

export const dynamic = 'force-dynamic';

type Params = {
  params: Promise<{ seedId: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  const { seedId } = await params;
  const data = await getSeedDetailPanelData(seedId);
  return NextResponse.json(data);
}
