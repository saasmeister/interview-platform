import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET: valideer een invitation token
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token ontbreekt" }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name, invitation_used")
    .eq("invitation_token", token)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  }

  if (profile.invitation_used) {
    return NextResponse.json({ error: "already_used" }, { status: 400 });
  }

  return NextResponse.json({
    email: profile.email,
    fullName: profile.full_name,
  });
}

// POST: verwerk uitnodiging - maak Supabase auth user aan en koppel profiel
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token en wachtwoord zijn verplicht" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Wachtwoord moet minimaal 6 tekens zijn" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Haal placeholder profiel op via token
    const { data: placeholder, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("invitation_token", token)
      .single();

    if (fetchError || !placeholder) {
      return NextResponse.json({ error: "invalid_token" }, { status: 404 });
    }

    if (placeholder.invitation_used) {
      return NextResponse.json({ error: "already_used" }, { status: 400 });
    }

    // Maak Supabase auth user aan met email + wachtwoord
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: placeholder.email,
        password: password,
        email_confirm: true, // Bevestig email direct (geen verificatie nodig)
      });

    if (authError) {
      // Als de user al bestaat in auth, geef een duidelijke melding
      if (authError.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "Er bestaat al een account met dit emailadres. Probeer in te loggen." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const authUser = authData.user;

    // Verwijder placeholder profiel en maak nieuw aan met auth ID
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", placeholder.id);

    await supabaseAdmin.from("profiles").insert({
      id: authUser.id,
      email: placeholder.email,
      full_name: placeholder.full_name,
      avatar_url: null,
      role: placeholder.role,
      invitation_token: token,
      invitation_used: true,
    });

    // Update assignments en notificaties naar nieuw ID
    await supabaseAdmin
      .from("assignments")
      .update({ client_id: authUser.id })
      .eq("client_id", placeholder.id);

    await supabaseAdmin
      .from("notifications")
      .update({ user_id: authUser.id })
      .eq("user_id", placeholder.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
