import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// /api/mockup-task/[id]/route.ts
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY!;
const PRINTFUL_API_BASE = process.env.NEXT_PRINTFUL_BASE_API_URL;
const STORE_ID = process.env.PRINTFUL_STORE_ID!;
const POLLING_INTERVAL = 5000; // ms

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
  // add this to prevent unwanted polling
  pollPrintfulTask(key).catch(console.error);

  const { data, error } = await supabase.from("mockup_tasks").select("*").eq("task_key", key).single();

  if (error) {
    console.error("Supabase fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}

async function pollPrintfulTask(task_key: string) {
  const statusUrl = `${PRINTFUL_API_BASE}/mockup-generator/task?task_key=${task_key}`;

  while (true) {
    await new Promise((res) => setTimeout(res, POLLING_INTERVAL));

    try {
      const response = await fetch(statusUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PRINTFUL_API_KEY}`,
          "X-PF-Store-Id": STORE_ID.toString(),
        },
      });

      const data = await response.json();

      if (data.result?.status === "completed") {
        await supabase.from("mockup_results").insert({
          task_key,
          mockups: data.result.mockups,
          printfiles: data.result.printfiles,
        });

        await supabase
          .from("mockup_tasks")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("task_key", task_key);

        console.log(`Mockup task ${task_key} completed.`);
        return;
      }

      if (data.result?.status === "failed") {
        console.error(`Mockup task ${task_key} failed.`);
        await supabase.from("mockup_tasks").update({ status: "failed" }).eq("task_key", task_key);
        return;
      }

      console.log(`Task ${task_key} still in progress...`);
    } catch (err) {
      console.error(`Error polling task ${task_key}:`, err);
    }
  }
}
