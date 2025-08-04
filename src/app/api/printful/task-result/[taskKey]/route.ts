// /app/api/printful/task-result/[taskKey]/route.ts
import { NextRequest } from "next/server";

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY!;

export async function GET(
  req: NextRequest,
  { params }: { params: { taskKey: string } }
) {
  const { taskKey } = params;

  try {
    const res = await fetch(
      `https://api.printful.com/mockup-generator/task/${taskKey}`,
      {
        headers: {
          Authorization: `Bearer ${PRINTFUL_API_KEY}`,
        },
      }
    );

    if (!res.ok) {
      const error = await res.json();
      return new Response(
        JSON.stringify({
          error: error.message || "Failed to fetch task result",
        }),
        { status: res.status }
      );
    }

    const data = await res.json();

    return Response.json({
      status: data.result?.status,
      mockups: data.result?.mockups,
      printfiles: data.result?.printfiles,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
