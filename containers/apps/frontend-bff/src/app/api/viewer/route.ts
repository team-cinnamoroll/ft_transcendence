import { NextResponse } from 'next/server';

import { getViewerContext } from '@/server/usecases/viewer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getViewerContext();
  return NextResponse.json(data);
}
