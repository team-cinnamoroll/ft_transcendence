import { NextResponse } from 'next/server';

import { runApiHealthCheck } from '@/server/usecases/health';

export const dynamic = 'force-dynamic';

export async function GET() {
  const prefix = '[api/health]';

  const logToTerminal = (line: string) => {
    // “逐次ターミナルにログ” = サーバー側 stdout
    // docker compose logs などで追える想定。
    console.warn(`${prefix} ${line}`);
  };

  logToTerminal('START');
  const result = await runApiHealthCheck(logToTerminal);
  logToTerminal(result.ok ? 'END: OK' : `END: FAIL (${result.failedStep})`);

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
