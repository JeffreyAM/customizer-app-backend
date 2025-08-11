import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { PrintfulProductResponse, ShopifyProductCreateResponse } from "@/types";

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

// function for creating product variants
async function createProductVariants(
  client: InstanceType<ReturnType<typeof getShopify>["clients"]["Graphql"]>,
  productId: string,
  variants: Array<any>
) {
  if (!variants.length || !productId) return;

  const variantMutation = `
    mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkCreate(productId: $productId, variants: $variants) {
        productVariants {
          id
          title
          price
          barcode
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // split into 10
  const chunks = chunkArray(variants, 10);
  const createdVariants: any[] = [];

  for (const chunk of chunks) {
    try {
      const variables = { productId, variants: chunk };
      const response = await client.request(variantMutation, { variables });
      const variantData = response.data?.productVariantsBulkCreate;

      if (variantData?.userErrors?.length > 0) {
        console.warn("Variant creation errors:", variantData.userErrors);
      }

      if (variantData?.productVariants) {
        createdVariants.push(...variantData.productVariants);
      }
    } catch (err) {
      console.error("Error creating variants: ", err);
    }
  }

  console.log("Created variants:", createdVariants.length);
  console.log("Created variant details:", createdVariants);

  return createdVariants;
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { product_id, images, edmTemplateId } = body;

  // validate request body
  if (!product_id || !images || !Array.isArray(images) || !edmTemplateId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const productResponse = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/products/${product_id}`);

    console.log("Product response:", productResponse.data);

    const productData = productResponse.data as PrintfulProductResponse;

    const { product, variants } = productData.result;

  
    const shopify = getShopify();
    const session = await getSession();
    const client = new shopify.clients.Graphql({ session });

    const { productOptions, shopifyVariants } = buildProductOptionsAndVariants(variants);

    const media = images.map((url: string, idx: number) => ({
      originalSource: url,
      mediaContentType: "IMAGE",
      alt: `Mockup image ${idx + 1}`,
    }));

    const mutation = `
      mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
        productCreate(product: $product, media: $media) {
          product {
            id
            title
            tags
            options {
              name
              values
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price
                }
              }
            }
            media(first: 10) {
              edges {
                node {
                  mediaContentType
                  ... on MediaImage {
                    image {
                      originalSrc
                      altText
                    }
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      product: {
        title: product.title,
        descriptionHtml: product.description,
        vendor: "Printful-EDM",
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

    await createProductVariants(client, data.product.id, shopifyVariants);

    return NextResponse.json({ productCreate: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}