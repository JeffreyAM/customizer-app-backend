import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY!;
const STORE_ID = 16414489;

const POLLING_INTERVAL = 5000; // ms

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      catalog_product_id,
      variant_ids,
      mockup_style_ids,
      files,
      format = "jpg",
      width = 1000,
      template_id,
      product_template_id,
    } = body;

    // Validate requirements
    if (
      !catalog_product_id ||
      isNaN(Number(catalog_product_id)) ||
      !Array.isArray(variant_ids) ||
      variant_ids.length === 0 ||
      !Array.isArray(files) ||
      files.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Missing or invalid parameters: product_id, variant_ids, or files",
        },
        { status: 400 }
      );
    }

    //Printful API endpoint for mockup generation
    const createUrl = `https://api.printful.com/mockup-generator/create-task/${catalog_product_id}`;

    const payload = {
      variant_ids,
      files,
      format,
      width,
      mockup_style_ids,
      product_template_id: parseInt(product_template_id, 10) || undefined,
    };

    const headers: HeadersInit = {
      Authorization: `Bearer ${PRINTFUL_API_KEY}`,
      "Content-Type": "application/json",
      "X-PF-Store-Id": STORE_ID.toString(),
    };

    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.log("Printful API error:", createData);

      return NextResponse.json(
        { error: createData.error?.message || "Printful API error" },
        { status: createResponse.status }
      );
    }

    const task_key = createData.result?.task_key;

    const { data: insertedMockupTaskData, error: insertError } = await supabase
      .from("mockup_tasks")
      .insert({ task_key, template_id, status: "pending" })
      .select("*")
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      throw insertError;
    }

    if (!insertedMockupTaskData || !insertedMockupTaskData.id) {
      throw new Error("Failed to insert mockup task");
    }

    // Poll in the background
    pollPrintfulTask(task_key).catch(console.error);

    return NextResponse.json({ task: insertedMockupTaskData }, { status: 201 });
  } catch (error: any) {
    console.error("Mockup API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

async function pollPrintfulTask(task_key: string) {
  const statusUrl = `https://api.printful.com/mockup-generator/task?task_key=${task_key}`;

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
