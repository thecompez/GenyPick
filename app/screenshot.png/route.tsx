import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  const size = { width: 1284, height: 2778 };
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          backgroundColor: "#090A14",
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(51,214,255,0.26), transparent 34%), radial-gradient(circle at 84% 20%, rgba(139,92,246,0.22), transparent 32%)",
          color: "white",
          fontFamily: "Inter, Arial, sans-serif"
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 800, color: "#33D6FF" }}>GenyPick</div>
        <div style={{ marginTop: 36, fontSize: 104, lineHeight: 0.98, fontWeight: 900 }}>
          World Cup 2026 Top 4
        </div>
        <div style={{ marginTop: 28, fontSize: 40, lineHeight: 1.35, color: "rgba(255,255,255,0.68)" }}>
          Predict the Top 4. Enter with GENY. Climb the leaderboard.
        </div>
        <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 28 }}>
          {[
            ["Total Pool", "1,756 GENY"],
            ["Reward Pool", "878 GENY"],
            ["Participants", "3"],
            ["Minimum Entry", "256 GENY"]
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                borderRadius: 48,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.07)",
                padding: 42,
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{ fontSize: 26, letterSpacing: 4, color: "rgba(255,255,255,0.42)" }}>{label}</div>
              <div style={{ marginTop: 12, fontSize: 54, fontWeight: 900 }}>{value}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 70,
            borderRadius: 56,
            border: "1px solid rgba(51,214,255,0.28)",
            background: "rgba(51,214,255,0.09)",
            padding: 48,
            fontSize: 42,
            fontWeight: 900
          }}
        >
          Enter Pool
        </div>
      </div>
    ),
    size
  );
}
