import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const documentSchema = z.object({
  tutor_id:      z.string().uuid("Invalid tutor profile ID"),
  document_type: z.string().min(1, "Document type is required"),
  file_url:      z.string().url("Invalid file URL"),
  file_name:     z.string().min(1, "File name is required"),
});

// ── GET — list own documents (private — only file_name and status, not URL) ───

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!tp) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // Return document metadata — never return file_url to client
  const { data: documents, error } = await supabase
    .from("tutor_documents")
    .select(
      "id, document_type, file_name, status, admin_notes, uploaded_at, reviewed_at"
      // Intentionally omitting file_url — never expose storage URLs to the browser
    )
    .eq("tutor_id", tp.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch documents." }, { status: 500 });
  }

  return NextResponse.json({ data: documents });
}

// ── POST — create document record after client-side upload to Storage ─────────

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profileRow || profileRow.role !== "tutor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = documentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 }
    );
  }

  // Verify the tutor_id belongs to this authenticated user
  const { data: tp } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("id", parsed.data.tutor_id)
    .eq("user_id", user.id)
    .single();

  if (!tp) {
    return NextResponse.json(
      { error: "Tutor profile not found or not authorised." },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("tutor_documents").insert({
    tutor_id:      tp.id,
    document_type: parsed.data.document_type,
    file_url:      parsed.data.file_url,    // stored in DB — never returned via API
    file_name:     parsed.data.file_name,
    status:        "pending",
  });

  if (error) {
    console.error("Document insert error:", error);
    return NextResponse.json(
      { error: "Failed to save document record." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

// ── DELETE — remove a pending document (only if not yet reviewed) ─────────────

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get("id");
  if (!docId) return NextResponse.json({ error: "Missing document ID" }, { status: 400 });

  // Verify ownership and that document is still pending (not yet reviewed)
  const { data: doc } = await supabase
    .from("tutor_documents")
    .select("id, status, tutor_profiles!inner(user_id)")
    .eq("id", docId)
    .single();

  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const tpRaw = doc.tutor_profiles as unknown;
  const tp    = (Array.isArray(tpRaw) ? tpRaw[0] : tpRaw) as { user_id: string } | null;

  if (tp?.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (doc.status !== "pending") {
    return NextResponse.json(
      { error: "Only pending documents can be deleted." },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("tutor_documents")
    .delete()
    .eq("id", docId);

  if (error) {
    return NextResponse.json({ error: "Failed to delete document." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
