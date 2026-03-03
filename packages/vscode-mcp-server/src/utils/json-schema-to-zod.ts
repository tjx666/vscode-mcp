import { jsonSchemaToZod as convert } from "json-schema-to-zod";
import { z } from "zod";

export function jsonSchemaToZodShape(schema: Record<string, unknown>): z.ZodRawShape {
  const code = convert(schema, { module: "none", noImport: true });
  const zodSchema = new Function("z", `return ${code}`)(z) as z.ZodObject<z.ZodRawShape>;
  return zodSchema.shape;
}
