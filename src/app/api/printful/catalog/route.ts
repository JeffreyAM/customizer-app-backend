import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const PRINTFUL_URL = "https://api.printful.com/v2/catalog-products";
const ALLOWED_ORIGINS = [
  "https://customized-girl-edm.myshopify.com",
  "https://fqvyxf-a8.myshopify.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

function getAllowedOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin") || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

export async function GET(req: NextRequest) {
  const apiKey =
    process.env.PRINTFUL_API_KEY || "xyD86qYWF2lZKRUdbOCfelfw8V4OX3Nd0zYnIipf";
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  try {
    const res = await axios.get(PRINTFUL_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      validateStatus: () => true,
    });

    return NextResponse.json(res.data, {
      status: res.status,
      headers: {
        "Access-Control-Allow-Origin": getAllowedOrigin(req),
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch from Printful",
        details: err.message,
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": getAllowedOrigin(req),
          "Content-Type": "application/json",
        },
      }
    );
  }
}
