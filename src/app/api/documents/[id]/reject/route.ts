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
    const { id: _documentId } = await params;
    const { suggestionId } = await request.json();

    if (!suggestionId) {
      return NextResponse.json(
        { error: "suggestionId is verplicht" },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from("document_suggestions")
      .update({ status: "rejected" })
      .eq("id", suggestionId)
      .eq("document_id", params.id);

    return NextResponse.json({ message: "Suggestie afgewezen" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
