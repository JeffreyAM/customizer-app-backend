import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { syncShopifyProductToPrintful } from "@/lib/syncShopifyToPrinftul";
import { PRODUCT_CREATE } from "@/mutations/shopify/productCreate";
import { PRODUCT_PUBLISH } from "@/mutations/shopify/productPublish";
import { PRODUCT_VARIANTS_BULK_CREATE } from "@/mutations/shopify/productVariantsBulkCreate";
import { PRODUCT_VARIANTS_BULK_UPDATE } from "@/mutations/shopify/productVariantsBulkUpdate";
import { GET_CUSTOMER_PRODUCTS } from "@/queries/shopify/getCustomerProducts";
import { GET_LOCATION } from "@/queries/shopify/getLocation";
import { GET_PRODUCT } from "@/queries/shopify/getProduct";
import { GET_PRODUCTS } from "@/queries/shopify/getProducts";
import {
  PrintfulProductCatalogResponse,
  PrintfulProductCatalogVariant,
  PrintfulProductResponse,
  ShopifyProductCreateResponse,
  ShopifyProductPublishResponse,
  ShopifyProductsResponse,
} from "@/types";
import { capitalize, delay } from "@/utils/common";
import { selPrice } from "@/utils/sellingPrice";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// split array to chunks
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function buildProductOptionsAndVariants(variants: any[],edmTemplateId: any) {
  const sizeSet = new Set<string>();
  const colorSet = new Set<string>();

  variants.forEach((v) => {
    if (v.size) sizeSet.add(capitalize(v.size));
    if (v.color) colorSet.add(capitalize(v.color));
  });

  const productOptions: any[] = [];
  let position = 1;
  if (sizeSet.size > 0) {
    productOptions.push({
      name: "Size",
      position: position++,
      values: Array.from(sizeSet).map((size) => ({ name: size })),
    });
  }
  if (colorSet.size > 0) {
    productOptions.push({
      name: "Color",
      position: position++,
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
    const sku = `${edmTemplateId}_${v.catalog_product_id}_${v.color || "default"}_${v.size || "default"}`.toLowerCase();

    return {
      optionValues,
      price: String(selPrice(v.techniques[0].price) || "0.00"),
      barcode: v.id.toString(),
      metafields: [
        {
          key: `printful_variant_id`,
          type: "single_line_text_field",
          value: `${v.id}`,
        },
      ],
      inventoryItem: {
        sku: sku,
        tracked: true,
      },   
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
  // productData: PrintfulProductResponse["result"]["product"]
  productData: PrintfulProductCatalogResponse,
  customerId: string
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
      title: productData.data.name,
      // title: productData.title,
      descriptionHtml: productData.data.description,
      vendor: "Customized Girl EDM",
      status: "ACTIVE",
      tags: [`edm_template_id_${edmTemplateId}`,`customer_id-${customerId}`],
      handle: edmTemplateId.toString(),
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
 *         name:
 *           - product_id
 *           - customer_id
 *           - direction: [next, prev]
 *           - endCursor
 *           - startCursor
 *         required: false
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
    const productId = req.nextUrl.searchParams.get("product_id");
    const customerId = req.nextUrl.searchParams.get("customer_id");
    const after = req.nextUrl.searchParams.get("endCursor");
    const before = req.nextUrl.searchParams.get("startCursor");
    let direction = req.nextUrl.searchParams.get("direction");

    const shopify = getShopify();
    const session = await getSession();
    const client = new shopify.clients.Graphql({ session });

    let query;
    let variables = {};
    let response;

    const PAGE_SIZE = 10;
    if(!direction){
      direction = 'next';
    }

    if (customerId) {
      query = GET_CUSTOMER_PRODUCTS;
      variables = { 
        query: `tag:'${customerId}'`,
        first: direction === 'next' ? PAGE_SIZE : null,
        after: direction === 'next' ? after : null,
        last: direction === 'prev' ? PAGE_SIZE : null,
        before: direction === 'prev' ? before : null,
      };
      response = await client.request(query, {variables});
      return NextResponse.json({ products: response?.data?.products }, { status: 200 });

    } else if (productId) {
      query = GET_PRODUCT;
      variables = { ownerId: `gid://shopify/Product/${productId}` };
      response = await client.request(query, {variables});
      return NextResponse.json({ product: response?.data?.product }, { status: 200 });

    } else {
      query = GET_PRODUCTS;
      response = await client.request(query,
        {variables: {
          first: direction === 'next' ? PAGE_SIZE : null,
          after: direction === 'next' ? after : null,
          last: direction === 'prev' ? PAGE_SIZE : null,
          before: direction === 'prev' ? before : null,
        }}
      );
      return NextResponse.json({ products: response?.data?.products }, { status: 200 });
    }

  } catch (error) {
    console.error("Error fetching product(s):", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { product_id, images, edmTemplateId, availableVariantIds, customerId } = body;
  // const customerId = '9095495057712'
  // validate request body
  if (!product_id || !images || !Array.isArray(images) || !edmTemplateId || !customerId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const printfulProductResponse = await axios.get(
      `${NEXT_PUBLIC_BASE_URL}/api/printful/v2/catalog-products/${product_id}`
    );

    const printfulProductData = printfulProductResponse.data as PrintfulProductCatalogResponse;
    // const { product: printfulProduct, variants: printfulProductVariants } = printfulProductData.result;

    // Get only available variants based on availableVariantIds
    // const availablePrintfulProductVariants = printfulProductVariants.filter((v) => availableVariantIds.includes(v.id));
    const availablePrintfulProductVariants = await fetchVariantsByIds(availableVariantIds);
    const shopify = getShopify();
    const session = await getSession();
    const client = new shopify.clients.Graphql({ session });

    const { productOptions, shopifyVariants } = buildProductOptionsAndVariants(availablePrintfulProductVariants,edmTemplateId);

    // const shopifyProduct = await createShopifyProduct(client, productOptions, images, edmTemplateId, printfulProduct);
    const shopifyProduct = await createShopifyProduct(client, productOptions, images, edmTemplateId, printfulProductData,customerId);

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

    // update mydesig metafields
    await updateMyDesign(customerId,edmTemplateId).catch((err) => console.error("Update My Design Metafields on Background Failed:", err));
    // Publish the product to default "Online Store" if created successfully
    if (shopifyProduct.product.id) {
      await publishShopifyProduct(shopifyProduct.product.id);
    }
    
    // Run printful product
    await syncShopifyProductToPrintful(
      client,
      edmTemplateId,
      availablePrintfulProductVariants,
      shopifyProduct.product.id
    ).catch((err) => console.error("Background sync error:", err));
    await delay(10000);
    return NextResponse.json({ productCreate: shopifyProduct }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}

async function fetchVariantsByIds(variantIds: number[]): Promise<PrintfulProductCatalogVariant[]> {

  const fetchPromises = variantIds.map(async (id) => {
    try {
      const res = await axios.get(`${NEXT_PUBLIC_BASE_URL}/api/printful/v2/catalog-variants/${id}`);
      const res2 = await axios.get(`${NEXT_PUBLIC_BASE_URL}/api/printful/v2/catalog-variants/${id}/availability`);
      const res3 = await axios.get(`${NEXT_PUBLIC_BASE_URL}/api/printful/v2/catalog-variants/${id}/prices`);
      
      const var1 = res.data.data;
      const var2 = res2.data.data.techniques[0].selling_regions; 
      const var3 = res3.data.data.variant.techniques;
      const enrichedVariant: PrintfulProductCatalogVariant = {
        ...var1,
        selling_regions: var2,
        techniques: var3 
      };

      return enrichedVariant;
    } catch (error) {
      // You can customize error handling here
      throw new Error(`Failed to fetch variant with id ${id}: ${error}`);
    }
  });

  const variants = await Promise.all(fetchPromises);

  return variants;

}

async function updateMyDesign(customerId: string, newTemplateId: string) {
  try {
    const payload = { templateId: newTemplateId };

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/shopify/customer/myDesign/${customerId}`,
      payload
    );

    console.log("Updated My Design Metafields");
    return res.data; 
  } catch (error: any) {
    console.error("Error updating design:", error.response?.data || error.message);
    throw error; 
  }
}
