import { NextResponse } from "next/server";
import { getAppUrl, getPublicAssetUrl } from "@/lib/farcaster";

export const dynamic = "force-dynamic";

function getAccountAssociation() {
  const header = process.env.FARCASTER_ACCOUNT_ASSOCIATION_HEADER?.trim();
  const payload = process.env.FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD?.trim();
  const signature = process.env.FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE?.trim();
  const values = [header, payload, signature];
  const hasAny = values.some(Boolean);
  const hasAll = values.every(Boolean);

  if (hasAll) {
    return {
      header: header as string,
      payload: payload as string,
      signature: signature as string
    };
  }

  if (hasAny || process.env.NODE_ENV === "production") {
    throw new Error(
      "FARCASTER_ACCOUNT_ASSOCIATION_HEADER, FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD, and FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE are required together"
    );
  }

  return undefined;
}

export async function GET() {
  const appUrl = getAppUrl();
  let accountAssociation: ReturnType<typeof getAccountAssociation>;
  try {
    accountAssociation = getAccountAssociation();
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid Farcaster account association configuration"
      },
      { status: 503 }
    );
  }

  const miniapp = {
    version: "1",
    name: "GenyPick",
    subtitle: "World Cup 2026 predictions",
    description:
      "Predict the final Top 4 teams in exact order, enter the community pool with GENY on Base, and climb the leaderboard.",
    tagline: "Predict Top 4 with GENY",
    iconUrl: getPublicAssetUrl("/icon.png"),
    homeUrl: appUrl,
    imageUrl: getPublicAssetUrl("/feed-image.png"),
    heroImageUrl: getPublicAssetUrl("/og-image.png"),
    ogTitle: "GenyPick World Cup 2026",
    ogDescription: "Predict the Top 4. Enter with GENY. Climb the leaderboard.",
    ogImageUrl: getPublicAssetUrl("/og-image.png"),
    screenshotUrls: [getPublicAssetUrl("/screenshot.png")],
    buttonTitle: "Enter World Cup 2026",
    splashImageUrl: getPublicAssetUrl("/splash.png"),
    splashBackgroundColor: "#01110d",
    webhookUrl: getPublicAssetUrl("/api/webhook"),
    primaryCategory: "games",
    tags: ["worldcup", "predictions", "geny", "base", "football"],
    requiredChains: ["eip155:8453"],
    requiredCapabilities: [
      "wallet.getEthereumProvider",
      "actions.composeCast",
      "actions.addMiniApp"
    ]
  };

  return NextResponse.json(
    accountAssociation ? { accountAssociation, miniapp } : { miniapp },
    {
      headers: {
        "cache-control": "public, max-age=300, stale-while-revalidate=3600"
      }
    }
  );
}
