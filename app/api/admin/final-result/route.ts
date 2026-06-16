import { NextRequest, NextResponse } from "next/server";
import { assertAdminSecret, dbQuery, hasDatabase } from "@/lib/db";
import { adminFinalResultSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const parsed = adminFinalResultSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    assertAdminSecret(parsed.data.adminSecret);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL is required for admin routes" }, { status: 503 });
  }

  const existing = await dbQuery(`select id from final_results where id = 1 limit 1`);
  if (existing.length > 0 && !parsed.data.force) {
    return NextResponse.json(
      {
        error:
          "Final result is already set. Send force=true only if you intentionally need to replace it before on-chain finalization."
      },
      { status: 409 }
    );
  }

  await dbQuery(
    `
    insert into final_results (id, champion_id, runner_up_id, third_place_id, fourth_place_id)
    values (1, $1, $2, $3, $4)
    on conflict (id)
    do update set
      champion_id = excluded.champion_id,
      runner_up_id = excluded.runner_up_id,
      third_place_id = excluded.third_place_id,
      fourth_place_id = excluded.fourth_place_id,
      created_at = now()
    `,
    [parsed.data.champion, parsed.data.runnerUp, parsed.data.thirdPlace, parsed.data.fourthPlace]
  );

  await dbQuery(
    `
    insert into app_settings (key, value)
    values ('final_result_set', '{"value": true}'::jsonb)
    on conflict (key)
    do update set value = excluded.value, updated_at = now()
    `
  );

  return NextResponse.json({ ok: true });
}
