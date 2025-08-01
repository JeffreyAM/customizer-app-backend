import { NextRequest, NextResponse } from "next/server";

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY!;

export async function GET() {
  const res = await fetch("https://api.printful.com/stores", {
    headers: {
      Authorization: `Bearer ${PRINTFUL_API_KEY}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message || "Failed to fetch stores" },
      { status: res.status }
    );
  }
  return NextResponse.json({ stores: data.result });
}
