import { getAuthSession } from '@/server/usecases/auth';
import { exportCurrentUserData } from '@/server/usecases/data-export';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const data = await exportCurrentUserData();
  const filename = `multiface-export-${data.exportedAt.slice(0, 10)}.json`;

  // ブラウザにダウンロードさせるため attachment で返す（api/viewer は inline JSON、こちらは添付）
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
