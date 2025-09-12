import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { CUSTOMER_METAFIELDS } from "@/mutations/shopify/customerMetafields";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const shopify = getShopify();
const session = await getSession();
const client = new shopify.clients.Graphql({ session });

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const mutaion = CUSTOMER_METAFIELDS;

    const templates = await fetchAllProductHandles(id);

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

async function fetchAllProductHandles(id: string): Promise<string[]> {
  const allHandles: string[] = [];
  let hasNextPage = true;
  let afterCursor = null;

  while (hasNextPage) {
    const url = `${NEXT_PUBLIC_BASE_URL}/api/shopify/product?customer_id=${id}${afterCursor ? `&after=${afterCursor}` : ''}`;
    const res: any = await axios.get(url);

    const products = res.data?.products;
    const edges = products?.edges;

    edges.forEach((edge: any) => {
      const handle = edge?.node?.handle;
      if (handle) {
        allHandles.push(handle);
      }
    });

    hasNextPage = products?.pageInfo?.hasNextPage;
    console.log(hasNextPage)
    afterCursor = products?.pageInfo?.endCursor;
  }

  return allHandles;
}


