import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: document, error } = await supabaseAdmin
      .from("documents")
      .select(`
        *,
        suggestions:document_suggestions(*)
      `)
      .eq("id", id)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: "Document niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
