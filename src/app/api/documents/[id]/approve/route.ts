import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { suggestionId } = await request.json();
    const { id: documentId } = await params;

    if (!suggestionId) {
      return NextResponse.json(
        { error: "suggestionId is verplicht" },
        { status: 400 }
      );
    }

    // Haal de suggestie op
    const { data: suggestion, error: suggestionError } = await supabaseAdmin
      .from("document_suggestions")
      .select("*")
      .eq("id", suggestionId)
      .eq("document_id", documentId)
      .single();

    if (suggestionError || !suggestion) {
      return NextResponse.json(
        { error: "Suggestie niet gevonden" },
        { status: 404 }
      );
    }

    // Haal het document op
    const { data: document } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (!document) {
      return NextResponse.json(
        { error: "Document niet gevonden" },
        { status: 404 }
      );
    }

    // Update het document met de nieuwe content
    await supabaseAdmin
      .from("documents")
      .update({
        content: suggestion.suggested_content,
        version: document.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    // Markeer de suggestie als goedgekeurd
    await supabaseAdmin
      .from("document_suggestions")
      .update({ status: "approved" })
      .eq("id", suggestionId);

    // Stuur notificatie
    await supabaseAdmin.from("notifications").insert({
      user_id: document.client_id,
      message: `Je ${document.title} is bijgewerkt naar versie ${document.version + 1}`,
      link: `/client/profile/${document.type}`,
      read: false,
    });

    return NextResponse.json({
      message: "Suggestie goedgekeurd en document bijgewerkt",
      newVersion: document.version + 1,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
