import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const token = segments[segments.length - 1];

  if (!token) {
    return new NextResponse(JSON.stringify({ error: "Token is required" }), {
      status: 400,
    });
  }

  const { data, error } = await supabase.from("customizations").select("*").eq("id", token).single();

  if (error || !data) {
    return new NextResponse(JSON.stringify({ error: "Not found" }), {
      status: 404,
    });
  }

  return new NextResponse(JSON.stringify(data), {
    status: 200,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { color, message, font, shopify_product_id, token } = body;

    if (!color || !message || !font || !shopify_product_id) {
      return new NextResponse(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
      });
    }

    let result;
    if (token) {
      // Update existing customization
      result = await supabase
        .from("customizations")
        .update({ color, message, font, shopify_product_id })
        .eq("id", token)
        .select()
        .single();
    } else {
      // Insert new customization if no token is provided
      result = await supabase
        .from("customizations")
        .insert([{ color, message, font, shopify_product_id }])
        .select()
        .single();
    }

    if (result.error) {
      return new NextResponse(JSON.stringify({ error: result.error.message }), {
        status: 500,
      });
    }

    return new NextResponse(JSON.stringify({ token: result.data.id }), {
      status: 200,
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}
