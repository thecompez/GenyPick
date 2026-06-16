import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  decodeEventLog,
  http,
  isAddressEqual,
  parseAbiItem,
  parseUnits,
  type Address,
  type Chain
} from "viem";
import { dbQuery, hasDatabase, shouldUseDemoData } from "@/lib/db";
import { indexedPredictionSchema } from "@/lib/validation";
import { getGenyPickAddress } from "@/lib/contracts";

const baseMainnet = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.base.org"] }
  }
} as const satisfies Chain;

const predictionSubmittedEvent = parseAbiItem(
  "event PredictionSubmitted(address indexed user,uint8 indexed attemptNumber,uint16 champion,uint16 runnerUp,uint16 thirdPlace,uint16 fourthPlace,uint256 entryAmount,uint256 timestamp)"
);

async function verifyPredictionTransaction(data: ReturnType<typeof indexedPredictionSchema.parse>) {
  const contractAddress = getGenyPickAddress();
  if (!contractAddress) {
    return { ok: false as const, status: 503, error: "NEXT_PUBLIC_GENYPICK_CONTRACT_ADDRESS is required" };
  }

  const rpcUrl = process.env.BASE_RPC_URL || process.env.NEXT_PUBLIC_BASE_RPC_URL;
  if (!rpcUrl) {
    return { ok: false as const, status: 503, error: "BASE_RPC_URL or NEXT_PUBLIC_BASE_RPC_URL is required" };
  }

  const client = createPublicClient({ chain: baseMainnet, transport: http(rpcUrl) });
  const receipt = await client.getTransactionReceipt({ hash: data.txHash as `0x${string}` });
  if (receipt.status !== "success") {
    return { ok: false as const, status: 422, error: "Transaction was not successful" };
  }

  const expectedAmount = parseUnits(String(data.entryAmount), 18);
  for (const log of receipt.logs) {
    if (!isAddressEqual(log.address, contractAddress)) continue;
    try {
      const decoded = decodeEventLog({
        abi: [predictionSubmittedEvent],
        data: log.data,
        topics: log.topics
      });
      const args = decoded.args;
      if (
        isAddressEqual(args.user as Address, data.walletAddress as Address) &&
        args.champion === data.champion &&
        args.runnerUp === data.runnerUp &&
        args.thirdPlace === data.thirdPlace &&
        args.fourthPlace === data.fourthPlace &&
        args.entryAmount === expectedAmount
      ) {
        const block = await client.getBlock({ blockNumber: receipt.blockNumber });
        return {
          ok: true as const,
          attemptNumber: Number(args.attemptNumber),
          submittedAt: new Date(Number(block.timestamp) * 1000)
        };
      }
    } catch {
      // Ignore unrelated logs emitted by the same transaction.
    }
  }

  return { ok: false as const, status: 422, error: "Transaction does not contain a matching PredictionSubmitted event" };
}

export async function POST(request: NextRequest) {
  const parsed = indexedPredictionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (!hasDatabase()) {
    if (!shouldUseDemoData()) {
      return NextResponse.json(
        { error: "DATABASE_URL is required to index production predictions" },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, indexed: false });
  }

  const duplicate = await dbQuery(`select id from prediction_attempts where tx_hash = $1 limit 1`, [data.txHash]);
  if (duplicate.length > 0) {
    return NextResponse.json({ ok: true, indexed: true, duplicate: true });
  }

  const verification = await verifyPredictionTransaction(data);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: verification.status });
  }

  await dbQuery(
    `
    insert into users (wallet_address, fid, username, display_name, pfp_url)
    values ($1, $2, $3, $4, $5)
    on conflict (wallet_address)
    do update set
      fid = excluded.fid,
      username = excluded.username,
      display_name = excluded.display_name,
      pfp_url = excluded.pfp_url
    `,
    [data.walletAddress, data.fid ?? null, data.username ?? null, data.displayName ?? null, data.pfpUrl ?? null]
  );

  await dbQuery(
    `
    update prediction_attempts
    set active = false,
        invalidated_at = $2
    where lower(wallet_address) = lower($1)
      and active = true
    `,
    [data.walletAddress, verification.submittedAt]
  );

  await dbQuery(
    `
    insert into prediction_attempts (
      wallet_address,
      fid,
      attempt_number,
      champion_id,
      runner_up_id,
      third_place_id,
      fourth_place_id,
      entry_amount,
      tx_hash,
      active,
      submitted_at
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
    on conflict (tx_hash) do nothing
    `,
    [
      data.walletAddress,
      data.fid ?? null,
      verification.attemptNumber,
      data.champion,
      data.runnerUp,
      data.thirdPlace,
      data.fourthPlace,
      data.entryAmount,
      data.txHash,
      verification.submittedAt
    ]
  );

  return NextResponse.json({ ok: true, indexed: true });
}
