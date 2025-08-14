import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { PrintfulProductResponse } from "@/types";
import { syncShopifyProductToPrintful } from "@/lib/syncShopifyToPrinftul";

/**
 * @openapi
 * /api/printful/store/products:
 *   post:
 *     summary: Create a new Printful product
 *     tags: ["External/Printful"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopifyProductID:
 *                 type: string
 *               edmTemplateId:
 *                 type: string
 *               printfulProductId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created product
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shopifyProductID, edmTemplateId, printfulProductId } = body;

    if (!shopifyProductID || !edmTemplateId || !printfulProductId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get printful product data
    const printfulProductResponse = await axios.get<PrintfulProductResponse>(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/products/${printfulProductId}`
    );
    const printfulVariants = printfulProductResponse.data.result.variants;

    // Shopify GraphQL client
    const shopify = getShopify();
    const session = await getSession();
    const client = new shopify.clients.Graphql({ session });

    // Sync directly
    const result = await syncShopifyProductToPrintful(client, edmTemplateId, printfulVariants, shopifyProductID);

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Sync failed", details: String(err) }, { status: 500 });
  }
}
