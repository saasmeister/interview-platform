import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { DOCUMENT_TYPES } from "@/lib/document-config";
import type { DocumentType } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: uploadId } = await params;

    // Haal de upload op
    const { data: upload, error: uploadError } = await supabaseAdmin
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .single();

    if (uploadError || !upload) {
      return NextResponse.json(
        { error: "Upload niet gevonden" },
        { status: 404 }
      );
    }

    const docType = upload.document_type as DocumentType;
    const docConfig = DOCUMENT_TYPES[docType];

    if (!docConfig) {
      return NextResponse.json(
        { error: "Onbekend document type" },
        { status: 400 }
      );
    }

    // Haal het bestaande document op
    const { data: existingDoc } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("client_id", upload.client_id)
      .eq("type", docType)
      .single();

    // Download het bestand en extraheer content
    let fileContent = "";

    if (upload.file_type.startsWith("text/") ||
        upload.file_type === "application/json" ||
        upload.file_type.includes("csv")) {
      // Tekst-gebaseerde bestanden
      const response = await fetch(upload.file_url);
      fileContent = await response.text();
    } else if (upload.file_type.startsWith("image/")) {
      // Afbeeldingen — gebruik Claude's vision
      const response = await fetch(upload.file_url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mediaType = upload.file_type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

      const visionResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: `Beschrijf de inhoud van deze afbeelding in detail. Focus op informatie die relevant is voor een ${docConfig.title}. Schrijf in het Nederlands.`,
              },
            ],
          },
        ],
      });

      fileContent = visionResponse.content[0].type === "text"
        ? visionResponse.content[0].text
        : "";
    } else {
      // Onbekend bestandstype — gebruik beschrijving
      fileContent = `[Bestand: ${upload.file_name}]\n\nBeschrijving door klant: ${upload.description}`;
    }

    // Analyseer met Claude en genereer suggestie
    const currentContent = existingDoc?.content ?? "Nog geen document gegenereerd.";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      thinking: {
        type: "enabled",
        budget_tokens: 6000,
      },
      system: `Je bent een expert in het analyseren van informatie en het verbeteren van klantprofiel-documenten. Schrijf altijd in het Nederlands.`,
      messages: [
        {
          role: "user",
          content: `Hieronder staat het huidige ${docConfig.title} document van een klant, gevolgd door nieuwe informatie die de klant heeft gedeeld.

Analyseer de nieuwe informatie en genereer een VERBETERDE versie van het document. Integreer de nieuwe inzichten op de juiste plekken. Behoud alle bestaande informatie die nog relevant is.

---

HUIDIG DOCUMENT:
${currentContent}

---

NIEUWE INFORMATIE:
${fileContent}

${upload.description ? `\nKLANT NOTITIE: ${upload.description}` : ""}

---

Genereer de volledige verbeterde versie van het ${docConfig.title} document. Gebruik markdown formatting.`,
        },
      ],
    });

    let suggestedContent = "";
    for (const block of response.content) {
      if (block.type === "text") {
        suggestedContent = block.text;
        break;
      }
    }

    if (!suggestedContent) {
      return NextResponse.json(
        { error: "Geen suggestie gegenereerd" },
        { status: 500 }
      );
    }

    if (existingDoc) {
      // Maak suggestie aan
      await supabaseAdmin.from("document_suggestions").insert({
        document_id: existingDoc.id,
        suggested_content: suggestedContent,
        reason: `Nieuwe inzichten uit upload "${upload.file_name}"`,
        source_type: "upload",
        source_id: uploadId,
        status: "pending",
      });

      // Notificaties
      const { data: admins } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      const notifications = [
        {
          user_id: upload.client_id,
          message: `Nieuwe suggestie voor je ${docConfig.title} op basis van "${upload.file_name}"`,
          link: `/client/profile/${docType}`,
          read: false,
        },
        ...(admins ?? []).map((admin) => ({
          user_id: admin.id,
          message: `Nieuwe suggestie voor ${docConfig.title} van klant op basis van upload`,
          link: `/admin/clients/${upload.client_id}/profile`,
          read: false,
        })),
      ];

      await supabaseAdmin.from("notifications").insert(notifications);
    } else {
      // Maak nieuw document aan
      await supabaseAdmin.from("documents").insert({
        client_id: upload.client_id,
        type: docType,
        title: docConfig.title,
        content: suggestedContent,
        version: 1,
      });
    }

    // Markeer upload als verwerkt
    await supabaseAdmin
      .from("uploads")
      .update({ processed: true })
      .eq("id", uploadId);

    return NextResponse.json({
      message: "Upload verwerkt en suggestie aangemaakt",
      processed: true,
    });
  } catch (error: any) {
    console.error("Upload process error:", error);
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
