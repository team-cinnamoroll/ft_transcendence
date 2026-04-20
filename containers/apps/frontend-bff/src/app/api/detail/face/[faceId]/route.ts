import { NextResponse } from 'next/server';

import { getFaceDetailPanelData } from '@/server/usecases/detail-panel';

export const dynamic = 'force-dynamic';

type Params = {
  params: Promise<{ faceId: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  const { faceId } = await params;
  const data = await getFaceDetailPanelData(faceId);
  return NextResponse.json(data);
}
