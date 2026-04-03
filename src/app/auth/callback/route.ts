import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  console.log("[Auth Callback] Code ontvangen:", code ? "ja" : "nee");

  if (code) {
    // Maak Supabase client direct in de route handler
    // zodat cookies correct gelezen en geschreven worden
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth Callback] Exchange error:", error.message);

      // Check of de user toevallig al ingelogd is
      const {
        data: { user: existingUser },
      } = await supabase.auth.getUser();

      if (existingUser) {
        console.log("[Auth Callback] User al ingelogd, redirect naar /");
        return NextResponse.redirect(`${origin}/`);
      }

      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("[Auth Callback] User:", user?.email);

    if (user) {
      const supabaseAdmin = createAdminClient();

      // 1. Check of er al een profiel bestaat met dit auth ID
      const { data: existingProfile, error: profileError } =
        await supabaseAdmin
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      console.log(
        "[Auth Callback] Bestaand profiel:",
        existingProfile?.role ?? "geen",
        profileError?.message ?? ""
      );

      if (existingProfile) {
        const redirectTo =
          existingProfile.role === "admin" ? "/admin" : "/client";
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }

      // 2. Check placeholder-profiel op email
      const { data: placeholderProfile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("email", user.email?.toLowerCase() ?? "")
        .single();

      if (placeholderProfile) {
        console.log(
          "[Auth Callback] Placeholder gevonden, koppelen aan auth account"
        );

        // Verwijder het oude placeholder profiel en maak een nieuw aan
        // met het juiste auth ID (UPDATE op primary key is niet altijd mogelijk)
        await supabaseAdmin
          .from("profiles")
          .delete()
          .eq("id", placeholderProfile.id);

        await supabaseAdmin.from("profiles").insert({
          id: user.id,
          email: user.email?.toLowerCase(),
          full_name:
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            placeholderProfile.full_name,
          avatar_url:
            user.user_metadata?.avatar_url ?? placeholderProfile.avatar_url,
          role: placeholderProfile.role,
        });

        // Update assignments en notificaties
        await supabaseAdmin
          .from("assignments")
          .update({ client_id: user.id })
          .eq("client_id", placeholderProfile.id);

        await supabaseAdmin
          .from("notifications")
          .update({ user_id: user.id })
          .eq("user_id", placeholderProfile.id);

        const redirectTo =
          placeholderProfile.role === "admin" ? "/admin" : "/client";
        return NextResponse.redirect(`${origin}${redirectTo}`);
      }

      // 3. Geen profiel gevonden — zelf-registratie is niet toegestaan
      console.log("[Auth Callback] Geen profiel gevonden, zelf-registratie geblokkeerd");
      // Verwijder de auth sessie zodat de onbekende gebruiker niet ingelogd blijft
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=no_profile`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
