import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { syncShopifyProductToPrintful } from "@/lib/syncShopifyToPrinftul";
import { PRODUCT_CREATE } from "@/mutations/shopify/productCreate";
import { PRODUCT_PUBLISH } from "@/mutations/shopify/productPublish";
import { PRODUCT_VARIANTS_BULK_CREATE } from "@/mutations/shopify/productVariantsBulkCreate";
import { PRODUCT_VARIANTS_BULK_UPDATE } from "@/mutations/shopify/productVariantsBulkUpdate";
import { GET_PRODUCTS } from "@/queries/shopify/getProducts";
import {
  PrintfulProductResponse,
  ShopifyProductCreateResponse,
  ShopifyProductPublishResponse,
  ShopifyProductsResponse,
} from "@/types";
import { capitalize } from "@/utils/common";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

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
      collectionsToJoin: [
        "gid://shopify/Collection/490639720752", // Default "Home Page" collection
      ],
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

async function publishShopifyProduct(productID: string) {
  const shopify = getShopify();
  const session = await getSession();
  const client = new shopify.clients.Graphql({ session });

  const mutation = PRODUCT_PUBLISH;

  const variables = {
    collectionId: productID,
    publicationId: "gid://shopify/Publication/269868892464",
  };

  const response = await client.request<ShopifyProductPublishResponse>(mutation, { variables });
  return response.data?.publishablePublish;
}

/**
 * @openapi
 * /api/shopify/product:
 *   get:
 *     summary: Get a Shopify product
 *     tags: ["External/Shopify"]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         required: true
 *         description: The ID of the product to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 *   post:
 *     summary: Create a new Shopify product
 *     tags: ["External/Shopify"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *               images:
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
 *         description: Product created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

export async function GET(req: NextRequest) {
  try {
    const shopify = getShopify();
    const session = await getSession();
    const client = new shopify.clients.Graphql({ session });

    const query = GET_PRODUCTS;
    const response = await client.request<ShopifyProductsResponse>(query);
    return NextResponse.json({ products: response?.data?.products?.nodes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
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

    // Publish the product to default "Online Store" if created successfully
    if (shopifyProduct.product.id) {
      await publishShopifyProduct(shopifyProduct.product.id);
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