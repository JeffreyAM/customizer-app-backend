// lib/session-utils.ts
import { shopify } from "./shopify";

export async function getSession() {
  // In real apps, you'd load from DB or cookies
  return await shopify.session.customAppSession("your-development-store.myshopify.com");
}
