import { eq } from "drizzle-orm";
import { db, databaseConfigured } from "@/db";
import { directoryCategories } from "@/db/schema";
import { ensureSeed, recordCategoryHit } from "@/lib/directory";
import { apiError, InputError, objectInput } from "@/lib/inputs";
import { sameOrigin } from "@/lib/auth";
import { cleanText, rateLimit } from "@/lib/validation";

export const dynamic = "force-dynamic";

// Anonymous usage counter behind «أهم مهن القرية»: one row per specialty, no personal data.
// The client de-duplicates per session; the server rate-limits per IP.
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new InputError("طلب غير مسموح.", 403);
    if (rateLimit(request, "hits", 240)) return new Response(null, { status: 204 });
    if (!databaseConfigured) return new Response(null, { status: 204 });
    const body = objectInput(await request.json());
    const categoryId = cleanText(body.categoryId ?? "", 60);
    const kind = body.kind === "contact" ? "contact" : "view";
    if (!categoryId) return new Response(null, { status: 204 });
    await ensureSeed();
    const [category] = await db.select({ id: directoryCategories.id, parentId: directoryCategories.parentId }).from(directoryCategories).where(eq(directoryCategories.id, categoryId)).limit(1);
    if (!category?.parentId) return new Response(null, { status: 204 });
    await recordCategoryHit(category.id, kind);
    return new Response(null, { status: 204 });
  } catch (error) { return apiError(error); }
}
