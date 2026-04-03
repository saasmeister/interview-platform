import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { assignmentId, message, isStart, lang } = await request.json();
    const userLang = lang === "en" ? "en" : "nl";

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId is verplicht" },
        { status: 400 }
      );
    }

    // Haal assignment op met interview info
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("assignments")
      .select(`
        *,
        interview:interviews(*)
      `)
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Assignment niet gevonden" },
        { status: 404 }
      );
    }

    const interview = (assignment as any).interview;

    // Sla het user bericht op (als het geen start is)
    if (message && !isStart) {
      await supabaseAdmin.from("messages").insert({
        assignment_id: assignmentId,
        role: "user",
        content: message,
      });
    }

    // Update status naar in_progress
    if (assignment.status === "not_started") {
      await supabaseAdmin
        .from("assignments")
        .update({ status: "in_progress" })
        .eq("id", assignmentId);
    }

    // Haal alle berichten op voor context
    const { data: messages } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: true });

    // Bouw conversation history
    const conversationMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (messages && messages.length > 0) {
      for (const msg of messages) {
        conversationMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // Als het een start is, voeg een initieel user bericht toe
    if (isStart && conversationMessages.length === 0) {
      const startMessage = userLang === "en"
        ? "Hello, I'm ready to start the interview."
        : "Hallo, ik ben klaar om te beginnen met het interview.";

      conversationMessages.push({
        role: "user",
        content: startMessage,
      });

      await supabaseAdmin.from("messages").insert({
        assignment_id: assignmentId,
        role: "user",
        content: startMessage,
      });
    }

    // Systeem prompt met taal, formatting en voortgangsinstructies
    const langInstruction = userLang === "en"
      ? "You MUST respond in English at all times."
      : "You MUST respond in Dutch (Nederlands) at all times.";

    const systemPrompt = `${interview.system_prompt}

IMPORTANT INSTRUCTIONS:
1. ${langInstruction}
2. Use ONLY plain text. No markdown formatting whatsoever: no **bold**, no *italic*, no bullet points (- or *), no headers (#), no code blocks. Just plain sentences and paragraphs.
3. Do NOT use any emojis or emoticons.
4. Add a progress tag at the END of every response in this format: [PROGRESS:XX] where XX is a number from 0 to 100 indicating interview completion percentage.
5. When the interview is complete, use [PROGRESS:100] and give a brief summary.
6. Ask one question at a time. Wait for the answer before asking the next question.
7. Be friendly, professional, and to-the-point.`;

    // Vraag Claude om te reageren
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 16000,
      thinking: {
        type: "enabled",
        budget_tokens: 32000,
      },
      system: systemPrompt,
      messages: conversationMessages,
    });

    // Extract text response
    let assistantMessage = "";
    for (const block of response.content) {
      if (block.type === "text") {
        assistantMessage = block.text;
        break;
      }
    }

    // Parse progress tag
    let progress = assignment.progress ?? 0;
    const progressMatch = assistantMessage.match(/\[PROGRESS:(\d+)\]/);
    if (progressMatch) {
      progress = parseInt(progressMatch[1], 10);
      assistantMessage = assistantMessage.replace(/\[PROGRESS:\d+\]/, "").trim();
    }

    // Sla assistant bericht op
    await supabaseAdmin.from("messages").insert({
      assignment_id: assignmentId,
      role: "assistant",
      content: assistantMessage,
    });

    // Update progress
    const isCompleted = progress >= 100;
    await supabaseAdmin
      .from("assignments")
      .update({
        progress,
        ...(isCompleted
          ? { status: "completed", completed_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", assignmentId);

    // Als het interview compleet is, genereer documenten
    if (isCompleted) {
      // Fire and forget — document generatie
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/documents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      }).catch(console.error);

      // Notificaties
      await supabaseAdmin.from("notifications").insert([
        {
          user_id: assignment.assigned_by,
          message: `Interview "${interview.title}" is afgerond door de klant.`,
          link: `/admin/assignments/${assignmentId}`,
          read: false,
        },
        {
          user_id: assignment.client_id,
          message: `Je hebt interview "${interview.title}" succesvol afgerond!`,
          link: `/client/interview/${assignmentId}`,
          read: false,
        },
      ]);
    }

    return NextResponse.json({
      message: assistantMessage,
      progress,
      isCompleted,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
