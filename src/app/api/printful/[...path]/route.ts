import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const PRINTFUL_API_BASE = "https://api.printful.com";
const ALLOWED_ORIGIN = "https://customized-girl-edm.myshopify.com";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(req, params.path.join("/"), "GET");
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(req, params.path.join("/"), "POST");
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(req, params.path.join("/"), "PUT");
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
    return proxyRequest(req, params.path.join("/"), "DELETE");
}

async function proxyRequest(req: NextRequest, subpath: string, method: string) {
    const apiKey = process.env.PRINTFUL_API_KEY || 'xyD86qYWF2lZKRUdbOCfelfw8V4OX3Nd0zYnIipf';

    const targetUrl = `${PRINTFUL_API_BASE}/${subpath}${req.nextUrl.search}`;
    const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
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
            headers: {
                'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
                'Content-Type': 'application/json',
            },
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: "Proxy error", details: err.message },
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
