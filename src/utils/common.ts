import { getSession } from "@/lib/session-utils";
import { getShopify } from "@/lib/shopify";
import { PRODUCT_VARIANT_APPEND_MEDIA } from "@/mutations/shopify/productVariantAppendMedia";
import { MediaNode, MockupResults, MockupVariantsImages, PrintfulProductCatalogResponse, PrintfulProductCatalogVariant, ProductVariantAppendMediaInput, ProductVariantAppendMediaResponse, VariantNode } from "@/types";
import axios from "axios";
import toast from "react-hot-toast";
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;


export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


// capitalizes a string
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// clean shopify id return only id
export const cleanShopifyId = (id: string) => {
  return id.replace("gid://shopify/Product/", "");
}

/**
 * use to get shopify client for general use
 * @returns shopify client
 */

export const getClient = async () => {
  const shopify = getShopify();
  const session = await getSession();
  return new shopify.clients.Graphql({ session });
};


export const fetchUserDetails = async (userId: string, setUser: Function) => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();

    if (response.ok) {
      setUser(data.user);
    } else {
      toast.error("Failed to fetch user details");
      setUser(null);
    }
  } catch (error) {
    toast.error("Error fetching user details");
    setUser(null);
  }
};

/**
 * Extracts the numeric ID from a Shopify GID string.
 * Example input: "gid://shopify/ProductVariant/50119401701680"
 * Output: "50119401701680"
 */
export function getNumericId(gid: string): string | null {
  const match = gid.match(/\d+$/);
  return match ? match[0] : null;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * request with attempt
 * @param url 
 * @param attempt 
 * @returns 
 */
export async function fetchWithRetry(url: string, attempt = 1): Promise<any> {
  try {
    return await axios.get(url);
  } catch (error: any) {
    if (error.response?.status === 429 && attempt < 5) {
      const delay = Math.pow(2, attempt) * 100; 
      await new Promise(res => setTimeout(res, delay));
      return fetchWithRetry(url, attempt + 1);
    }
    throw error;
  }
}

 /**
 * get printful variants with price availability that matches the variantIds param
 * @param variantIds 
 * @returns 
 */
export async function fetchVariantsByIds(
  variantIds: number[],
  batchSize: number = 100
): Promise<PrintfulProductCatalogVariant[]> {
  const variants: PrintfulProductCatalogVariant[] = [];

  // ✅ Only use the first 95 variant IDs
  const limitedVariantIds = variantIds.slice(0, 100);

  // Split variant IDs into batches
  for (let i = 0; i < limitedVariantIds.length; i += batchSize) {
    const batch = limitedVariantIds.slice(i, i + batchSize);

    // Process batch concurrently
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          const v1_api = await fetchWithRetry(`${NEXT_PUBLIC_BASE_URL}/api/printful/products/variant/${id}`);
          // const var1 = await fetchWithRetry(`${NEXT_PUBLIC_BASE_URL}/api/printful/v2/catalog-variants/${id}`);
          // const var3 = await fetchWithRetry(`${NEXT_PUBLIC_BASE_URL}/api/printful/v2/catalog-variants/${id}/prices`);

          const enriched: PrintfulProductCatalogVariant = {
            ...v1_api.data.result.variant,
            // techniques: var3.data.data.variant?.techniques ?? [],
          };

          return enriched;
        } catch (error) {
          console.warn(`❌ Failed to fetch variant ${id}:`, error);
          return null;
        }
      })
    );

    // Filter successful results
    variants.push(...(batchResults.filter(Boolean) as PrintfulProductCatalogVariant[]));
  }

  return variants;
}

/**
 * update shopify customer metafields name my_design
 * @param customerId 
 * @param newTemplateId 
 * @returns 
 */
export async function updateMyDesign(customerId: string, newTemplateId: string) {
  try {
    const payload = { templateId: newTemplateId };

    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/shopify/customer/myDesign/${customerId}`,
      payload
    );

    console.log("Updated My Design Metafields");
    return res.data; 
  } catch (error: any) {
    console.error("Error updating design:", error.response?.data || error.message);
    throw error; 
  }
}

/**
 * extract variants id with corresponding mockup images
 * use for creating shopify product 
 * @param mockupResult 
 * @returns 
 */
export function extractMockupImages(mockupResult: any): MockupVariantsImages[] {
  const result: MockupVariantsImages[] = [];
  const mockups = mockupResult.mockups;
  for (const mockup of mockups) {
    const variantIds = mockup.variant_ids.map(String);

    // Main mockup image: one entry per variant, but grouped under one object
    result.push({
      type: "main",
      variants: variantIds,
      url: mockup.mockup_url
    });

    // Extra images: one entry per extra image, with all variant IDs
    if (Array.isArray(mockup.extra)) {
      for (const extra of mockup.extra) {
        result.push({
          type: "extra",
          variants: variantIds,
          url: extra.url
        });
      }
    }
  }

  return result;
}

/**
 * Assigning Image on each product variant
 * @param productId 
 * @param variantMedia
 * @returns 
 */
async function sendMediaAppendMutation(
  productId: string,
  variantMedia: ProductVariantAppendMediaInput[]
): Promise<{ productId: string; variantMedia: ProductVariantAppendMediaInput[] } | null> {
  try {
    const client = await getClient();
    const mutation = PRODUCT_VARIANT_APPEND_MEDIA;
    const variables = { productId, variantMedia };

    const response = await client.request<ProductVariantAppendMediaResponse>(mutation, { variables });
    const result = response?.data?.productVariantAppendMedia;

    if (result?.userErrors.length) {
      console.warn("❌ Failed batch:", result.userErrors.map(e => e.message).join("; "));
      return null;
    } else {
      console.log(`✅ Success: ${result?.productVariants.length} variant(s) updated`);
      return { productId, variantMedia };
    }
  } catch (err) {
    console.error("❌ Mutation error:", err);
    return null;
  }
}
/**
 * creating batch of appendMediaInput 
 * shopify product
 * @param shopifyProductId 
 * @returns 
 */
export async function productVariantAppendMedia(
  shopifyProductId: string
): Promise<{ productId: string; variantMedia: ProductVariantAppendMediaInput[] }[]> {
  const productId = shopifyProductId;
  const numericId = getNumericId(productId);
  const payloads: { productId: string; variantMedia: ProductVariantAppendMediaInput[] }[] = [];
  const seenPairs = new Set<string>();

  const allVariants: VariantNode[] = [];
  const allMedia: MediaNode[] = [];

  // Fetch all variants
  let variantsAfter: string | null = null;
  let hasMoreVariants = true;

  while (hasMoreVariants) {
    const res:any = await axios.get(`${NEXT_PUBLIC_BASE_URL}/api/shopify/product`, {
      params: { product_id: numericId, variantsAfter: variantsAfter }
    });

    const variantPage = res.data.product.variants;
    if (variantPage?.nodes?.length) {
      allVariants.push(...variantPage.nodes);
    }

    variantsAfter = variantPage?.pageInfo?.hasNextPage ? variantPage.pageInfo.endCursor : null;
    hasMoreVariants = !!variantsAfter;
  }

  // Fetch all media
  let mediaAfter: string | null = null;
  let hasMoreMedia = true;

  while (hasMoreMedia) {
    const res:any= await axios.get(`${NEXT_PUBLIC_BASE_URL}/api/shopify/product`, {
      params: { product_id: numericId, mediaAfter: mediaAfter }
    });

    const mediaPage = res.data.product.media;
    if (mediaPage?.nodes?.length) {
      allMedia.push(...mediaPage.nodes);
    }

    mediaAfter = mediaPage?.pageInfo?.hasNextPage ? mediaPage.pageInfo.endCursor : null;
    hasMoreMedia = !!mediaAfter;
  }
  const BATCH_SIZE = 20;
  let batchInputs: ProductVariantAppendMediaInput[] = [];
  // Match media.alt to variant.barcode
  for (const media of allMedia) {
    const alt = media.alt?.trim();
    if (!alt || alt.toLowerCase().includes("extra")) continue;

    // Extract variant IDs from alt (comma-separated)
    const altVariantIds = alt.split(",").map(id => id.trim());

    for (const variant of allVariants) {
      const barcode = variant.barcode?.trim();
      if (!barcode || !altVariantIds.includes(barcode)) continue;

      const key = `${variant.id}`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      batchInputs.push({
        variantId: variant.id,
        mediaIds: [media.id],
      });

      if (batchInputs.length >= BATCH_SIZE) {
        const result = await sendMediaAppendMutation(productId, batchInputs);
        if (result) payloads.push(result);
        batchInputs = []; // reset for next batch
      }
    }
  }
  // Final batch if any remaining
  if (batchInputs.length > 0) {
    const result = await sendMediaAppendMutation(productId, batchInputs);
    if (result) payloads.push(result);
  }

  return payloads;
}