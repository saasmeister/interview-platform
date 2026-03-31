import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Email verzenden via Supabase Edge Functions of een externe service
// Voor nu loggen we de emails - je kunt dit later koppelen aan
// Resend, SendGrid, of Supabase Edge Functions
async function sendEmail(to: string, subject: string, body: string) {
  console.log(`📧 Email naar ${to}: ${subject}`);
  console.log(`   Body: ${body}`);

  // TODO: Koppel hier je email service aan, bijvoorbeeld:
  // await resend.emails.send({ from: process.env.EMAIL_FROM, to, subject, html: body });

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { type, assignmentId } = await request.json();

    // Haal assignment details op
    const { data: assignment } = await supabaseAdmin
      .from("assignments")
      .select(
        `
        *,
        interview:interviews(*),
        client:profiles!assignments_client_id_fkey(*),
        assigner:profiles!assignments_assigned_by_fkey(*)
      `
      )
      .eq("id", assignmentId)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment niet gevonden" },
        { status: 404 }
      );
    }

    const interview = (assignment as any).interview;
    const client = (assignment as any).client;
    const assigner = (assignment as any).assigner;

    if (type === "assigned") {
      // Email naar klant: nieuw interview toegewezen
      await sendEmail(
        client.email,
        `Nieuw interview: ${interview.title}`,
        `Hallo ${client.full_name},\n\nEr is een nieuw interview aan je toegewezen: "${interview.title}".\n\n${interview.description}\n\nLog in om het interview te starten: ${process.env.NEXT_PUBLIC_APP_URL}/client\n\nMet vriendelijke groet,\nInterview Platform`
      );
    } else if (type === "completed") {
      // Email naar admin: interview afgerond
      await sendEmail(
        assigner.email,
        `Interview afgerond: ${interview.title}`,
        `Hallo ${assigner.full_name},\n\n${client.full_name} heeft het interview "${interview.title}" afgerond.\n\nBekijk het transcript: ${process.env.NEXT_PUBLIC_APP_URL}/admin/assignments/${assignmentId}\n\nMet vriendelijke groet,\nInterview Platform`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Notify API error:", error);
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
