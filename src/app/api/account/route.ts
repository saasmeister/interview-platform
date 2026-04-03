import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PUT: wachtwoord en/of naam wijzigen
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const { newPassword, fullName } = await request.json();
    const supabaseAdmin = createAdminClient();

    // Wachtwoord wijzigen
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Wachtwoord moet minimaal 6 tekens zijn" },
          { status: 400 }
        );
      }

      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (pwError) {
        return NextResponse.json({ error: pwError.message }, { status: 500 });
      }
    }

    // Naam wijzigen
    if (fullName && fullName.trim()) {
      const { error: nameError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id);

      if (nameError) {
        return NextResponse.json({ error: nameError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
