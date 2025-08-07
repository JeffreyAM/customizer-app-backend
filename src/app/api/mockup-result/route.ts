// /api/mockup-result.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const task_key = searchParams.get("task_key");

  const query = supabase
    .from("mockup_results")
    .select("id, task_key, mockups, printfiles, created_at")
    .order("created_at", { ascending: false });

  if (task_key) {
    query.eq("task_key", task_key);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch mockup results" }, { status: 500 });
  }

  return NextResponse.json({ mockup_results: data });
}
