import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const clientId = formData.get("clientId") as string;
    const documentType = formData.get("documentType") as string;
    const description = formData.get("description") as string;

    if (!file || !clientId || !documentType) {
      return NextResponse.json(
        { error: "file, clientId en documentType zijn verplicht" },
        { status: 400 }
      );
    }

    // Upload naar Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${clientId}/${Date.now()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("client-uploads")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload fout: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Genereer publieke URL
    const { data: urlData } = supabaseAdmin.storage
      .from("client-uploads")
      .getPublicUrl(fileName);

    // Maak upload record aan
    const { data: upload, error: insertError } = await supabaseAdmin
      .from("uploads")
      .insert({
        client_id: clientId,
        document_type: documentType,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: file.type,
        description: description ?? "",
        processed: false,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ upload });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is verplicht" },
        { status: 400 }
      );
    }

    const { data: uploads, error } = await supabaseAdmin
      .from("uploads")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ uploads: uploads ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
