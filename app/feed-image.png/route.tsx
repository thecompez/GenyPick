import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  const size = { width: 1200, height: 800 };
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#090A14",
          backgroundImage:
            "radial-gradient(circle at 12% 12%, rgba(51,214,255,0.35), transparent 32%), radial-gradient(circle at 88% 10%, rgba(139,92,246,0.34), transparent 30%), linear-gradient(135deg, #090A14 0%, #12172B 55%, #070811 100%)",
          color: "white",
          fontFamily: "Inter, Arial, sans-serif"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#33D6FF" }}>GenyPick</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.72)" }}>Base • GENY</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, lineHeight: 0.96, fontWeight: 900, maxWidth: 850 }}>
            Predict the World Cup 2026 Top 4
          </div>
          <div style={{ marginTop: 28, fontSize: 34, color: "rgba(255,255,255,0.72)" }}>
            Enter with GENY. Climb the community leaderboard.
          </div>
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          {["256 GENY card", "75% reward pool", "Farcaster Mini App"].map((item) => (
            <div
              key={item}
              style={{
                padding: "18px 24px",
                borderRadius: 28,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.08)",
                fontSize: 26,
                fontWeight: 800
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
