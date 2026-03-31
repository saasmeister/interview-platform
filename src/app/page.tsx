import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function Home({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  // Als er een auth code is, redirect naar de callback handler
  if (searchParams.code) {
    redirect(`/auth/callback?code=${searchParams.code}`);
  }

  const supabase = createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    redirect("/login");
  }

  if (!user) {
    redirect("/login");
  }

  // Haal profiel op via admin client (omzeilt RLS)
  const supabaseAdmin = createAdminClient();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/admin");
  } else if (profile?.role === "client") {
    redirect("/client");
  } else {
    // Geen profiel gevonden — dit zou niet moeten gebeuren
    // Maak er een aan als fallback
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const isFirstUser = (count ?? 0) === 0;

    const { error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email?.toLowerCase(),
        full_name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        role: isFirstUser ? "admin" : "client",
      });

    if (insertError) {
      console.error("Profiel aanmaken mislukt:", insertError);
    }

    redirect(isFirstUser ? "/admin" : "/client");
  }
}
