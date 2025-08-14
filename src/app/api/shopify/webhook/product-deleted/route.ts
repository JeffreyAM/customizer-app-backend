import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || "";

function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false;

  const digest = crypto.createHmac("sha256", SHOPIFY_WEBHOOK_SECRET).update(rawBody, "utf8").digest("base64");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

/**
 * @openapi
 * /api/shopify/webhook/product-deleted:
 *   post:
 *     summary: Handle Shopify product deleted webhook
 *     tags: ["External/Shopify/Webhook"]
 *     responses:
 *       200:
 *         description: Successfully processed the webhook
 *       401:
 *         description: Unauthorized - Invalid signature
 *       500:
 *         description: Internal server error
 */

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");

  console.log("SHOPIFY_API_SECRET:", process.env.SHOPIFY_API_SECRET);
  console.log("Raw body string:", JSON.stringify(rawBody));
  console.log("Header from Shopify:", hmacHeader);
  console.log(
    "Generated HMAC:",
    crypto.createHmac("sha256", SHOPIFY_WEBHOOK_SECRET).update(rawBody, "utf8").digest("base64")
  );

  if (!verifyShopifyWebhook(rawBody, hmacHeader)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const productId = payload.id;

  // Call your other API
  await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/store/products/@${productId}`); 

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
