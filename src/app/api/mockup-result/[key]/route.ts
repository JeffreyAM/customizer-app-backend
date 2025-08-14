import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// /api/mockup-result/[id]/route.ts
type RouteContext = { params: Promise<{ key: string }> };

/**
 * @openapi
 * /api/mockup-result/{key}:
 *   get:
 *     summary: Get mockup result by key
 *     tags: ["Internal"]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         description: The key of the mockup result
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The mockup result
 *       404:
 *         description: Not found
 */

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
