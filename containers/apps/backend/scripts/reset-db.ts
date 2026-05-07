import postgres from 'postgres';

import { getDatabaseUrl } from '../src/infra/db/database-url';

export async function reset() {
  const sql = postgres(getDatabaseUrl());

  console.log('🔄 Cleaning database tables...');

  try {
    // 1. publicスキーマ内のすべてのテーブル、ビュー、型を削除するSQL
    // これにより、スキーマ自体は残したまま中身だけを空にします
    await sql`DROP SCHEMA IF EXISTS public CASCADE;`;
    await sql`CREATE SCHEMA public`;
    await sql`GRANT ALL ON SCHEMA public TO public`;
    await sql`COMMENT ON SCHEMA public IS 'standard public schema';`;

    console.log('✅ All tables dropped!');
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
  } finally {
    await sql.end();
  }
}

reset().catch(console.error);
