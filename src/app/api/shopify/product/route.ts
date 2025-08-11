import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { PrintfulProductResponse, ShopifyProductCreateResponse } from "@/types";
import { PRODUCT_CREATE } from "@/mutations/shopify/productCreate";
import { PRODUCT_VARIANTS_BULK_CREATE } from "@/mutations/shopify/productVariantsBulkCreate";
import { PRODUCT_VARIANTS_BULK_UPDATE } from "@/mutations/shopify/productVariantsBulkUpdate";

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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { product_id, images, edmTemplateId, availableVariantIds } = body;

  // validate request body
  if (!product_id || !images || !Array.isArray(images) || !edmTemplateId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const productResponse = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/products/${product_id}`);

    console.log("Product response:", productResponse.data);

    const productData = productResponse.data as PrintfulProductResponse;

    const { product, variants } = productData.result;

    // Get only available variants based on availableVariantIds
    const availableVariants = variants.filter((v) => availableVariantIds.includes(v.id));

    const shopify = getShopify();
    const session = await getSession();
    const client = new shopify.clients.Graphql({ session });

    const { productOptions, shopifyVariants } = buildProductOptionsAndVariants(availableVariants);

    const media = images.map((url: string, idx: number) => ({
      originalSource: url,
      mediaContentType: "IMAGE",
      alt: `Mockup image ${idx + 1}`,
    }));

    const mutation = PRODUCT_CREATE;

    const variables = {
      product: {
        title: product.title,
        descriptionHtml: product.description,
        vendor: "Customized Girl EDM",
        status: "ACTIVE",
        tags: [`edm_template_id_${edmTemplateId}`],
        productOptions,
      },
      media,
    };

    const response = await client.request<ShopifyProductCreateResponse>(mutation, { variables });
    const data = response.data?.productCreate;

    if (!data) {
      return NextResponse.json({ error: "Invalid response from Shopify" }, { status: 502 });
    }

    if (data.userErrors.length > 0) {
      return NextResponse.json({ error: "Shopify error", details: data.userErrors }, { status: 400 });
    }

    // Update the first created Shopify variant with correct price
    const createdShopifyVariant = data.product.variants.edges[0].node;
    const matchingVariant = shopifyVariants[0]; // Assuming the first variant is the one we want to update

    const updatedVariant = await bulkVariantOperation(
      client,
      data.product.id,
      [{ id: createdShopifyVariant.id, price: matchingVariant?.price || "0.00" }],
      "productVariantsBulkUpdate"
    );

    if (!updatedVariant) {
      return NextResponse.json({ error: "Failed to update the first variant" }, { status: 500 });
    }

    // Create product variants if more than one
    if (shopifyVariants.length > 1)
      await bulkVariantOperation(client, data.product.id, shopifyVariants, "productVariantsBulkCreate");

    return NextResponse.json({ productCreate: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}

async function syncShopifyProductToPrintful(
  shopifyProduct: ShopifyProductCreateResponse["productCreate"]["product"],
  printfulProduct: PrintfulProductResponse["result"]["product"]
) {
  try {
    const payload = {
      sync_product: {
        external_id: shopifyProduct.id,
        name: shopifyProduct.title,
        thumbnail: shopifyProduct.media.edges[0]?.node.image?.originalSrc ?? "",
        is_ignored: false, // Set to true if you want to ignore this product
      },
      // sync_variants: shopifyProduct.variants.edges.map((edge) => ({
      //   external_id: edge.node.id,
      //   variant_id: printfulProduct.
      //   // retail_price: edge.node.price,
      //   // is_ignored: false, // Set to true if you want to ignore this variant
      //   // sku: edge.node.sku ?? "",
      //   // files: [], // Add file handling logic if needed
      //   // options: [], // Add options handling logic if needed
      //   // availability_status: "active", // Adjust based on your logic
      // })),
    };
    const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/store/products`, payload);

    return response.data;
  } catch (error) {
    console.error("Error syncing Shopify product to Printful:", error);
    throw new Error("Failed to sync product with Printful");
  }
}