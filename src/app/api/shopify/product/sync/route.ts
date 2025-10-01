import { syncShopifyProductToPrintful } from "@/lib/syncShopifyToPrinftul";
import { fetchVariantsByIds } from "@/utils/common";
import { NextRequest, NextResponse } from "next/server";

/**
 * @openapi
 * /api/shopify/product/sync:
 *   post:
 *     summary: Sync Shopify Product to Printful
 *     tags: ["External/Shopify/Sync"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopifyProduct:
 *                 type: array
 *               mockups:
 *                 type: array
 *                 items:
 *                   type: string
 *               edmTemplateId:
 *                 type: string
 *               availableVariantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Sync successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { shopifyProduct, mockups, edmTemplateId, availablePrintfulProductVariants } = body;

  if (!shopifyProduct || !mockups || !edmTemplateId || !availablePrintfulProductVariants) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const response = await syncShopifyProductToPrintful(
      mockups,
      edmTemplateId,
      availablePrintfulProductVariants,
      shopifyProduct.product.id
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
