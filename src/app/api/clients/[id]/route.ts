import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email, fullName } = await request.json();

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Email en naam zijn verplicht" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Check of het profiel bestaat
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Klant niet gevonden" },
        { status: 404 }
      );
    }

    // Check of email al in gebruik is door iemand anders
    const { data: emailCheck } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .neq("id", id);

    if (emailCheck && emailCheck.length > 0) {
      return NextResponse.json(
        { error: "Dit emailadres is al in gebruik door een andere gebruiker" },
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseAdmin = createAdminClient();

    // Check of het profiel bestaat en een client is
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Klant niet gevonden" },
        { status: 404 }
      );
    }

    if (existing.role !== "client") {
      return NextResponse.json(
        { error: "Kan alleen klanten verwijderen" },
        { status: 400 }
      );
    }

    // Verwijder gerelateerde data in de juiste volgorde
    // 1. Haal assignments op
    const { data: assignments } = await supabaseAdmin
      .from("assignments")
      .select("id")
      .eq("client_id", id);

    // 2. Verwijder berichten van alle assignments
    if (assignments && assignments.length > 0) {
      const assignmentIds = assignments.map((a) => a.id);
      await supabaseAdmin
        .from("messages")
        .delete()
        .in("assignment_id", assignmentIds);
    }

    // 3. Verwijder assignments
    await supabaseAdmin.from("assignments").delete().eq("client_id", id);

    // 4. Verwijder notificaties
    await supabaseAdmin.from("notifications").delete().eq("user_id", id);

    // 5. Verwijder documenten en suggesties
    const { data: documents } = await supabaseAdmin
      .from("documents")
      .select("id")
      .eq("client_id", id);

    if (documents && documents.length > 0) {
      const documentIds = documents.map((d) => d.id);
      await supabaseAdmin
        .from("document_suggestions")
        .delete()
        .in("document_id", documentIds);
    }

    await supabaseAdmin.from("documents").delete().eq("client_id", id);

    // 6. Verwijder uploads
    await supabaseAdmin.from("uploads").delete().eq("client_id", id);

    // 7. Verwijder het profiel zelf
    const { error } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
