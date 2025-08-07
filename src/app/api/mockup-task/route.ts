// /api/mockup-task.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const template_id = searchParams.get("template_id");
  const status = searchParams.get("status");

  const query = supabase
    .from("mockup_tasks")
    .select("id, task_key, created_at")
    .order("created_at", { ascending: false });

  if (template_id) {
    query.eq("template_id", template_id);
  }

  if (status) {
    query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }

  return NextResponse.json({ tasks: data });
}
