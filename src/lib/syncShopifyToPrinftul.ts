import { GET_PRODUCT } from "@/queries/shopify/getProduct";
import { PrintfulProductCatalogVariant, PrintfulProductResponse, PrintfulProductSyncResponse, PrintfulSyncVariantResponse, SelectedOption, ShopifyProductResponse, VariantUpdateResult } from "@/types";
import axios from "axios";
import { getShopify } from "./shopify";
import { supabase } from "./supabase";
import { GraphQLClientResponse } from "@shopify/shopify-api";
import { delay, getNumericId } from "@/utils/common";
import { SET_TEMP_STOCK } from "@/mutations/shopify/temporaryStock";

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY!;
const PRINTFUL_API_BASE = process.env.NEXT_PRINTFUL_BASE_API_URL;
const STORE_ID = process.env.PRINTFUL_STORE_ID!;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function syncShopifyProductToPrintful(
  client: InstanceType<ReturnType<typeof getShopify>["clients"]["Graphql"]>,
  edmTemplateId: string,
  // printfulVariants: PrintfulProductResponse["result"]["variants"],
  printfulVariants: PrintfulProductCatalogVariant[],
  shopifyProductID: string
) {
  // delay for 1 second
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const shopifyProductResponse = await client.request<ShopifyProductResponse>(GET_PRODUCT, {
      variables: { ownerId: shopifyProductID },
    });

    if (!shopifyProductResponse.data?.product) {
      throw new Error("Shopify product response data is undefined");
    }
    
    const shopifyProduct = shopifyProductResponse.data.product;
    shopifyProduct.variants.nodes = await fetchAllVariants(client, shopifyProductID); // Fetch all variants

    const { data: templates, error: templatesError } = await supabase
      .from("templates")
      .select("*")
      .eq("template_id", edmTemplateId)
      .order("id", { ascending: false })
      .limit(1);

    if (templatesError) {
      throw new Error("Failed to fetch templates: " + JSON.stringify(templatesError));
    }

    const { data: mockupTasks, error: mockupTasksError } = await supabase
      .from("mockup_tasks")
      .select("*")
      .eq("template_id", templates?.[0]?.id)
      .order("id", { ascending: false })
      .limit(1);

    if (mockupTasksError) {
      throw new Error("Failed to fetch mockup results: " + JSON.stringify(mockupTasksError));
    }

    const { data: mockupResults, error: mockupResultsError } = await supabase
      .from("mockup_results")
      .select("*")
      .eq("task_key", mockupTasks?.[0]?.task_key)
      .order("id", { ascending: false })
      .limit(1);

    if (mockupResultsError) {
      throw new Error("Failed to fetch mockup results: " + JSON.stringify(mockupResultsError));
    }

    const result = await buildSyncPayload(shopifyProduct, printfulVariants, edmTemplateId, mockupResults);

    const variants = result.sync_variants;
    // console.log("variants sync: ",JSON.stringify(variants,null,2))

    const response = await updateVariantsWithRetry(variants);


    // console.log("Payload request:", JSON.stringify(payload, null, 2));

    // const response = await axios.post<PrintfulProductSyncResponse>(`${PRINTFUL_API_BASE}/store/products`, payload, {
    //   headers: {
    //     Authorization: `Bearer ${PRINTFUL_API_KEY}`,
    //     "Content-Type": "application/json",
    //     "X-PF-Store-Id": STORE_ID.toString(),
    //   },
    // });

    if (!response || !response[0].success) {
      // throw new Error("Failed to sync product with Printful: " + JSON.stringify(response.data));
      throw new Error("Failed to sync product with Printful: ");
    }
    return response[0].response?.result;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error("Failed to sync product with Printful: " + JSON.stringify(error.response?.data));
    } else {
      throw new Error("Unexpected error: " + JSON.stringify(error));
    }
  }
}

async function fetchAllVariants(
  client: InstanceType<ReturnType<typeof getShopify>["clients"]["Graphql"]>,
  shopifyProductID: string
) {
  let allVariants: any[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const shopifyProductResponse: GraphQLClientResponse<ShopifyProductResponse> =
      await client.request<ShopifyProductResponse>(GET_PRODUCT, {
        variables: { ownerId: shopifyProductID, variantsAfter: cursor },
      });

    if (!shopifyProductResponse.data?.product) {
      throw new Error("Shopify product response data is undefined");
    }

    const variants: ShopifyProductResponse["product"]["variants"] = shopifyProductResponse.data.product.variants;
    allVariants.push(...variants.nodes);

    hasNextPage = variants.pageInfo.hasNextPage;
    cursor = variants.pageInfo.endCursor;
  }

  // add temporary stock to prevent sold out issue due to printful sync is in process
  // const changes = allVariants.map((variant) => ({
  //   inventoryItemId: variant.inventoryItem.id,
  //   locationId: "gid://shopify/Location/105886023984",
  //   delta: 1,
  // }));

  // if (changes.length > 0) {
  //   const temp = await client.request<any>(SET_TEMP_STOCK, {
  //     variables: {
  //       input: {
  //         reason: "correction", 
  //         name: "available", 
  //         changes,
  //       },
  //     },
  //   });

  //   console.log("Temp stock adjustment:", JSON.stringify(temp, null, 2));
  // }

  console.log(JSON.stringify(allVariants,null,2));
  return allVariants;
}

function getPrintfulVariantIdFromShopifyVariantMetaFields(
  // printfulVariants: PrintfulProductResponse["result"]["variants"],
  printfulVariants: PrintfulProductCatalogVariant[],
  metafields: ShopifyProductResponse["product"]["variants"]["nodes"][number]["metafields"]["nodes"]
): number | null {
  for (const variant of printfulVariants) {
    const metafield = metafields.find((m) => m.key === "printful_variant_id" && m.value === variant.id.toString());
    if (metafield) {
      return variant.id;
    }
  }
  return null;
}

function getPrintFilesForVariant(
  extraOption: any,
  variantId: number | null,
  mockupResults?: Array<{
    printfiles: Array<{ url: string; placement: string; variant_ids: number[] }>;
  }>
) {
  if (!variantId || !mockupResults?.[0]?.printfiles) return [];

  return mockupResults[0].printfiles
    .filter((file) => file.variant_ids.includes(variantId))
    .map((file) => ({
      type: file.placement,
      url: file.url,
      options: extraOption.placement_option_data[0].options
    }));
}

async function mapSyncVariant(
  shopifyVariant: ShopifyProductResponse["product"]["variants"]["nodes"][number],
  // printfulVariants: PrintfulProductResponse["result"]["variants"],
  printfulVariants: PrintfulProductCatalogVariant[],
  edmTemplateId: any,
  mockupResults?: Array<{
    printfiles: Array<{ url: string; placement: string; variant_ids: number[] }>;
  }>
) {
  const variantId = getPrintfulVariantIdFromShopifyVariantMetaFields(printfulVariants, shopifyVariant.metafields.nodes);

  const extraOption: any = await fetchExtraOptionForEmbroidery(edmTemplateId);

  const options: any = [
    ...shopifyVariant.selectedOptions.map((option) => ({
      id: option.name,
      value: option.value,
    })),
    ...extraOption.option_data,
  ];

  return {
    external_id: shopifyVariant.id,
    variant_id: variantId,
    retail_price: shopifyVariant.price,
    is_ignored: false,
    sku: shopifyVariant.sku || "",
    files: getPrintFilesForVariant(extraOption,variantId, mockupResults),
    options : options,
    availability_status: "active",
  };
}

async function buildSyncPayload(
  shopifyProduct: ShopifyProductResponse["product"],
  printfulVariants: PrintfulProductCatalogVariant[],
  // printfulVariants: PrintfulProductResponse["result"]["variants"],
  edmTemplateId: string,
  mockupResults?: Array<{
    printfiles: Array<{ url: string; placement: string; variant_ids: number[] }>;
  }>
) {

  const syncVariants = await Promise.all(
    shopifyProduct.variants.nodes.map((variant) =>
      mapSyncVariant(variant, printfulVariants, edmTemplateId, mockupResults)
    )
  );

  // return {
  //   sync_product: {
  //     external_id: shopifyProduct.id,
  //     name: shopifyProduct.title,
  //     thumbnail: shopifyProduct.media?.nodes?.[0]?.preview?.image?.url || "",
  //     is_ignored: false,
  //     tags: [`edm_template_id_${edmTemplateId}`],
  //   },
  //   // sync_variants: shopifyProduct.variants.nodes.map((variant) =>
  //   //  mapSyncVariant(variant, printfulVariants,edmTemplateId, mockupResults)
  //   // ),
  //   sync_variants: syncVariants,
  // };
  return {sync_variants: syncVariants}
}
/**
 * fetch extra option when product techniques is embroidery
 * @param templateId 
 * @returns SelectedOption[]
 */
async function fetchExtraOptionForEmbroidery(templateId: any): Promise<SelectedOption[]> {

  try {
    const res = await axios.get(`${NEXT_PUBLIC_BASE_URL}/api/printful//product-templates/${templateId}`);
    const extraOpt = res.data.result;
    
    return extraOpt;
  } catch (error) {
    // You can customize error handling here
    throw new Error(`Failed to fetch extra Opt: ${error}`);
  }
}

/**
 * sync variants to printful
 */
async function updateVariantsWithRetry(variants: any[]): Promise<VariantUpdateResult[]> {
  const MAX_RETRIES = 10;
  const NOT_FOUND_RETRY_DELAY = 5000; // 5 seconds for not found
  
  const results: VariantUpdateResult[] = [];

  for (const variant of variants) {
    let attempt = 0;
    let success = false;
    let response: any;
    let lastError: string = '';
    
    while (attempt < MAX_RETRIES && !success) {
      try {
        
        response = await axios.put(
          `${NEXT_PUBLIC_BASE_URL}/api/printful//sync/variant/@${getNumericId(variant.external_id)}`,
          variant
        );

        success = true;
        
      } catch (error) {
        attempt++;
        
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const errorMessage = error.response?.data?.error?.message || error.message;
          lastError = `${status}: ${errorMessage}`;
          
          // Only handle 404 errors with retries
          if (status === 404) {
            console.log(`Variant not found (attempt ${attempt}/${MAX_RETRIES}): ${variant.external_id}`);
            
            if (attempt < MAX_RETRIES) {
              console.log(`Retrying in ${NOT_FOUND_RETRY_DELAY}ms... (variant might still be syncing)`);
              await delay(NOT_FOUND_RETRY_DELAY);
            } else {
              console.error(`Variant not found after ${MAX_RETRIES} attempts: ${variant.external_id}`);
              break;
            }
          } else {
            // All other errors - don't retry, just fail immediately
            console.error(`Error ${status}: ${errorMessage} - ${variant.external_id}`);
            break;
          }
        }
      }
    }
    
    // Add result for this variant
    results.push({
      variant,
      success,
      response: success ? response.data : undefined,
      error: success ? undefined : lastError,
      attempts: attempt
    });
  }
  
  // Log summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Variant update summary: ${successful} successful, ${failed} failed out of ${variants.length} total`);
  
  if (failed > 0) {
    console.log('Failed variants:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.variant.external_id}: ${r.error} (${r.attempts} attempts)`);
    });
  }
  
  return results;
}
