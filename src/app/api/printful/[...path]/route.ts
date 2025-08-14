//api/printful/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from "axios"; 

const PRINTFUL_API_BASE = process.env.NEXT_PRINTFUL_BASE_API_URL;
const STORE_ID = process.env.PRINTFUL_STORE_ID!;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

/**
 * @openapi
 * /api/printful/{path}:
 *   get:
 *     summary: Proxy GET request to Printful
 *     tags: ["External/Printful Proxy"]
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         description: Printful API subpath, e.g. `orders` or `products/123`
 *         schema:
 *           type: string
 *       - in: query
 *         name: any
 *         required: false
 *         description: Any query parameters supported by Printful
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful Printful response
 *       500:
 *         description: Proxy error
 *   post:
 *     summary: Proxy POST request to Printful
 *     tags: ["External/Printful Proxy"]
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         description: Printful API subpath
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Successful Printful response
 *       500:
 *         description: Proxy error
 *   put:
 *     summary: Proxy PUT request to Printful
 *     tags: ["External/Printful Proxy"]
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         description: Printful API subpath
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Successful Printful response
 *       500:
 *         description: Proxy error
 *   delete:
 *     summary: Proxy DELETE request to Printful
 *     tags: ["External/Printful Proxy"]
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         description: Printful API subpath
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful Printful response
 *       500:
 *         description: Proxy error
 */

export async function GET(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyRequest(req, params.path.join("/"), "GET");
}

export async function POST(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyRequest(req, params.path.join("/"), "POST");
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyRequest(req, params.path.join("/"), "PUT");
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  return proxyRequest(req, params.path.join("/"), "DELETE");
}

async function proxyRequest(req: NextRequest, subpath: string, method: string) {
  const apiKey = process.env.PRINTFUL_API_KEY || "xyD86qYWF2lZKRUdbOCfelfw8V4OX3Nd0zYnIipf";

  const targetUrl = `${PRINTFUL_API_BASE}/${subpath}${req.nextUrl.search}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-PF-Store-ID": STORE_ID ,
  };

  try {
    const data = ["POST", "PUT"].includes(method) ? await req.json() : undefined;

    const response = await axios.request({
      url: targetUrl,
      method,
      headers,
      data,
      validateStatus: () => true,
    });

    return NextResponse.json(response.data, {
      status: response.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Proxy error", details: err.message },
      {
        status: 500,
      }
    );
  }
}