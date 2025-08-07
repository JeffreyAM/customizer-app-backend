import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";

let shopifyInstance: ReturnType<typeof shopifyApi> | null = null;

export function getShopify() {
  if (!shopifyInstance) {
    const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_APP_URL } = process.env;

    if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_APP_URL) {
      throw new Error("Missing Shopify environment variables");
    }

    shopifyInstance = shopifyApi({
      apiKey: SHOPIFY_API_KEY,
      apiSecretKey: SHOPIFY_API_SECRET,
      scopes: ["write_products"],
      hostName: SHOPIFY_APP_URL.replace(/^https?:\/\//, ""),
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: true,
    });
  }

  return shopifyInstance;
}
