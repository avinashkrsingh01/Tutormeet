import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminProfile } from "@/lib/admin-auth";
import { hasPermission } from "@/types/admin";
import { z } from "zod";

const updateSchema = z.object({
  status:       z.enum(["submitted","acknowledged","investigating","resolved","closed"]).optional(),
  admin_notes:  z.string().optional().nullable(),
  resolution:   z.string().optional().nullable(),
});

interface RouteParams { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const admin   = await getAdminProfile();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(admin.admin_role, "respond_support_tickets")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any;

  const update: Record<string, unknown> = {
    assigned_to: admin.id,
  };
  if (parsed.data.status !== undefined)     update.status      = parsed.data.status;
  if (parsed.data.admin_notes !== undefined) update.admin_notes = parsed.data.admin_notes;
  if (parsed.data.resolution !== undefined)  update.resolution  = parsed.data.resolution;
  if (parsed.data.status === "resolved") {
    update.resolved_at = new Date().toISOString();
  }

  const { error } = await adminDb.from("safety_reports").update(update).eq("id", id);
  if (error) {
    console.error("[PATCH /api/admin/safety]", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
