import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { CUSTOMER_METAFIELDS } from "@/mutations/shopify/customerMetafields";
import { GET_CUSTOMER } from "@/queries/shopify/getCustomer";
import { GET_CUSTOMERS } from "@/queries/shopify/getCustomers";
import { NextRequest, NextResponse } from "next/server";


type RouteContext = { params: Promise<{ id: string }> };

const shopify = getShopify();
const session = await getSession();
const client = new shopify.clients.Graphql({ session });

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    let query;

    const variables = { id: `gid://shopify/Customer/${id}` };
    if(!id){
      query = GET_CUSTOMERS;
      const response = await client.request(query);
      return NextResponse.json({ customer: response?.data?.customer}, { status: 200 });
    }else{
      query = GET_CUSTOMER;
      const response = await client.request(query, {variables});
      return NextResponse.json({ customer: response?.data?.customer}, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching product(s):", error);
    return NextResponse.json(
      { error: "Server error", details: String(error) },
      { status: 500 }
    );
  }
}