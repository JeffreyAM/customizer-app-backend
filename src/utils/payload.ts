import { NextRequest, NextResponse } from "next/server";

export async function checkBody(req: NextRequest){
  try {
    const body = await req.json();
    return body;
  } catch {
    return NextResponse.json(
      { error: "Request body is required" },
      { status: 400 }
    );
  }
}