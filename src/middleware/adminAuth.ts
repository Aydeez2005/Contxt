import type { Context, Next } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { organizations } from "../db/schema.ts";

export async function adminAuth(c: Context, next: Next) {
  const slug = c.req.param("slug");
  if (!slug) return await next();

  const auth = c.req.header("Authorization");
  const token = auth?.replace("Bearer ", "").trim();
  if (!token) return c.json({ error: "Authorization required." }, 401);

  const [org] = await db
    .select({ id: organizations.id, adminToken: organizations.adminToken })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (!org || org.adminToken !== token) {
    return c.json({ error: "Invalid token." }, 401);
  }

  await next();
}
