import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY!;
const STORE_ID = 16414489;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      catalog_product_id,
      variant_ids,
      mockup_style_ids,
      files,
      format = "png",
      width = 1000,
    } = body;

    // Validate input
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
          error:
            "Missing or invalid parameters: product_id, variant_ids, or files",
        },
        { status: 400 }
      );
    }

    // ✅ Use the correct Printful API endpoint for mockup generation
    const apiUrl = `https://api.printful.com/mockup-generator/create-task/${catalog_product_id}`;

    const payload = {
      variant_ids,
      files,
      format,
      width,
      mockup_style_ids, // optional
    };

    const headers: HeadersInit = {
      Authorization: `Bearer ${PRINTFUL_API_KEY}`,
      "Content-Type": "application/json",
      "X-PF-Store-Id": STORE_ID.toString(),
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Printful API error" },
        { status: response.status }
      );
    }

    const task_key = data.result?.task_key;

    // Store in Supabase
    const { error: dbError } = await supabase
      .from("mockup_tasks")
      .insert([{ task_key }]);

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to store task" },
        { status: 500 }
      );
    }

    return NextResponse.json({ task_key });
  } catch (error: any) {
    console.error("Mockup API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
