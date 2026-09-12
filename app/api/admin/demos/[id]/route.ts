import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminProfile } from "@/lib/admin-auth";
import { hasPermission } from "@/types/admin";
import { z } from "zod";

const demoUpdateSchema = z.object({
  status:          z.enum(["requested","tutor_accepted","scheduled","completed","cancelled","no_show"]).optional(),
  scheduled_at:    z.string().optional(),
  delivery_method: z.enum(["home_visit","online","tutor_location"]).optional(),
  meeting_link:    z.string().url().optional().nullable(),
  venue_address:   z.string().optional().nullable(),
  admin_notes:     z.string().optional().nullable(),
  tutor_feedback:  z.string().optional().nullable(),
});

interface RouteParams { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const admin = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(admin.admin_role, "schedule_demos")) {
    return NextResponse.json({ error: "Forbidden — operations_admin or above required" }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = demoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any;

  // Build update payload
  const update: Record<string, unknown> = {};
  if (parsed.data.status)          update.status          = parsed.data.status;
  if (parsed.data.scheduled_at)    update.scheduled_at    = parsed.data.scheduled_at;
  if (parsed.data.delivery_method) update.delivery_method = parsed.data.delivery_method;
  if (parsed.data.meeting_link !== undefined)  update.meeting_link  = parsed.data.meeting_link;
  if (parsed.data.venue_address !== undefined) update.venue_address = parsed.data.venue_address;
  if (parsed.data.admin_notes   !== undefined) update.admin_notes   = parsed.data.admin_notes;
  if (parsed.data.tutor_feedback !== undefined) update.tutor_feedback = parsed.data.tutor_feedback;

  if (parsed.data.status === "scheduled") {
    update.scheduled_by = admin.id;
  }

  const { error } = await adminDb.from("demo_classes").update(update).eq("id", id);
  if (error) {
    console.error("[PATCH /api/admin/demos]", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  // Update match status when demo is scheduled
  if (parsed.data.status === "scheduled") {
    await adminDb
      .from("demo_classes")
      .select("match_id, requirement_id")
      .eq("id", id)
      .single()
      .then(async ({ data }: { data: { match_id: string | null; requirement_id: string } | null }) => {
        if (!data) return;
        if (data.match_id) {
          await adminDb.from("tutor_matches")
            .update({ match_status: "demo_scheduled" })
            .eq("id", data.match_id);
        }
        await adminDb.from("tuition_requirements")
          .update({ status: "demo_scheduled" })
          .eq("id", data.requirement_id)
          .in("status", ["matching","shortlisted"]);
      });
  }

  // Audit log
  if (parsed.data.status) {
    await adminDb.from("admin_action_logs").insert([{
      admin_id:    admin.id,
      action_type: parsed.data.status === "scheduled" ? "demo_scheduled"
                 : parsed.data.status === "cancelled"  ? "demo_cancelled"
                 : "demo_scheduled",
      target_id:   id,
      target_type: "demo",
      notes:       parsed.data.admin_notes ?? null,
      metadata:    { new_status: parsed.data.status, scheduled_at: parsed.data.scheduled_at },
    }]).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
