import { NextRequest, NextResponse } from "next/server";
import { dbQuery, hasDatabase, shouldUseDemoData } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await context.params;
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  }
  if (!hasDatabase()) {
    if (!shouldUseDemoData()) {
      return NextResponse.json(
        { error: "DATABASE_URL is required to read production predictions" },
        { status: 503 }
      );
    }
    return NextResponse.json({ prediction: null });
  }
  const history = await dbQuery(
    `
    select *
    from prediction_attempts
    where lower(wallet_address) = lower($1)
    order by attempt_number desc
    `,
    [wallet]
  );
  return NextResponse.json({
    prediction: history.find((row) => Boolean(row.active)) ?? null,
    attemptCount: history.length,
    history
  });
}
