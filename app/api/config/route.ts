import { NextResponse } from "next/server";
import {
  BASE_CHAIN_ID,
  CARD_PRICE_GENY,
  GENY_DECIMALS,
  GENY_TOKEN_ADDRESS,
  MAX_ATTEMPTS,
  getGenyPickAddress
} from "@/lib/contracts";
import { getAppUrl } from "@/lib/farcaster";

export async function GET() {
  return NextResponse.json({
    appName: "GenyPick",
    displayTitle: "GenyPick — World Cup 2026",
    tagline: "Predict the Top 4. Enter with GENY. Climb the leaderboard.",
    appUrl: getAppUrl(),
    chain: {
      id: BASE_CHAIN_ID,
      name: "Base"
    },
    token: {
      name: "Genyleap",
      symbol: "GENY",
      address: GENY_TOKEN_ADDRESS,
      decimals: GENY_DECIMALS,
      totalSupply: "256000000"
    },
    contractAddress: getGenyPickAddress() ?? null,
    cardPriceGeny: CARD_PRICE_GENY,
    maxAttempts: MAX_ATTEMPTS,
    rewardPoolBps: 7500,
    treasuryPoolBps: 2500,
    submissionDeadline: process.env.NEXT_PUBLIC_SUBMISSION_DEADLINE ?? null,
    links: {
      website: "https://genyleap.com",
      x: "https://x.com/genyleap",
      telegram: "https://t.me/genyleap",
      discord: "https://discord.gg/genyleap",
      support: "https://genyleap.com/support",
      email: "support@genyleap.com"
    }
  });
}
