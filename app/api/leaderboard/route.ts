import { NextResponse } from "next/server";
import { dbQuery, hasDatabase, shouldUseDemoData } from "@/lib/db";
import {
  deriveLeaderboardStats,
  demoRows,
  sortLeaderboard,
  type LeaderboardRow
} from "@/lib/leaderboard";

type PredictionRecord = {
  wallet_address: string;
  fid: string | number | null;
  username: string | null;
  display_name: string | null;
  pfp_url: string | null;
  champion_id: string | number;
  runner_up_id: string | number;
  third_place_id: string | number;
  fourth_place_id: string | number;
  entry_amount: string;
  tx_hash: string;
  attempt_number: string | number;
  score: string | number | null;
  eligible: boolean | null;
  reward_amount: string | null;
  exact_match: boolean | null;
  submitted_at: string;
  champion_exact: boolean | null;
  finalized: boolean | null;
};

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDatabase()) {
    if (!shouldUseDemoData()) {
      return NextResponse.json(
        {
          error:
            "DATABASE_URL is required in production. Set ENABLE_DEMO_DATA=true only for explicit preview deployments."
        },
        { status: 503 }
      );
    }
    const rows = sortLeaderboard(demoRows, false);
    return NextResponse.json({ rows, stats: deriveLeaderboardStats(rows, false) });
  }

  const records = await dbQuery<PredictionRecord>(`
    select
      p.wallet_address,
      coalesce(p.fid, u.fid) as fid,
      u.username,
      u.display_name,
      u.pfp_url,
      p.champion_id,
      p.runner_up_id,
      p.third_place_id,
      p.fourth_place_id,
      p.entry_amount,
      p.tx_hash,
      p.attempt_number,
      p.score,
      p.eligible,
      p.reward_amount,
      p.exact_match,
      p.submitted_at,
      case
        when fr.id is not null then p.champion_id = fr.champion_id
        else null
      end as champion_exact,
      fr.id is not null as finalized
    from prediction_attempts p
    left join users u on lower(u.wallet_address) = lower(p.wallet_address)
    left join final_results fr on fr.id = 1
    where p.active = true
    order by p.submitted_at asc
  `);

  const poolRows = await dbQuery<{ total_pool: string | null }>(
    `select coalesce(sum(entry_amount), 0) as total_pool from prediction_attempts`
  );
  const totalPool = Number(poolRows[0]?.total_pool ?? 0);

  const finalized = records.some((record) => Boolean(record.finalized));
  const rows: LeaderboardRow[] = records.map((record, index) => ({
    rank: index + 1,
    walletAddress: record.wallet_address,
    fid: record.fid ? Number(record.fid) : null,
    username: record.username,
    displayName: record.display_name,
    pfpUrl: record.pfp_url,
    prediction: {
      champion: Number(record.champion_id),
      runnerUp: Number(record.runner_up_id),
      thirdPlace: Number(record.third_place_id),
      fourthPlace: Number(record.fourth_place_id)
    },
    entryAmount: Number(record.entry_amount),
    txHash: record.tx_hash,
    attemptNumber: Number(record.attempt_number),
    score: record.score === null ? null : Number(record.score),
    championExact: Boolean(record.champion_exact),
    eligible: record.eligible,
    exactMatch: record.exact_match,
    estimatedReward: record.reward_amount === null ? null : Number(record.reward_amount),
    submittedAt: record.submitted_at
  }));

  const sortedRows = sortLeaderboard(rows, finalized);
  return NextResponse.json({
    rows: sortedRows,
    stats: {
      ...deriveLeaderboardStats(sortedRows, finalized),
      totalPool,
      rewardPool: (totalPool * 75) / 100
    }
  });
}
