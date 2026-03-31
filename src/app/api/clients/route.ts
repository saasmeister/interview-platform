import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, fullName } = await request.json();

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Email en naam zijn verplicht" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Check of er al een profiel bestaat met dit email
    const { data: existingList } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email);

    if (existingList && existingList.length > 0) {
      return NextResponse.json(
        { error: "Er bestaat al een gebruiker met dit emailadres" },
        { status: 400 }
      );
    }

    // Maak een "placeholder" profiel aan.
    // Als de klant later inlogt met Google (met hetzelfde email),
    // koppelen we het Supabase auth account aan dit profiel.
    // Voor nu maken we een profiel aan met een tijdelijk UUID.
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: crypto.randomUUID(),
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        avatar_url: null,
        role: "client",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
