import { GET_PRODUCT } from "@/queries/shopify/getProduct";
import { PrintfulProductCatalogVariant, PrintfulProductResponse, PrintfulProductSyncResponse, ShopifyProductResponse } from "@/types";
import axios from "axios";
import { getShopify } from "./shopify";
import { supabase } from "./supabase";
import { GraphQLClientResponse } from "@shopify/shopify-api";

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY!;
const PRINTFUL_API_BASE = process.env.NEXT_PRINTFUL_BASE_API_URL;
const STORE_ID = process.env.PRINTFUL_STORE_ID!;

export async function syncShopifyProductToPrintful(
  client: InstanceType<ReturnType<typeof getShopify>["clients"]["Graphql"]>,
  edmTemplateId: string,
  // printfulVariants: PrintfulProductResponse["result"]["variants"],
  printfulVariants: PrintfulProductCatalogVariant[],
  shopifyProductID: string
) {
  // delay for 1 second
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const shopifyProductResponse = await client.request<ShopifyProductResponse>(GET_PRODUCT, {
      variables: { ownerId: shopifyProductID },
    });

    if (!shopifyProductResponse.data?.product) {
      throw new Error("Shopify product response data is undefined");
    }
    console.log("joylyn")
    console.log(shopifyProductResponse)
    const shopifyProduct = shopifyProductResponse.data.product;
    shopifyProduct.variants.nodes = await fetchAllVariants(client, shopifyProductID); // Fetch all variants

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

    const { data: mockupResults, error: mockupResultsError } = await supabase
      .from("mockup_results")
      .select("*")
      .eq("task_key", mockupTasks?.[0]?.task_key)
      .order("id", { ascending: false })
      .limit(1);

    if (mockupResultsError) {
      throw new Error("Failed to fetch mockup results: " + JSON.stringify(mockupResultsError));
    }

    const payload = buildSyncPayload(shopifyProduct, printfulVariants, edmTemplateId, mockupResults);

    console.log("Payload request:", JSON.stringify(payload, null, 2));

    const response = await axios.post<PrintfulProductSyncResponse>(`${PRINTFUL_API_BASE}/store/products`, payload, {
      headers: {
        Authorization: `Bearer ${PRINTFUL_API_KEY}`,
        "Content-Type": "application/json",
        "X-PF-Store-Id": STORE_ID.toString(),
      },
    });

    if (response.status !== 200) {
      throw new Error("Failed to sync product with Printful: " + JSON.stringify(response.data));
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error("Failed to sync product with Printful: " + JSON.stringify(error.response?.data));
    } else {
      throw new Error("Unexpected error: " + JSON.stringify(error));
    }
  }
}

async function fetchAllVariants(
  client: InstanceType<ReturnType<typeof getShopify>["clients"]["Graphql"]>,
  shopifyProductID: string
) {
  let allVariants: any[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const shopifyProductResponse: GraphQLClientResponse<ShopifyProductResponse> =
      await client.request<ShopifyProductResponse>(GET_PRODUCT, {
        variables: { ownerId: shopifyProductID, variantsAfter: cursor },
      });

    if (!shopifyProductResponse.data?.product) {
      throw new Error("Shopify product response data is undefined");
    }

    const variants: ShopifyProductResponse["product"]["variants"] = shopifyProductResponse.data.product.variants;
    allVariants.push(...variants.nodes);

    hasNextPage = variants.pageInfo.hasNextPage;
    cursor = variants.pageInfo.endCursor;
  }

  return allVariants;
}

function getPrintfulVariantIdFromShopifyVariantMetaFields(
  // printfulVariants: PrintfulProductResponse["result"]["variants"],
  printfulVariants: PrintfulProductCatalogVariant[],
  metafields: ShopifyProductResponse["product"]["variants"]["nodes"][number]["metafields"]["nodes"]
): number | null {
  for (const variant of printfulVariants) {
    const metafield = metafields.find((m) => m.key === "printful_variant_id" && m.value === variant.id.toString());
    if (metafield) {
      return variant.id;
    }
  }
  return null;
}

function getPrintFilesForVariant(
  variantId: number | null,
  mockupResults?: Array<{
    printfiles: Array<{ url: string; placement: string; variant_ids: number[] }>;
  }>
) {
  if (!variantId || !mockupResults?.[0]?.printfiles) return [];

  return mockupResults[0].printfiles
    .filter((file) => file.variant_ids.includes(variantId))
    .map((file) => ({
      type: file.placement,
      url: file.url,
    }));
}

function mapSyncVariant(
  shopifyVariant: ShopifyProductResponse["product"]["variants"]["nodes"][number],
  // printfulVariants: PrintfulProductResponse["result"]["variants"],
  printfulVariants: PrintfulProductCatalogVariant[],
  mockupResults?: Array<{
    printfiles: Array<{ url: string; placement: string; variant_ids: number[] }>;
  }>
) {
  const variantId = getPrintfulVariantIdFromShopifyVariantMetaFields(printfulVariants, shopifyVariant.metafields.nodes);

  return {
    external_id: shopifyVariant.id,
    variant_id: variantId,
    retail_price: shopifyVariant.price,
    is_ignored: false,
    sku: shopifyVariant.sku || "",
    files: getPrintFilesForVariant(variantId, mockupResults),
    options: shopifyVariant.selectedOptions.map((option) => ({
      id: option.name,
      value: option.value,
    })),
    availability_status: "active",
  };
}

function buildSyncPayload(
  shopifyProduct: ShopifyProductResponse["product"],
  printfulVariants: PrintfulProductCatalogVariant[],
  // printfulVariants: PrintfulProductResponse["result"]["variants"],
  edmTemplateId: string,
  mockupResults?: Array<{
    printfiles: Array<{ url: string; placement: string; variant_ids: number[] }>;
  }>
) {
  return {
    sync_product: {
      external_id: shopifyProduct.id,
      name: shopifyProduct.title,
      thumbnail: shopifyProduct.media?.nodes?.[0]?.preview?.image?.url || "",
      is_ignored: false,
      tags: [`edm_template_id_${edmTemplateId}`],
    },
    sync_variants: shopifyProduct.variants.nodes.map((variant) =>
      mapSyncVariant(variant, printfulVariants, mockupResults)
    ),
  };
}
