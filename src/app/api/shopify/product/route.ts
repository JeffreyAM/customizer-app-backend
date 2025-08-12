import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { supabase } from "@/lib/supabase";
import { PRODUCT_CREATE } from "@/mutations/shopify/productCreate";
import { PRODUCT_VARIANTS_BULK_CREATE } from "@/mutations/shopify/productVariantsBulkCreate";
import { PRODUCT_VARIANTS_BULK_UPDATE } from "@/mutations/shopify/productVariantsBulkUpdate";
import { GET_PRODUCT } from "@/queries/shopify/getProduct";
import {
  PrintfulProductResponse,
  PrintfulProductSyncResponse,
  ShopifyProductCreateResponse,
  ShopifyProductResponse,
} from "@/types";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// capitalizes a string
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// split array to chunks
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function buildProductOptionsAndVariants(variants: any[]) {
  const sizeSet = new Set<string>();
  const colorSet = new Set<string>();

  variants.forEach((v) => {
    if (v.size) sizeSet.add(capitalize(v.size));
    if (v.color) colorSet.add(capitalize(v.color));
  });

  const productOptions = [];
  if (sizeSet.size > 0) {
    productOptions.push({
      name: "Size",
      position: 1,
      values: Array.from(sizeSet).map((size) => ({ name: size })),
    });
  }
  if (colorSet.size > 0) {
    productOptions.push({
      name: "Color",
      position: 2,
      values: Array.from(colorSet).map((color) => ({ name: color })),
    });
  }

  const shopifyVariants = variants.map((v) => {
    const optionValues = [];

    if (sizeSet.size > 0) {
      optionValues.push({
        optionName: "Size",
        name: capitalize(v.size || "Default"),
      });
    }
    if (colorSet.size > 0) {
      optionValues.push({
        optionName: "Color",
        name: capitalize(v.color || "Default"),
      });
    }

    return {
      optionValues,
      price: String(v.price || "0.00"),
      barcode: v.id.toString(),
      metafields: [
        {
          key: `printful_variant_id`,
          type: "single_line_text_field",
          value: `${v.id}`,
        },
      ],
    };
  });

  return { productOptions, shopifyVariants };
}

// Update product variants in Shopify
async function bulkVariantOperation(
  client: InstanceType<ReturnType<typeof getShopify>["clients"]["Graphql"]>,
  productId: string,
  variants: any[],
  operation: "productVariantsBulkCreate" | "productVariantsBulkUpdate",
  chunkSize = 10
) {
  if (!productId || !variants?.length) return [];

  const mutation =
    operation === "productVariantsBulkCreate" ? PRODUCT_VARIANTS_BULK_CREATE : PRODUCT_VARIANTS_BULK_UPDATE;

  const chunks = chunkArray(variants, chunkSize);
  const results = [];

  for (const chunk of chunks) {
    const res = await client.request(mutation, { variables: { productId, variants: chunk } });
    const data = res.data?.[operation];

    if (data?.userErrors?.length) {
      console.warn(`${operation} errors:`, data.userErrors);
    }
    if (data?.productVariants) {
      results.push(...data.productVariants);
    }
  }

  return results;
}

async function createShopifyProduct(
  client: InstanceType<ReturnType<typeof getShopify>["clients"]["Graphql"]>,
  productOptions: Array<Record<string, any>>,
  images: string[],
  edmTemplateId: string,
  productData: PrintfulProductResponse["result"]["product"]
) {
  const media = images.map((url: string, idx: number) => ({
    originalSource: url,
    mediaContentType: "IMAGE",
    alt: `Mockup image ${idx + 1}`,
  }));

  const mutation = PRODUCT_CREATE;

  const variables = {
    product: {
      title: productData.title,
      descriptionHtml: productData.description,
      vendor: "Customized Girl EDM",
      status: "ACTIVE",
      tags: [`edm_template_id_${edmTemplateId}`],
      productOptions,
    },
    media,
  };

  const response = await client.request<ShopifyProductCreateResponse>(mutation, { variables });
  return response.data?.productCreate;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { product_id, images, edmTemplateId, availableVariantIds } = body;

  // validate request body
  if (!product_id || !images || !Array.isArray(images) || !edmTemplateId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const printfulProductResponse = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/products/${product_id}`
    );

    const printfulProductData = printfulProductResponse.data as PrintfulProductResponse;

    const { product: printfulProduct, variants: printfulProductVariants } = printfulProductData.result;

    // Get only available variants based on availableVariantIds
    const availablePrintfulProductVariants = printfulProductVariants.filter((v) => availableVariantIds.includes(v.id));

    const shopify = getShopify();
    const session = await getSession();
    const client = new shopify.clients.Graphql({ session });

    const { productOptions, shopifyVariants } = buildProductOptionsAndVariants(availablePrintfulProductVariants);

    const shopifyProduct = await createShopifyProduct(client, productOptions, images, edmTemplateId, printfulProduct);

    if (!shopifyProduct) {
      return NextResponse.json({ error: "Invalid response from Shopify" }, { status: 502 });
    }

    if (shopifyProduct.userErrors.length > 0) {
      return NextResponse.json({ error: "Shopify error", details: shopifyProduct.userErrors }, { status: 400 });
    }

    // Update the first created Shopify variant with correct price
    const createdShopifyVariant = shopifyProduct.product.variants.nodes[0];
    const matchingVariant = shopifyVariants[0]; // Assuming the first variant is the one we want to update

    const updatedVariant = await bulkVariantOperation(
      client,
      shopifyProduct.product.id,
      [{ ...matchingVariant, id: createdShopifyVariant.id }], // Update the variant ID
      "productVariantsBulkUpdate"
    );

    if (!updatedVariant) {
      return NextResponse.json({ error: "Failed to update the first variant" }, { status: 500 });
    }

    // Create product variants if more than one
    if (shopifyVariants.length > 1) {
      const variantsToCreate = shopifyVariants.slice(1); // Skip the first variant as it's already created
      await bulkVariantOperation(client, shopifyProduct.product.id, variantsToCreate, "productVariantsBulkCreate");
    }

    // Run printful product sync in background
    syncShopifyProductToPrintful(
      client,
      edmTemplateId,
      availablePrintfulProductVariants,
      shopifyProduct.product.id
    ).catch((err) => console.error("Background sync error:", err));

    return NextResponse.json({ productCreate: shopifyProduct }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}

async function syncShopifyProductToPrintful(
  client: InstanceType<ReturnType<typeof getShopify>["clients"]["Graphql"]>,
  edmTemplateId: string,
  printfulVariants: PrintfulProductResponse["result"]["variants"],
  shopifyProductID: string
) {
  try {
    const query = GET_PRODUCT;
    const shopifyProductResponse = await client.request<ShopifyProductResponse>(query, {
      variables: { ownerId: shopifyProductID },
    });

    if (!shopifyProductResponse.data) {
      throw new Error("Shopify product response data is undefined");
    }

    const shopifyProduct = shopifyProductResponse.data.product;

    const { data: templates, error: templatesError } = await supabase
      .from("templates")
      .select("*")
      .eq("template_id", edmTemplateId)
      .limit(1);

    if (templatesError) {
      throw new Error("Failed to fetch templates: " + JSON.stringify(templatesError));
    }

    const { data: mockupTasks, error: mockupTasksError } = await supabase
      .from("mockup_tasks")
      .select("*")
      .eq("template_id", templates?.[0]?.id)
      .limit(1);

    if (mockupTasksError) {
      throw new Error("Failed to fetch mockup results: " + JSON.stringify(mockupTasksError));
    }

    const { data: mockupResults, error: mockupResultsError } = await supabase
      .from("mockup_results")
      .select("*")
      .eq("task_key", mockupTasks?.[0]?.task_key)
      .limit(1);

    if (mockupResultsError) {
      throw new Error("Failed to fetch mockup results: " + JSON.stringify(mockupResultsError));
    }

    const payload = buildSyncPayload(shopifyProduct, printfulVariants, edmTemplateId, mockupResults);

    const response = await axios.post<PrintfulProductSyncResponse>(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/store/products`,
      payload
    );

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

function getPrintfulVariantIdFromShopifyVariantMetaFields(
  printfulVariants: PrintfulProductResponse["result"]["variants"],
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
  mockupResults?: Array<{ printfiles: Array<{ url: string; variant_ids: number[] }> }>
) {
  if (!variantId || !mockupResults?.[0]?.printfiles) return [];
  return mockupResults[0].printfiles
    .filter((file) => file.variant_ids.includes(variantId))
    .map((file) => ({ url: file.url }));
}

function mapSyncVariant(
  shopifyVariant: ShopifyProductResponse["product"]["variants"]["nodes"][number],
  printfulVariants: PrintfulProductResponse["result"]["variants"],
  mockupResults?: Array<{ printfiles: Array<{ url: string; variant_ids: number[] }> }>
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
  printfulVariants: PrintfulProductResponse["result"]["variants"],
  edmTemplateId: string,
  mockupResults?: Array<{ printfiles: Array<{ url: string; variant_ids: number[] }> }>
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
