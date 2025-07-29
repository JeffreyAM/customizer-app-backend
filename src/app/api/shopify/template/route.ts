import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const PRINTFUL_API_BASE = 'https://api.printful.com';
const ALLOWED_ORIGIN = 'https://customized-girl-edm.myshopify.com';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Helper function to create or get user
async function createOrGetUser(user: any): Promise<string | null> {
  if (!user || !user.name || !user.email) {
    return null;
  }

  try {
    // First, check if user already exists by email
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no rows found

    if (checkError) {
      console.error('Error checking for existing user:', checkError);
      throw checkError;
    }

    if (existingUser) {
      // User already exists, return their ID
      console.log('Using existing user:', existingUser.id);
      return existingUser.id;
    }

    // User doesn't exist, create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        name: user.name,
        email: user.email,
        created_at: user.timestamp || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    if (!newUser || !newUser.id) {
      throw new Error('User created but no ID returned');
    }

    console.log('Created new user:', newUser.id);
    return newUser.id;

  } catch (error: any) {
    console.error('Error in createOrGetUser:', error);
    throw new Error(`User operation failed: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      templateId,
      user,
      productId,
    } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const apiKey = process.env.PRINTFUL_API_KEY || 'xyD86qYWF2lZKRUdbOCfelfw8V4OX3Nd0zYnIipf';

    /* Comment out the mockup generation step for now
    const mockupGenResponse = await axios.request({
      url: `${PRINTFUL_API_BASE}/mockup-generator/create-task/${productId}`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-PF-Store-Id': 16414489,
      },
      data: {
        product_template_id: templateId
      },
      validateStatus: () => true,
    });

    if (mockupGenResponse.status !== 200) {
      return NextResponse.json(
        { error: 'Failed to create mockup from Printful', details: mockupGenResponse.data },
        {
          status: mockupGenResponse.status,
          headers: {
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Content-Type': 'application/json',
          },
        }
      );
    }*/

    // Fetch template data from Printful
    const templateResponse = await axios.get(
      `${PRINTFUL_API_BASE}/product-templates/${templateId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-PF-Store-Id': 16414489,
        },
        validateStatus: () => true,
      }
    );

    if (templateResponse.status !== 200) {
      return NextResponse.json(
        { error: 'Failed to fetch template from Printful', details: templateResponse.data },
        {
          status: templateResponse.status,
          headers: {
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const templateData = (templateResponse.data as any).result;

    // Extract relevant information
    const productTitle = templateData.title || 'Unknown Product';
    const variantOptions = templateData.variant_options || templateData.options || {};
    const imageUrl = templateData.mockup_file_url || null;

    // Create or get user ID - this MUST succeed if user data is provided
    let userId = null;
    if (user && user.name && user.email) {
      try {
        userId = await createOrGetUser(user);
        if (!userId) {
          throw new Error('Failed to create or retrieve user');
        }
      } catch (userError) {
        console.error('User creation/retrieval failed:', userError);
        return NextResponse.json(
          { error: 'Failed to create user', details: (userError as Error).message },
          {
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Save to database
    const { data: savedTemplate, error: dbError } = await supabase
      .from('templates')
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
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save template data', details: dbError.message },
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        template: savedTemplate,
        printfulData: templateData,
        userId: userId, // Include the user ID in the response
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error: any) {
    console.error('Template processing error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      {
      status: 500,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}