import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { CUSTOMER_METAFIELDS } from "@/mutations/shopify/customerMetafields";
import { GET_CUSTOMERS } from "@/queries/shopify/getCustomers";
import { NextRequest, NextResponse } from "next/server";

const shopify = getShopify();
const session = await getSession();
const client = new shopify.clients.Graphql({ session });

export async function GET(req: NextRequest) {
  try {
    const query = GET_CUSTOMERS;
    const response = await client.request(query);

    return NextResponse.json({ customers: response?.data?.customers}, { status: 200 });
  } catch (error) {
    console.error("Error fetching product(s):", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}
