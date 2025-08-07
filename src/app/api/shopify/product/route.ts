import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { ShopifyProductCreateResponse } from "@/types";

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

    // Flatten the variants
    const flatVariants = variants.flat();

    // List of keys to ignore (e.g., non-option fields)
    const ignoredKeys = ["price", "sku", "id"];

    const productOptions = flatVariants.reduce((acc: any[], variant: any) => {
      Object.entries(variant).forEach(([key, value]) => {
        if (ignoredKeys.includes(key)) return;

        const optionName = capitalize(key);
        let option = acc.find((opt) => opt.name === optionName);
        if (!option) {
          option = {
            name: optionName,
            position: acc.length + 1,
            values: [],
          };
          acc.push(option);
        }

        // Convert to { name: value } and check for duplicates
        const valueObj = { name: value };
        const exists = option.values.some((v: any) => v.name === value);
        if (!exists) {
          option.values.push(valueObj);
        }
      });

      return acc;
    }, []);

    console.log(variants);

    console.log(productOptions);

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

    if (productCreate.userErrors.length > 0) {
      return NextResponse.json({ error: "Shopify error", details: productCreate.userErrors }, { status: 400 });
    }

    return NextResponse.json({ productCreate }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 });
  }
}
