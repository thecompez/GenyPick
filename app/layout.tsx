import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/styles/globals.css";
import { buildMiniAppEmbed, getAppOrigin, getAppUrl } from "@/lib/farcaster";

const appOrigin = getAppOrigin();
const appUrl = getAppUrl();
const miniAppEmbed = buildMiniAppEmbed();

export const metadata: Metadata = {
  metadataBase: new URL(appOrigin),
  title: "GenyPick — World Cup 2026",
  description: "Predict the Top 4. Enter with GENY. Climb the leaderboard.",
  applicationName: "GenyPick",
  openGraph: {
    title: "GenyPick — World Cup 2026",
    description: "Predict the Top 4. Enter with GENY. Climb the leaderboard.",
    url: appUrl,
    siteName: "GenyPick",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "GenyPick — World Cup 2026",
    description: "Predict the Top 4. Enter with GENY. Climb the leaderboard.",
    images: ["/og-image.png"]
  },
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed)
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#090A14"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
