import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ALLOWED_ORIGINS = [
  "https://fqvyxf-a8.myshopify.com",
  "https://customized-girl-edm.myshopify.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

function getAllowedOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin") || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const token = segments[segments.length - 1];

  if (!token) {
    return new NextResponse(JSON.stringify({ error: "Token is required" }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": getAllowedOrigin(req),
        "Content-Type": "application/json",
      },
    });
  }

  const { data, error } = await supabase
    .from("customizations")
    .select("*")
    .eq("id", token)
    .single();

  if (error || !data) {
    return new NextResponse(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": getAllowedOrigin(req),
        "Content-Type": "application/json",
      },
    });
  }

  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": getAllowedOrigin(req),
      "Content-Type": "application/json",
    },
  });
}

// CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": getAllowedOrigin(req),
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
