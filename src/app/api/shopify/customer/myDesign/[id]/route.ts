import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { CUSTOMER_METAFIELDS } from "@/mutations/shopify/customerMetafields";
import { GET_CUSTOMER_PRODUCT_TEMPLATE } from "@/queries/shopify/getCustomerProductTemplateId";
import { checkBody } from "@/utils/payload";
import { NextRequest, NextResponse } from "next/server";

const shopify = getShopify();
const session = await getSession();
const client = new shopify.clients.Graphql({ session });

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await checkBody(req);

    if (body instanceof NextResponse) {
      return body;
    }

    const { templateId } = body;
    if (!templateId) {
      return NextResponse.json({ error: "Missing TemplateId fields" }, { status: 400 });
    }

    const mutaion = CUSTOMER_METAFIELDS;

    const templates = await fetchAllProductHandles(id,templateId);

    // const variables = { id: `gid://shopify/Customer/${id}` };
    const variables = {
      metafields: [
        {
          ownerId: `gid://shopify/Customer/${id}`,
          namespace: 'preferences',
          key: 'my_design',
          type: 'json',
          // value: JSON.stringify([])
          value: JSON.stringify(templates),
        },
      ],
    };

    const response = await client.request(mutaion, {variables});

    return NextResponse.json({ customer: response?.data}, { status: 200 });
  } catch (error) {
    console.error("Error fetching product(s):", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}

async function fetchAllProductHandles(id: string, newTemplateId: string): Promise<string[]> {
  const allHandles: string[] = [];
  allHandles.push(String(newTemplateId));

  let hasNextPage = true;
  let endCursor: string | null = null;

  const shopify = getShopify();
  const session = await getSession();
  const client = new shopify.clients.Graphql({ session });

  while (hasNextPage) {
    const variables: any = { 
      query: `tag:customer_id-${id}`,
      first: 250,
      after: endCursor
    };

    const response = await client.query<any>({
      data: {
        query: GET_CUSTOMER_PRODUCT_TEMPLATE,
        variables
      }
    });

    //Defensive checks
    const products = response?.body?.data?.products;
    if (!products) {
      throw new Error("No products returned from Shopify GraphQL API");
    }

    const edges = products.edges || [];
    for (const edge of edges) {
      if (edge?.node?.handle) {
        allHandles.push(edge.node.handle);
      }
    }

    hasNextPage = products.pageInfo?.hasNextPage ?? false;
    endCursor = products.pageInfo?.endCursor ?? null;
  }

  return allHandles;
}


