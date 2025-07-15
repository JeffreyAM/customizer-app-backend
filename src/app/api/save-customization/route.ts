import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const allowedOrigin = 'https://fqvyxf-a8.myshopify.com'; // your Shopify store

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { color, message, font, shopify_product_id, token } = body;

    if (!color || !message || !font || !shopify_product_id) {
      return new NextResponse(JSON.stringify({ error: 'Missing fields' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Content-Type': 'application/json'
        }
      });
    }

    let result;
    if (token) {
        // Update existing customization
      result = await supabase
        .from('customizations')
        .update({ color, message, font, shopify_product_id })
        .eq('id', token)
        .select()
        .single();
    } else {
        // Insert new customization if no token is provided
      result = await supabase
        .from('customizations')
        .insert([{ color, message, font, shopify_product_id }])
        .select()
        .single();
    }

    if (result.error) {
      return new NextResponse(JSON.stringify({ error: result.error.message }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Content-Type': 'application/json'
        }
      });
    }

    return new NextResponse(JSON.stringify({ token: result.data.id }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Content-Type': 'application/json'
      }
    });
  }
}
