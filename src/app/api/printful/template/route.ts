import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from "@/lib/supabase"; 
import { createShopifyProduct } from '@/helpers/create-product';

const PRINTFUL_API_BASE = process.env.NEXT_PRINTFUL_BASE_API_URL; 
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
    const templateFromBackendResponse = await fetch(`${PRINTFUL_API_BASE}/api/printful/template/${templateId}`);

    if (!templateFromBackendResponse.ok) {
      const errorData = await templateFromBackendResponse.json();
      return NextResponse.json(
        { error: "Failed to create template", details: (errorData as Error).message },
        {
          status: 500,
        }
      );
    }

    const templateFromBackend = await templateFromBackendResponse.json();

    const variantIds = (templateFromBackend.template.variant_options || []).filter(
        (id: number) => typeof id === "number" && !isNaN(id)
      );

      const placement = templateData.placements?.[0]?.placement || "front";

      const files = [
        {
          placement,
          image_url: templateFromBackend.template.image_url,
          position: {
            area_width: 1800,
            area_height: 2400,
            width: 1800,
            height: 2400,
            top: 0,
            left: 0,
          },
        },
      ];

    const createMockUpResponse = await fetch(`${PRINTFUL_API_BASE}/api/printful/mockup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_id: templateFromBackend.template.id,
        product_template_id: templateFromBackend.template.template_id,
        catalog_product_id: productId,
        variant_ids: variantIds,
      }),
    });

    const createMockUp = await createMockUpResponse.json();

    if (createMockUp.ok && createMockUp.task) {
      console.log(`Mockup task created! Task ID: ${createMockUp.task.task_key}`);
    } else {
      console.error(`Failed to create mockup: ${createMockUp.error || "Unknown error"}`);
    }

    const mockupResultResponse = await fetch(`${PRINTFUL_API_BASE}/api/mockup-result/${createMockUp.task?.task_key}`);

    if (!mockupResultResponse.ok) {
      throw new Error(`Failed to fetch mockup result: ${mockupResultResponse.statusText}`);
    }

    const mockupResult = (await mockupResultResponse.json()) as {
      mockups: {
        mockup_url: string;
        extra?: { url: string }[];
      }[];
    };

    // Safely extract image URLs
    const getMockupImages = (): string[] => {
      if (!mockupResult || !mockupResult.mockups) return [];

      return [
        ...new Set(
          mockupResult.mockups.flatMap((mockup) => [
            mockup.mockup_url,
            ...(mockup.extra?.map((img) => img.url) || []),
          ])
        ),
      ];
    };

    const shopifyImgs = getMockupImages();
    // console.log("Mockup Images:", imageUrls);


// You can now return or use templateData as needed


    // const shopifyImgs = imageUrls || "https://placehold.co/600x600.png"; // Fallback image if no mockup URL available

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
        shopifyProduct: createProduct.productCreate.product || createProduct,
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