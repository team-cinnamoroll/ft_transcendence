import { NextResponse } from 'next/server';

import { getBackendClient } from '../../../lib/backend-client';

export async function GET() {
  const res = await getBackendClient().api.v1.hello.$get();
  const data = await res.json();

  return NextResponse.json({
    message: `${data.message} (via BFF)`,
  });
}
