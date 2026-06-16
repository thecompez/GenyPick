import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  const size = { width: 200, height: 200 };
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
          backgroundImage:
            "radial-gradient(circle at 26% 20%, rgba(51,214,255,0.36), transparent 38%), radial-gradient(circle at 76% 80%, rgba(139,92,246,0.34), transparent 36%)",
          color: "white",
          fontFamily: "Inter, Arial, sans-serif"
        }}
      >
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: 36,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            boxShadow: "0 32px 120px rgba(51,214,255,0.2)"
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 900, color: "#33D6FF" }}>G</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>GenyPick</div>
        </div>
      </div>
    ),
    size
  );
}
