import { NextResponse } from 'next/server';

import { createBackendClient } from '../../../lib/backend-client';

export async function GET() {
  const res = await createBackendClient().api.v1.hello.$get();
  const data = await res.json();

  return NextResponse.json({
    message: `${data.message} (via BFF)`,
  });
}
