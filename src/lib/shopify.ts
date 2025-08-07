import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import "@shopify/shopify-api/adapters/node";

let shopifyInstance: ReturnType<typeof shopifyApi> | null = null;

export function getShopify() {
  if (!shopifyInstance) {
    const { SHOPIFY_ADMIN_API_ACCESS_TOKEN, SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL } = process.env;

    if (!SHOPIFY_ADMIN_API_ACCESS_TOKEN || !SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_APP_URL) {
      throw new Error("Missing Shopify environment variables");
    }

    shopifyInstance = shopifyApi({
      adminApiAccessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      apiKey: SHOPIFY_API_KEY,
      apiSecretKey: SHOPIFY_API_SECRET,
      scopes: ["write_products"],
      hostName: SHOPIFY_APP_URL?.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: false,
    });
  }

  return shopifyInstance;
}
