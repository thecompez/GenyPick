import { NextRequest, NextResponse } from "next/server";
import { assertAdminSecret, getPool, hasDatabase } from "@/lib/db";
import {
  calculateEstimatedReward,
  calculateScore
} from "@/lib/scoring";

type PredictionRow = {
  id: string;
  champion_id: number;
  runner_up_id: number;
  third_place_id: number;
  fourth_place_id: number;
  entry_amount: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    assertAdminSecret(body?.adminSecret);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL is required for admin routes" }, { status: 503 });
  }

  const pool = getPool();
  if (!pool) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const client = await pool.connect();
  try {
    await client.query("begin");
    const finalResultQuery = await client.query(
      `select champion_id, runner_up_id, third_place_id, fourth_place_id from final_results where id = 1`
    );
    const finalResult = finalResultQuery.rows[0];
    if (!finalResult) {
      await client.query("rollback");
      return NextResponse.json({ error: "Final result is not set" }, { status: 409 });
    }

    const predictionQuery = await client.query<PredictionRow>(
      `select * from prediction_attempts where active = true order by submitted_at asc`
    );
    const scored = predictionQuery.rows.map((row) => {
      const score = calculateScore(
        {
          champion: Number(row.champion_id),
          runnerUp: Number(row.runner_up_id),
          thirdPlace: Number(row.third_place_id),
          fourthPlace: Number(row.fourth_place_id)
        },
        {
          champion: Number(finalResult.champion_id),
          runnerUp: Number(finalResult.runner_up_id),
          thirdPlace: Number(finalResult.third_place_id),
          fourthPlace: Number(finalResult.fourth_place_id)
        }
      );
      return {
        id: row.id,
        score: score.total,
        exactMatch: score.exactTopFour,
        eligible: score.exactTopFour
      };
    });

    const totalPoolQuery = await client.query<{ total_pool: string }>(
      `select coalesce(sum(entry_amount), 0) as total_pool from prediction_attempts`
    );
    const totalPool = Number(totalPoolQuery.rows[0]?.total_pool ?? 0);
    const rewardPool = (totalPool * 75) / 100;
    const perfectWinnerCount = scored.filter((row) => row.exactMatch).length;
    const rewardPerWinner = calculateEstimatedReward(rewardPool, perfectWinnerCount);

    for (const row of scored) {
      await client.query(
        `
        update prediction_attempts
        set score = $1,
            exact_match = $2,
            eligible = $3,
            reward_amount = $4
        where id = $5
        `,
        [
          row.score,
          row.exactMatch,
          row.eligible,
          row.exactMatch ? rewardPerWinner : 0,
          row.id
        ]
      );
    }

    await client.query("commit");
    return NextResponse.json({
      ok: true,
      updated: scored.length,
      rewardPool,
      perfectWinnerCount,
      rewardPerWinner,
      noWinner: perfectWinnerCount === 0
    });
  } catch (error) {
    await client.query("rollback");
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Score recalculation failed" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
