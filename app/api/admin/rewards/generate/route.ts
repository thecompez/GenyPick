import { NextRequest, NextResponse } from "next/server";
import { getAddress, parseUnits, type Address } from "viem";
import { assertAdminSecret, dbQuery, hasDatabase } from "@/lib/db";
import { buildMerkleTree, type RewardLeaf } from "@/lib/merkle";

type RewardRow = {
  wallet_address: string;
  reward_amount: string | null;
  eligible: boolean | null;
  score: string | number | null;
  exact_match: boolean | null;
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    assertAdminSecret(body?.adminSecret);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }

  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL is required for reward generation" }, { status: 503 });
  }

  const rows = await dbQuery<RewardRow>(
    `
    select wallet_address, reward_amount, eligible, score, exact_match
    from prediction_attempts
    where active = true
      and eligible = true
      and exact_match = true
      and reward_amount is not null
      and reward_amount::numeric > 0
    order by wallet_address asc
    `
  );

  if (rows.length === 0) {
    return NextResponse.json({
      root: null,
      count: 0,
      perfectWinnerCount: 0,
      rewardPerWinner: "0",
      noWinner: true,
      rewards: []
    });
  }

  const leaves: RewardLeaf[] = rows.map((row) => ({
    account: getAddress(row.wallet_address) as Address,
    amount: parseUnits(String(row.reward_amount), 18)
  }));
  const tree = buildMerkleTree(leaves);
  const rewardPerWinner = rows[0]?.reward_amount ?? "0";

  return NextResponse.json({
    root: tree.root,
    count: leaves.length,
    perfectWinnerCount: leaves.length,
    rewardPerWinner,
    noWinner: false,
    rewards: leaves.map((leaf, index) => ({
      account: leaf.account,
      amount: leaf.amount.toString(),
      amountGeny: rows[index].reward_amount,
      score: rows[index].score,
      exactMatch: rows[index].exact_match,
      proof: tree.getProof(leaf)
    }))
  });
}
