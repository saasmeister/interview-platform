import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { DOCUMENT_TYPES, GENERATION_PROMPTS } from "@/lib/document-config";
import type { DocumentType } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALL_DOC_TYPES: DocumentType[] = ["icp", "offer", "positioning", "tone_of_voice"];

export async function POST(request: NextRequest) {
  try {
    const { assignmentId } = await request.json();

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId is verplicht" },
        { status: 400 }
      );
    }

    // Haal assignment op met interview en client info
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
    const specificDocType = interview.document_type as DocumentType | null;

    // Haal alle berichten op
    const { data: messages } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: true });

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        message: "Geen berichten gevonden",
        generated: false,
      });
    }

    // Bouw het transcript op
    const transcript = messages
      .map((msg) => `${msg.role === "user" ? "KLANT" : "INTERVIEWER"}: ${msg.content}`)
      .join("\n\n");

    // Bepaal welke document types we moeten checken
    if (specificDocType && DOCUMENT_TYPES[specificDocType]) {
      // Interview heeft een specifiek document type — genereer dat document
      await generateOrSuggestDocument(
        specificDocType,
        transcript,
        assignment.client_id,
        assignment.assigned_by,
        assignmentId,
        interview.title
      );

      return NextResponse.json({
        message: `${DOCUMENT_TYPES[specificDocType].title} gegenereerd`,
        generated: true,
        types: [specificDocType],
      });
    } else {
      // Geen specifiek type (bijv. wekelijks interview)
      // Scan het transcript op inzichten voor ALLE 4 documenten
      const results = await scanTranscriptForAllDocuments(
        transcript,
        assignment.client_id,
        assignment.assigned_by,
        assignmentId,
        interview.title
      );

      return NextResponse.json({
        message: "Transcript gescand op inzichten voor alle profiel-documenten",
        generated: true,
        types: results,
      });
    }
  } catch (error: any) {
    console.error("Document generation error:", error);
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

// Genereer een document voor een specifiek type
async function generateOrSuggestDocument(
  docType: DocumentType,
  transcript: string,
  clientId: string,
  adminId: string,
  assignmentId: string,
  interviewTitle: string
) {
  const docConfig = DOCUMENT_TYPES[docType];
  const generationPrompt = GENERATION_PROMPTS[docType];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    thinking: {
      type: "enabled",
      budget_tokens: 8000,
    },
    system: `Je bent een expert in het analyseren van interviewtranscripten en het genereren van gestructureerde documenten. Schrijf altijd in het Nederlands.`,
    messages: [
      {
        role: "user",
        content: `${generationPrompt}\n\n---\n\nINTERVIEW TRANSCRIPT:\n\n${transcript}`,
      },
    ],
  });

  let generatedContent = "";
  for (const block of response.content) {
    if (block.type === "text") {
      generatedContent = block.text;
      break;
    }
  }

  if (!generatedContent) return;

  // Check of er al een document bestaat
  const { data: existingDoc } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("client_id", clientId)
    .eq("type", docType)
    .single();

  if (existingDoc) {
    // Maak suggestie
    await supabaseAdmin.from("document_suggestions").insert({
      document_id: existingDoc.id,
      suggested_content: generatedContent,
      reason: `Nieuwe inzichten uit interview "${interviewTitle}"`,
      source_type: "interview",
      source_id: assignmentId,
      status: "pending",
    });
  } else {
    // Nieuw document
    await supabaseAdmin.from("documents").insert({
      client_id: clientId,
      type: docType,
      title: docConfig.title,
      content: generatedContent,
      version: 1,
      source_assignment_id: assignmentId,
    });
  }

  // Notificaties
  const notificationMessage = existingDoc
    ? `Nieuwe suggestie voor ${docConfig.title} op basis van interview "${interviewTitle}"`
    : `${docConfig.title} is gegenereerd op basis van interview "${interviewTitle}"`;

  await supabaseAdmin.from("notifications").insert([
    {
      user_id: adminId,
      message: notificationMessage,
      link: `/admin/clients/${clientId}/profile`,
      read: false,
    },
    {
      user_id: clientId,
      message: notificationMessage,
      link: `/client/profile/${docType}`,
      read: false,
    },
  ]);
}

// Scan een transcript op inzichten voor alle 4 profiel-documenten
async function scanTranscriptForAllDocuments(
  transcript: string,
  clientId: string,
  adminId: string,
  assignmentId: string,
  interviewTitle: string
): Promise<string[]> {
  // Vraag Claude om te analyseren welke documenten verbeterd kunnen worden
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    thinking: {
      type: "enabled",
      budget_tokens: 6000,
    },
    system: `Je bent een expert in het analyseren van gesprekken. Analyseer het transcript en bepaal welke van de volgende profiel-documenten relevante nieuwe inzichten bevatten:

1. icp - Ideale Klantprofiel (info over hun doelklant, demografie, pijnpunten)
2. offer - Aanbod & Propositie (info over hun product/dienst, pricing, waardepropositie)
3. positioning - Positionering (info over marktpositie, concurrentie, onderscheidend vermogen)
4. tone_of_voice - Tone of Voice (info over communicatiestijl, woordkeuze, persoonlijkheid)

Antwoord ALLEEN met een JSON array van de types die relevante nieuwe inzichten bevatten, bijv: ["icp", "tone_of_voice"]
Als er geen relevante inzichten zijn, antwoord met: []`,
    messages: [
      {
        role: "user",
        content: `TRANSCRIPT:\n\n${transcript}`,
      },
    ],
  });

  let analysisText = "";
  for (const block of response.content) {
    if (block.type === "text") {
      analysisText = block.text;
      break;
    }
  }

  // Parse de JSON array
  let relevantTypes: DocumentType[] = [];
  try {
    const match = analysisText.match(/\[.*\]/s);
    if (match) {
      const parsed = JSON.parse(match[0]);
      relevantTypes = parsed.filter((t: string) => ALL_DOC_TYPES.includes(t as DocumentType));
    }
  } catch {
    console.error("Failed to parse analysis:", analysisText);
    return [];
  }

  if (relevantTypes.length === 0) return [];

  // Voor elk relevant type, genereer een suggestie
  for (const docType of relevantTypes) {
    // Check of er een bestaand document is
    const { data: existingDoc } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .eq("type", docType)
      .single();

    // Alleen suggesties maken als er al een document bestaat
    // (anders heeft een suggestie geen zin)
    if (!existingDoc) continue;

    const docConfig = DOCUMENT_TYPES[docType];

    const improvementResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      thinking: {
        type: "enabled",
        budget_tokens: 6000,
      },
      system: `Je bent een expert in het verbeteren van klantprofiel-documenten. Schrijf altijd in het Nederlands.`,
      messages: [
        {
          role: "user",
          content: `Hieronder staat het huidige ${docConfig.title} document, gevolgd door een nieuw interviewtranscript.

Integreer relevante nieuwe inzichten uit het transcript in het document. Behoud alle bestaande informatie die nog relevant is. Verbeter en verfijn waar mogelijk.

---

HUIDIG DOCUMENT:
${existingDoc.content}

---

NIEUW TRANSCRIPT:
${transcript}

---

Genereer de volledige verbeterde versie van het ${docConfig.title} document. Gebruik markdown formatting.`,
        },
      ],
    });

    let improvedContent = "";
    for (const block of improvementResponse.content) {
      if (block.type === "text") {
        improvedContent = block.text;
        break;
      }
    }

    if (!improvedContent) continue;

    // Maak suggestie aan
    await supabaseAdmin.from("document_suggestions").insert({
      document_id: existingDoc.id,
      suggested_content: improvedContent,
      reason: `Nieuwe inzichten gevonden in wekelijks interview "${interviewTitle}"`,
      source_type: "interview",
      source_id: assignmentId,
      status: "pending",
    });

    // Notificaties
    await supabaseAdmin.from("notifications").insert([
      {
        user_id: adminId,
        message: `Nieuwe inzichten voor ${docConfig.title} uit interview "${interviewTitle}"`,
        link: `/admin/clients/${clientId}/profile`,
        read: false,
      },
      {
        user_id: clientId,
        message: `We hebben nieuwe inzichten gevonden voor je ${docConfig.title}. Wil je het document bijwerken?`,
        link: `/client/profile/${docType}`,
        read: false,
      },
    ]);
  }

  return relevantTypes;
}
