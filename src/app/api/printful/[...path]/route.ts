import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PRINTFUL_API_BASE = process.env.NEXT_PRINTFUL_BASE_API_URL;
const ALLOWED_ORIGINS = [
  'https://customized-girl-edm.myshopify.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function getRequestOrigin(req: NextRequest): string {
  const origin = req.headers.get('origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}


export async function GET(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyRequest(req, params.path.join('/'), 'GET');
}

export async function POST(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyRequest(req, params.path.join('/'), 'POST');
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyRequest(req, params.path.join('/'), 'PUT');
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyRequest(req, params.path.join('/'), 'DELETE');
}

export async function OPTIONS(req: NextRequest) {
  const origin = getRequestOrigin(req);

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}


async function proxyRequest(req: NextRequest, subpath: string, method: string) {
  const apiKey =
    process.env.PRINTFUL_API_KEY ||
    'xyD86qYWF2lZKRUdbOCfelfw8V4OX3Nd0zYnIipf';

  const targetUrl = `${PRINTFUL_API_BASE}/${subpath}${req.nextUrl.search}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const data = ['POST', 'PUT'].includes(method) ? await req.json() : undefined;

    const response = await axios.request({
      url: targetUrl,
      method,
      headers,
      data,
      validateStatus: () => true,
    });

    return NextResponse.json(response.data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': getRequestOrigin(req),
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Proxy error', details: err.message },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': getRequestOrigin(req),
          'Content-Type': 'application/json',
        },
      }
    );
  }
}