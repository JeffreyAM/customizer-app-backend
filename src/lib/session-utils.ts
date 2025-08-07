// lib/session-utils.ts

import { getShopify } from "./shopify";

export async function getSession() {
  // In real apps, you'd load from DB or cookies
  const shopify = getShopify();
  return await shopify.session.customAppSession("your-development-store.myshopify.com");
}
