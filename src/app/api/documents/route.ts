import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is verplicht" },
        { status: 400 }
      );
    }

    // Haal alle documenten op voor deze klant, met pending suggesties count
    const { data: documents, error } = await supabaseAdmin
      .from("documents")
      .select(`
        *,
        suggestions:document_suggestions(*)
      `)
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: documents ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
