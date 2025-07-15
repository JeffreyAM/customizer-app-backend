import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const allowedOrigin = 'https://fqvyxf-a8.myshopify.com'; // your Shopify store

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const token = segments[segments.length - 1];

  if (!token) {
    return new NextResponse(JSON.stringify({ error: 'Token is required' }), {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Content-Type': 'application/json'
      }
    });
  }

  const { data, error } = await supabase
    .from('customizations')
    .select('*')
    .eq('id', token)
    .single();

  if (error || !data) {
    return new NextResponse(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Content-Type': 'application/json'
      }
    });
  }

  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Content-Type': 'application/json'
    }
  });
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
