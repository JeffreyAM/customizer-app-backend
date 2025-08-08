import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { PrintfulProductResponse, ShopifyProductCreateResponse } from "@/types";

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { product_id, images, edmTemplateId } = body;

  if (!product_id || !images || !Array.isArray(images) || !edmTemplateId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const productResponse = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/products/${product_id}`);

    const productData = productResponse?.data as PrintfulProductResponse;
    const { product } = productData.result;
    const { variants } = productData.result;

    const shopify = getShopify();
    const session = await getSession();

    const client = new shopify.clients.Graphql({ session });

    const mutation = `
      mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
        productCreate(product: $product, media: $media) {
          product {
            id
            title
            tags
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

    // Construct product options for Shopify
    const productOptions = variants.slice(0, 3).map((variant: any, idx: number) => {
      // Remove " / " from the name
      const cleanName = capitalize(variant.name.replace(/ \/ /g, "-"));
      return {
        name: cleanName,
        position: idx + 1,
        values: [
          {
            name: variant.size || variant.color || "Default",
          },
        ],
      };
    });

    // Construct media inputs for image URLs
    const media = images.map((url: string, idx: number) => ({
      originalSource: url,
      mediaContentType: "IMAGE",
      alt: `Mockup image ${idx + 1}`,
    }));

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

    const response = await client.request(mutation, {
      variables,
    });

    const data = response.data as ShopifyProductCreateResponse;
    if (!data || !data.productCreate) {
      return NextResponse.json({ error: "Invalid response from Shopify" }, { status: 502 });
    }

    const { productCreate } = data;

    console.log("Shopify product create response:", productCreate);

    if (productCreate.userErrors.length > 0) {
      return NextResponse.json({ error: "Shopify error", details: productCreate.userErrors }, { status: 400 });
    }

    return NextResponse.json({ productCreate }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
