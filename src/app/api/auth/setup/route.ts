import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Haal het access token uit de Authorization header
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Geen token meegegeven" }, { status: 401 });
  }

  // Gebruik de admin client om de user te verifiëren via het token
  const supabaseAdmin = createAdminClient();
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Ongeldig token" }, { status: 401 });
  }

  // Check of profiel al bestaat
  const { data: existingList } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id);

  const existing = existingList?.[0];

  if (existing) {
    return NextResponse.json({
      redirect: existing.role === "admin" ? "/admin" : "/client",
    });
  }

  // Check placeholder profiel (aangemaakt door admin, met ander UUID)
  const { data: placeholderList } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("email", user.email?.toLowerCase() ?? "");

  const placeholder = placeholderList?.[0];

  if (placeholder) {
    await supabaseAdmin.from("profiles").delete().eq("id", placeholder.id);
    await supabaseAdmin.from("profiles").insert({
      id: user.id,
      email: user.email?.toLowerCase(),
      full_name:
        user.user_metadata?.full_name ?? user.user_metadata?.name ?? placeholder.full_name,
      avatar_url: user.user_metadata?.avatar_url ?? placeholder.avatar_url,
      role: placeholder.role,
    });
    await supabaseAdmin
      .from("assignments")
      .update({ client_id: user.id })
      .eq("client_id", placeholder.id);
    await supabaseAdmin
      .from("notifications")
      .update({ user_id: user.id })
      .eq("user_id", placeholder.id);

    return NextResponse.json({
      redirect: placeholder.role === "admin" ? "/admin" : "/client",
    });
  }

  // Geen profiel gevonden — zelf-registratie is niet toegestaan
  return NextResponse.json(
    { error: "Geen profiel gevonden. Registreren is alleen mogelijk via een uitnodigingslink." },
    { status: 403 }
  );
}
