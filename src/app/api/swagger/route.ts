import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { generateSwaggerSpec } from "../../../swagger";

export async function GET() {
  if (process.env.NODE_ENV === "development") {
    // Runtime generation in dev
    return NextResponse.json(generateSwaggerSpec());
  } else {
    // Static JSON in production
    const filePath = path.join(process.cwd(), "public", "swagger.json");
    const data = fs.readFileSync(filePath, "utf8");
    return new NextResponse(data, { headers: { "Content-Type": "application/json" } });
  }
}
