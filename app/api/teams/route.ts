import { NextResponse } from "next/server";
import { WORLD_CUP_2026_TEAMS } from "@/lib/teams";

export async function GET() {
  return NextResponse.json({ teams: WORLD_CUP_2026_TEAMS });
}
