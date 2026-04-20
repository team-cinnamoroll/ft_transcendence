import { NextResponse } from 'next/server';

import { getActivityDetailPanelData } from '@/server/usecases/detail-panel';

export const dynamic = 'force-dynamic';

type Params = {
  params: Promise<{ activityId: string }>;
};

export async function GET(_req: Request, { params }: Params) {
  const { activityId } = await params;
  const data = await getActivityDetailPanelData(activityId);
  return NextResponse.json(data);
}
