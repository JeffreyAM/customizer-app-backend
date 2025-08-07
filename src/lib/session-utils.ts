// lib/session-utils.ts

import { getShopify } from "./shopify";

export async function getSession() {
  const shopify = getShopify();

  const shop = process.env.SHOPIFY_APP_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const session = shopify.session.customAppSession(shop || "");

  // Set the access token manually from env
  session.accessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN || "";

  return session;
}