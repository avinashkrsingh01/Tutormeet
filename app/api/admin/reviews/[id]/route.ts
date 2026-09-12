import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminProfile } from "@/lib/admin-auth";
import { hasPermission } from "@/types/admin";
import { z } from "zod";

const reviewUpdateSchema = z.object({
  status:       z.enum(["pending","published","hidden","reported","investigating"]).optional(),
  admin_notes:  z.string().optional().nullable(),
});

interface RouteParams { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(admin.admin_role, "moderate_reviews")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = reviewUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any;

  const update: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) {
    update.status       = parsed.data.status;
    update.is_published = parsed.data.status === "published";
  }
  if (parsed.data.admin_notes !== undefined) {
    update.admin_notes = parsed.data.admin_notes;
  }
  update.moderated_by = admin.id;
  update.moderated_at = new Date().toISOString();

  const { error } = await adminDb.from("reviews").update(update).eq("id", id);
  if (error) {
    console.error("[PATCH /api/admin/reviews]", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  // If published, trigger rating recalculation via RPC or direct update
  if (parsed.data.status === "published") {
    const { data: rev } = await adminDb
      .from("reviews")
      .select("tutor_id")
      .eq("id", id)
      .single();

    if (rev?.tutor_id) {
      await adminDb.rpc("update_tutor_rating_manual", { p_tutor_id: rev.tutor_id })
        .catch(() => {/* trigger may handle automatically */});
    }
  }

  // Audit log
  const actionType = parsed.data.status === "published"  ? "review_approved"
                   : parsed.data.status === "hidden"      ? "review_rejected"
                   : "review_approved";

  await adminDb.from("admin_action_logs").insert([{
    admin_id:    admin.id,
    action_type: actionType,
    target_id:   id,
    target_type: "review",
    notes:       parsed.data.admin_notes ?? null,
    metadata:    { new_status: parsed.data.status },
  }]).catch(() => {});

  return NextResponse.json({ success: true });
}
