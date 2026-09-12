import { NextResponse } from "next/server";

/** GET /api/health — simple liveness check */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "life-rpg-api",
  });
}
