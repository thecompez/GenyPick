import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  const size = { width: 1024, height: 1024 };
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#090A14",
          color: "white",
          fontFamily: "Inter, Arial, sans-serif"
        }}
      >
        <div
          style={{
            width: 720,
            height: 720,
            borderRadius: 190,
            border: "2px solid rgba(255,255,255,0.14)",
            backgroundColor: "#101322",
            backgroundImage:
              "radial-gradient(circle at 30% 24%, rgba(51,214,255,0.55), transparent 34%), radial-gradient(circle at 72% 75%, rgba(139,92,246,0.46), transparent 38%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column"
          }}
        >
          <div style={{ fontSize: 420, fontWeight: 900, lineHeight: 0.88, color: "#33D6FF" }}>G</div>
          <div style={{ fontSize: 104, fontWeight: 900 }}>GENY</div>
        </div>
      </div>
    ),
    size
  );
}
