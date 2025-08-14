// /api/mockup-result.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * @openapi
 * /api/mockup-result:
 *   get:
 *     summary: Get mockup results
 *     tags: ["Internal"]
 *     parameters:
 *       - in: query
 *         name: task_key
 *         required: false
 *         description: The task key to filter mockup results
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of mockup results
 *       404:
 *         description: Not found
 */

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
