import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const allowedOrigin = 'https://fqvyxf-a8.myshopify.com'; // Harcodedcoded for testing purposes

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_FRONTEND_URL || allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export async function POST(req: Request) {
    const body = await req.json();
    const { color, message, font, shopify_product_id, token } = body;
  
    if (!color || !message || !font || !shopify_product_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
  
    try {
      let result;
      if (token) {
        result = await supabase
          .from('customizations')
          .update({ color, message, font, shopify_product_id })
          .eq('id', token)
          .select()
          .single();
      } else {
        result = await supabase
          .from('customizations')
          .insert([{ color, message, font, shopify_product_id }])
          .select()
          .single();
      }
  
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }
  
      return new NextResponse(JSON.stringify({ token: result.data.id }), {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Content-Type': 'application/json',
        }
      });
    } catch (err) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }
