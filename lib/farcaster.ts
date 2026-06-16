import { getTeamName } from "@/lib/teams";
import type { TopFourPrediction } from "@/lib/scoring";

export type FarcasterUser = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

export type FarcasterClientContext = {
  added?: boolean;
  platformType?: "web" | "mobile";
  safeAreaInsets?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  notificationDetails?: {
    url: string;
    token: string;
  };
};

export type FarcasterMiniAppState = {
  isLoading: boolean;
  isMiniApp: boolean;
  user?: FarcasterUser;
  client?: FarcasterClientContext;
  error?: string;
};

function normalizeOrigin(value?: string): string | undefined {
  const normalized = value?.trim().replace(/\/+$/, "");
  return normalized || undefined;
}

function normalizePath(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

function deriveOriginFromAppUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return undefined;
  }
}

export function getAppOrigin(): string {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_ORIGIN) ??
    deriveOriginFromAppUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    "http://localhost:3000"
  );
}

export function getAppPath(): string {
  return normalizePath(process.env.NEXT_PUBLIC_APP_PATH);
}

export function getAppUrl(): string {
  const explicit = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (explicit) return explicit;
  return `${getAppOrigin()}${getAppPath()}`;
}

export function getPublicAssetUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getAppOrigin()}${normalizedPath}`;
}

export function buildMiniAppEmbed() {
  const appUrl = getAppUrl();
  return {
    version: "1",
    imageUrl: getPublicAssetUrl("/feed-image.png"),
    button: {
      title: "Enter Pool",
      action: {
        type: "launch_miniapp",
        name: "GenyPick",
        url: appUrl,
        splashImageUrl: getPublicAssetUrl("/splash.png"),
        splashBackgroundColor: "#090A14"
      }
    }
  };
}

export function buildShareText(prediction: TopFourPrediction, entryAmount: string): string {
  return [
    "I entered GenyPick for World Cup 2026 🏆",
    "My Top 4:",
    `1st: ${getTeamName(prediction.champion)}`,
    `2nd: ${getTeamName(prediction.runnerUp)}`,
    `3rd: ${getTeamName(prediction.thirdPlace)}`,
    `4th: ${getTeamName(prediction.fourthPlace)}`,
    `Entered with ${entryAmount} GENY.`,
    "Powered by @genyleap."
  ].join("\n");
}
