import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = process.env.NEXT_ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];

export function getAllowedOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin") || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || "*";
}

export const corsHeaders = (req: NextRequest) => ({
  "Access-Control-Allow-Origin": getAllowedOrigin(req),
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
});

export function handleOptions(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req),
  });
}
