import { NextRequest, NextResponse } from "next/server";
import { shopify } from "@/lib/shopify";
import { getSession } from "@/lib/session-utils";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    product: { title, body_html, vendor, product_type, status },
    variants,
    images,
    edmTemplateId,
  } = body;

  if (!title || !vendor || !product_type || !variants || !images || !edmTemplateId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
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

    // Construct product options if variants exist
    const optionNames = ["Size", "Color"];
    const productOptions = optionNames.map((name, index) => ({
      name,
      values: [...new Set(variants.map((v: any) => v[name.toLowerCase()] || v[`option${index + 1}`]))],
    }));

    // Shopify expects options: option1, option2 etc.
    const shopifyVariants = variants.map((v: any) => ({
      option1: v.size || v.option1 || null,
      option2: v.color || v.option2 || null,
      price: v.price || "9.99",
      sku: v.sku || null,
    }));

    // Construct media inputs for image URLs
    const media = images.map((url: string, idx: number) => ({
      originalSource: url,
      mediaContentType: "IMAGE",
      alt: `Mockup image ${idx + 1}`,
    }));

    const variables = {
      product: {
        title,
        descriptionHtml: body_html || "",
        vendor,
        productType: product_type,
        status: status || "DRAFT",
        tags: [`edm_template_id_${edmTemplateId}`],
        productOptions,
        variants: shopifyVariants,
      },
      media,
    };

    const response: ShopifyProductCreateResponse = await client.query({
      data: {
        query: mutation,
        variables,
      },
    });

    if (!response.body || !response.body.data) {
      return NextResponse.json({ error: "Invalid response from Shopify" }, { status: 502 });
    }

    const { productCreate } = response.body.data;

    if (productCreate.userErrors.length > 0) {
      return NextResponse.json({ error: "Shopify error", details: productCreate.userErrors }, { status: 400 });
    }

    return NextResponse.json({ product: productCreate.product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
