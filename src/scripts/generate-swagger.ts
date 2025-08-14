import fs from "fs";
import path from "path";
import { generateSwaggerSpec } from "../swagger";

const filePath = path.join(process.cwd(), "public", "swagger.json");
fs.writeFileSync(filePath, JSON.stringify(generateSwaggerSpec(), null, 2));
console.log(`Swagger JSON written to ${filePath}`);
