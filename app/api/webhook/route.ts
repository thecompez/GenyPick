import { NextRequest, NextResponse } from "next/server";
import { dbQuery, hasDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  const event = await request.json().catch(() => null);
  if (hasDatabase() && event) {
    await dbQuery(
      `
      insert into app_settings (key, value)
      values ($1, $2::jsonb)
      on conflict (key)
      do update set value = excluded.value, updated_at = now()
      `,
      [`webhook:${Date.now()}`, JSON.stringify(event)]
    );
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "GenyPick webhook" });
}
