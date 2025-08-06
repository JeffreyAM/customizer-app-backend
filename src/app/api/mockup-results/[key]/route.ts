import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// /api/mockup-results/[id]/route.ts
type RouteContext = { params: Promise<{ key: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const { key } = await context.params;

  if (!key) {
    return NextResponse.json({ error: "Task key is required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("mockup_results").select("*").eq("task_key", key).single();

  if (error) {
    console.error("Supabase fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch mockup result" }, { status: 500 });
  }

  return NextResponse.json({ mockup_result: data });
}
