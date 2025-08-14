import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// /api/mockup-task/[id]/route.ts
type RouteContext = { params: Promise<{ key: string }> };

/**
 * @openapi
 * /api/mockup-task/{key}:
 *   get:
 *     summary: Get mockup task by key
 *     tags: ["Internal"]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         description: The key of the mockup task
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The mockup task
 *       404:
 *         description: Not found
 */

export async function GET(req: NextRequest, context: RouteContext) {
  const { key } = await context.params;

  if (!key) {
    return NextResponse.json({ error: "Task key is required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("mockup_tasks").select("*").eq("task_key", key).single();

  if (error) {
    console.error("Supabase fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}
