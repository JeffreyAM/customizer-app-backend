import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";

const SHOPIFY_SECRET = process.env.SHOPIFY_API_SECRET || "";

function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false;

  const digest = crypto.createHmac("sha256", SHOPIFY_SECRET).update(rawBody, "utf8").digest("base64");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");

  if (!verifyShopifyWebhook(rawBody, hmacHeader)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const productId = payload.id;

  // Call your other API
  try {
    const syncProductDeleted = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/store/products/@${productId}`
    );

    if (!syncProductDeleted.data) throw new Error(`Internal API returned ${syncProductDeleted.status}`);
  } catch (err) {
    console.error("Failed to call internal API", err);
    return NextResponse.json({ error: "Internal API call failed" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
