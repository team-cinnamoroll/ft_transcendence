import { NextResponse } from 'next/server';

import { getAuthSession } from '@/server/usecases/auth';
import { getViewerContext } from '@/server/usecases/viewer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const data = await getViewerContext();
  return NextResponse.json(data);
}
