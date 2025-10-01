import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { MockupResults, PrintfulProductCatalogVariant, PrintfulProductResponse } from "@/types";
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
    // const printfulProductResponse = await axios.get<PrintfulProductCatalogVariant>(
    const printfulProductResponse = await axios.get(
      // `${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/products/${printfulProductId}`
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/v2/catalog-products/${printfulProductId}/catalog-variants`
    );
    const printfulVariants = printfulProductResponse.data.data as PrintfulProductCatalogVariant[];

    // Shopify GraphQL client
    const shopify = getShopify();
    const session = await getSession();
    const client = new shopify.clients.Graphql({ session });

    const { data: templates, error: templatesError } = await supabase
      .from("templates")
      .select("*")
      .eq("template_id", edmTemplateId)
      .order("id", { ascending: false })
      .limit(1);

    if (templatesError) {
      throw new Error("Failed to fetch templates: " + JSON.stringify(templatesError));
    }

    const { data: mockupTasks, error: mockupTasksError } = await supabase
      .from("mockup_tasks")
      .select("*")
      .eq("template_id", templates?.[0]?.id)
      .order("id", { ascending: false })
      .limit(1);

    if (mockupTasksError) {
      throw new Error("Failed to fetch mockup results: " + JSON.stringify(mockupTasksError));
    }

    const { data: latestMockup, error: mockupResultsError } = await supabase
      .from("mockup_results")
      .select("*")
      .eq("task_key", mockupTasks?.[0]?.task_key)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(); // returns MockupResults | null

    if (mockupResultsError) {
      throw new Error("Failed to fetch mockup results: " + JSON.stringify(mockupResultsError));
    }

    if (!latestMockup) {
      throw new Error("No mockup results found for task_key: " + mockupTasks?.[0]?.task_key);
    }

    const mockups: MockupResults = latestMockup;

    const result = await syncShopifyProductToPrintful(
      mockups,
      edmTemplateId,
      printfulVariants,
      shopifyProductID
    );


    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Sync failed", details: String(err) }, { status: 500 });
  }
}
