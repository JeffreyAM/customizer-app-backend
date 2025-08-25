import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from "@/lib/supabase"; 
import { createShopifyProduct } from '@/helpers/create-product';

const PRINTFUL_API_BASE = process.env.NEXT_PRINTFUL_BASE_API_URL; 
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; 
const STORE_ID = process.env.PRINTFUL_STORE_ID!;

/**
 * @openapi
 * /api/printful/template:
 *   post:
 *     summary: Create a new Printful template
 *     tags: ["External/Printful"]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templateId:
 *                 type: string
 *               user:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created template
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, user, productId } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
        {
          status: 400,
        }
      );
    }

    const apiKey = process.env.PRINTFUL_API_KEY || "xyD86qYWF2lZKRUdbOCfelfw8V4OX3Nd0zYnIipf";


    // First, get basic template data
    const templateResponse = await axios.get(`${PRINTFUL_API_BASE}/product-templates/${templateId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-PF-Store-Id": STORE_ID,
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    if (templateResponse.status !== 200) {
      return NextResponse.json(
        { error: "Failed to fetch template from Printful", details: templateResponse.data },
        {
          status: templateResponse.status,
        }
      );
    }

    const templateData = (templateResponse.data as any).result;

    // Extract basic information
    const productTitle = templateData.title || "Unknown Product";
    const variantOptions = templateData.available_variant_ids || {};
    const imageUrl = templateData.mockup_file_url || null;

    // If no mockup URL is immediately available, start background process to get it
    if (!imageUrl) {
      console.log("Mockup URL not immediately available, starting background retry process...");
      // Don't await this - let it run in the background
      updateMockupUrlInBackground(templateId, apiKey).catch((error) => {
        console.error("Background mockup URL update failed:", error);
      });
    }

    // Create or get user ID - this MUST succeed if user data is provided
    let userId = null;
    if (user && user.name && user.email) {
      try {
        userId = await createOrGetUser(user);
        if (!userId) {
          throw new Error("Failed to create or retrieve user");
        }
      } catch (userError) {
        console.error("User creation/retrieval failed:", userError);
        return NextResponse.json(
          { error: "Failed to create user", details: (userError as Error).message },
          {
            status: 500,
          }
        );
      }
    }

    // Save to database
    const { data: savedTemplate, error: dbError } = await supabase
      .from("templates")
      .upsert({
        template_id: templateId,
        product_title: productTitle,
        variant_options: variantOptions,
        image_url: imageUrl,
        user_id: userId, // Use the created/found user ID (or null if no user provided)
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save template data", details: dbError.message },
        {
          status: 500,
        }
      );
    }
    // get the template from backend and create the mockup
  //   const backendUrl = `${NEXT_PUBLIC_BASE_URL}/api/printful/template/${templateId}`;
  //   const backendRes = await fetch(backendUrl);

  //   if (!backendRes.ok) {
  //     const err = await backendRes.text();
  //     return NextResponse.json({ error: "Failed to get  template data from the backend", details: err }, { status: 500 });
  //   }

  //   const templateFromBackend = await backendRes.json();

  //   const variantIds = (templateFromBackend.template.variant_options || []).filter(
  //       (id: number) => typeof id === "number" && !isNaN(id)
  //     );

  // const createMockUpResponse = await fetch(`${NEXT_PUBLIC_BASE_URL}/api/printful/mockup`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     template_id: templateFromBackend.template.id,
  //     product_template_id: templateFromBackend.template.template_id,
  //     catalog_product_id: productId,
  //     variant_ids: variantIds,
  //   }),
  // });

  // if (createMockUpResponse.ok) {
  //   const createMockUp = await createMockUpResponse.json();
  //   console.log(`Mockup task created! Task ID: ${createMockUp.task.task_key}`);
  //   const taskKey = createMockUp.task.task_key;
  //   pollAndCreateShopifyProduct(productId,templateId,taskKey,variantOptions).catch((error) => {
  //       console.error("Background creating shopify product failed:", error);
  //     });

  // } else {
  //   return NextResponse.json(
  //     {
  //       error: "Failed to create mockup",
  //       details: "Server error",
  //     },
  //     { status: 500 }
  //   );
  // }

  // const taskKey = createMockUp.task.task_key;

  // const taskStatus = await pollMockupTaskStatus(taskKey);
  // if(taskStatus != "completed"){
  //   return NextResponse.json(
  //     {
  //       error: "Failed to Mockup Task",
  //       details: "",
  //     },
  //     { status: 500 }
  //   );
  // }

  // const mockupResultResponse = await fetch(`${NEXT_PUBLIC_BASE_URL}/api/mockup-result/${taskKey}`);

  // if (!mockupResultResponse.ok) {
  //   return NextResponse.json(
  //     {
  //       error: "Failed to call internal template API",
  //       details:  "Unknown error",
  //     },
  //     { status: 500 }
  //   );
  // }

  // const mockupResult = (await mockupResultResponse.json()) as {
  //   mockups: {
  //     mockup_url: string;
  //     extra?: { url: string }[];
  //   }[];
  // };

  // console.log(mockupResult);

  // // Safely extract image URLs
  // const getMockupImages = (): string[] => {
  //   if (!mockupResult || !mockupResult.mockups) return [];

  //   return [
  //     ...new Set(
  //       mockupResult.mockups.flatMap((mockup) => [
  //         mockup.mockup_url,
  //         ...(mockup.extra?.map((img) => img.url) || []),
  //       ])
  //     ),
  //   ];
  // };

  const shopifyImgs = imageUrl || "https://placehold.co/600x600.png"; // Fallback image if no mockup URL available
  console.log(shopifyImgs);

    const createProduct = await createShopifyProduct(
      'https://customizer-app-backend.vercel.app/api/shopify/product',
      productId,
      shopifyImgs,
      templateId,
      variantOptions || []
    );

    return NextResponse.json(
      {
        success: true,
        template: savedTemplate,
        printfulData: templateData,
        userId: userId, // Include the user ID in the response
        details: "Creating Shopify Product in the background"
        // shopifyProduct: createProduct.productCreate.product || createProduct,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Template processing error:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      {
        status: 500,
      }
    );
  }
}

// Background function to update mockup URL when it becomes available
async function updateMockupUrlInBackground(templateId: string, apiKey: string, maxRetries: number = 8): Promise<void> {
  console.log(`Starting background mockup URL update for template ${templateId}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const templateResponse = await axios.get(`${PRINTFUL_API_BASE}/product-templates/${templateId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-PF-Store-Id": STORE_ID,
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      if (templateResponse.status === 200) {
        const templateData = (templateResponse.data as any).result;
        const mockupUrl = templateData.mockup_file_url;

        if (mockupUrl) {
          console.log(`Background: Mockup URL found on attempt ${attempt}, updating database...`);

          // Update the database with the mockup URL
          const { error } = await supabase
            .from("templates")
            .update({
              image_url: mockupUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("template_id", templateId);

          if (error) {
            console.error("Background: Failed to update mockup URL in database:", error);
          } else {
            console.log(`Background: Successfully updated mockup URL for template ${templateId}`);
          }
          return; // Success, exit the function
        }
      }

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.min(2000 * Math.pow(1.5, attempt - 1), 30000); // Slower exponential backoff for background, max 30 seconds
        console.log(`Background attempt ${attempt}: Mockup URL not ready, waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`Background attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        const delay = Math.min(2000 * Math.pow(1.5, attempt - 1), 30000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.log(`Background: Mockup URL not available after ${maxRetries} attempts for template ${templateId}`);
}

// Helper function to create or get user
async function createOrGetUser(user: any): Promise<string | null> {
  if (!user || !user.name || !user.email) {
    return null;
  }

  try {
    // First, check if user already exists by email
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no rows found

    if (checkError) {
      console.error("Error checking for existing user:", checkError);
      throw checkError;
    }

    if (existingUser) {
      // User already exists, return their ID
      console.log("Using existing user:", existingUser.id);
      return existingUser.id;
    }

    // User doesn't exist, create new user
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        name: user.name,
        email: user.email,
        created_at: user.timestamp || new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      throw createError;
    }

    if (!newUser || !newUser.id) {
      throw new Error("User created but no ID returned");
    }

    console.log("Created new user:", newUser.id);
    return newUser.id;
  } catch (error: any) {
    console.error("Error in createOrGetUser:", error);
    throw new Error(`User operation failed: ${error.message}`);
  }
}

const POLLING_INTERVAL = 3000; // 3 seconds
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;

async function pollAndCreateShopifyProduct(productId:any,templateId:any,taskKey:any, variantIds = []) {
  const statusUrl = `${PRINTFUL_API_BASE}/mockup-generator/task?task_key=${taskKey}`;

  while (true) {
    await new Promise((res) => setTimeout(res, POLLING_INTERVAL));

    try {
      const response = await fetch(statusUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PRINTFUL_API_KEY}`,
          "X-PF-Store-Id": STORE_ID,
        },
      });

      const data = await response.json();
      const status = data?.result?.status;

      if (status === "completed") {
        console.log(`✅ Task ${taskKey} completed. Proceeding to create Shopify product.`);

        // Get the mockup result
        const mockupRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/mockup-result/${taskKey}`);
        const mockupData = await mockupRes.json();

        const images = [
          ...new Set(
            mockupData.mockups.flatMap((mockup:any) => [
              mockup.mockup_url,
              ...(mockup.extra?.map((img:any) => img.url) || []),
            ])
          ),
        ];

        // Call Shopify product API
        const shopifyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shopify/product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: productId,
            images,
            edmTemplateId: templateId,
            availableVariantIds: variantIds,
          }),
        });

        const shopifyData = await shopifyRes.json();

        if (!shopifyRes.ok || shopifyData.productCreate?.userErrors?.length > 0) {
          console.error("❌ Failed to create Shopify product:", shopifyData);
        } else {
          console.log("✅ Shopify product created:", shopifyData.productCreate.product);
        }

        return;
      }

      if (status === "failed") {
        console.error(`❌ Task ${taskKey} failed.`);
        return;
      }

      console.log(`⏳ Task ${taskKey} still pending...`);

    } catch (err) {
      console.error(`⚠️ Error while polling task ${taskKey}:`, err);
    }
  }
}
