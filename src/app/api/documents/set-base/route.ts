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

const STRUCTURING_PROMPTS: Record<DocumentType, string> = {
  icp: `Je krijgt ruwe input over een Ideale Klantprofiel (ICP). Structureer dit tot een professioneel, scanbaar document in markdown.

Gebruik EXACT deze structuur met secties:

# Ideale Klantprofiel (ICP)

## Samenvatting
> Een korte, krachtige omschrijving van de ideale klant in 2-3 zinnen.

## Demografie
| Kenmerk | Detail |
|---------|--------|
| Branche | ... |
| Bedrijfsgrootte | ... |
| Functietitel | ... |
| Locatie | ... |
| Omzet | ... |

## Top Pijnpunten
1. **Pijnpunt naam** — Korte uitleg
2. **Pijnpunt naam** — Korte uitleg
3. **Pijnpunt naam** — Korte uitleg

## Doelen & Motivaties
- **Doel**: Uitleg
- **Motivatie**: Uitleg

## Koopgedrag
- **Beslissingsproces**: ...
- **Budget**: ...
- **Tijdlijn**: ...
- **Beslissers**: ...

## Waar te vinden
- **Online**: kanalen, platforms
- **Offline**: events, netwerken

## Taal & Triggers
- **Woorden die ze gebruiken**: ...
- **Wat triggert actie**: ...

## Veelvoorkomende Bezwaren
1. Bezwaar + hoe te weerleggen
2. Bezwaar + hoe te weerleggen

Vul alles in op basis van de input. Als bepaalde info ontbreekt, zet dan "Nog te bepalen" maar behoud de structuur. Schrijf in het Nederlands.`,

  offer: `Je krijgt ruwe input over een Aanbod/Propositie. Structureer dit tot een professioneel, scanbaar document in markdown.

Gebruik EXACT deze structuur:

# Aanbod & Propositie

## Kernpropositie
> Eenduidig statement van wat je aanbiedt en welk probleem je oplost, in 2-3 zinnen.

## De Transformatie
| Van (zonder jou) | Naar (met jou) |
|-------------------|----------------|
| ... | ... |
| ... | ... |

## Wat je aanbiedt
### Pakket/Dienst naam
- **Wat het is**: ...
- **Voor wie**: ...
- **Resultaat**: ...
- **Tijdlijn**: ...

## Pricing
| Pakket | Prijs | Wat je krijgt |
|--------|-------|---------------|
| ... | ... | ... |

## Deliverables
- Deliverable 1
- Deliverable 2

## Bewezen Resultaten
- **Resultaat 1**: Concreet cijfer/uitkomst
- **Resultaat 2**: Concreet cijfer/uitkomst

## Waarom jij en niet de concurrent?
1. **Onderscheidend punt** — Uitleg
2. **Onderscheidend punt** — Uitleg

Vul alles in op basis van de input. Als info ontbreekt, zet "Nog te bepalen". Schrijf in het Nederlands.`,

  positioning: `Je krijgt ruwe input over Positionering. Structureer dit tot een professioneel, scanbaar document in markdown.

Gebruik EXACT deze structuur:

# Positionering

## Positioneringsstatement
> "Voor [doelgroep] die [probleem heeft], is [jouw naam/bedrijf] de [categorie] die [unieke waarde biedt], in tegenstelling tot [alternatieven] die [hun aanpak]."

## Doelmarkt
- **Segment**: ...
- **Grootte**: ...
- **Trend**: ...

## Categorie & Framing
- **Hoe je jezelf noemt**: ...
- **In welk hokje je valt**: ...
- **Hoe je het reframed**: ...

## Onderscheidend Vermogen
| Jij | Concurrentie |
|-----|-------------|
| ... | ... |
| ... | ... |

## Concurrentielandschap
### Directe concurrenten
- **Concurrent 1**: Wat ze doen + hoe jij verschilt
- **Concurrent 2**: Wat ze doen + hoe jij verschilt

### Indirecte alternatieven
- Niets doen / zelf doen / andere oplossing

## Merkbelofte
> Wat beloof je altijd waar te maken?

## Bewijs
- Case study / testimonial / cijfer
- Case study / testimonial / cijfer

## Perceptie
| Hoe je gezien wilt worden | Hoe je nu gezien wordt |
|---------------------------|----------------------|
| ... | ... |

Vul in op basis van de input. Als info ontbreekt, zet "Nog te bepalen". Schrijf in het Nederlands.`,

  tone_of_voice: `Je krijgt ruwe input over Tone of Voice. Structureer dit tot een professioneel, scanbaar document in markdown.

Gebruik EXACT deze structuur:

# Tone of Voice

## Kernpersoonlijkheid
> 3-5 woorden die de communicatiestijl samenvatten, bijv: "Direct, warm, no-nonsense"

## Stemkarakteristieken
| Dimensie | Positie | Toelichting |
|----------|---------|-------------|
| Formeel ↔ Informeel | ... | ... |
| Serieus ↔ Speels | ... | ... |
| Bescheiden ↔ Zelfverzekerd | ... | ... |
| Emotioneel ↔ Rationeel | ... | ... |

## Woordkeuze
### Woorden die passen
- Woord 1, woord 2, woord 3...

### Woorden die NIET passen
- Woord 1, woord 2, woord 3...

## Voorbeeldzinnen
> "Voorbeeld van hoe deze persoon schrijft"
> "Nog een voorbeeld"
> "En nog een"

## Do's en Don'ts
| Do ✅ | Don't ❌ |
|-------|---------|
| ... | ... |
| ... | ... |
| ... | ... |

## Toon per Context
- **LinkedIn posts**: ...
- **Emails**: ...
- **DM's**: ...
- **Sales calls**: ...

## Inspiratiebronnen
- Persoon/merk met vergelijkbare stijl + waarom

Vul in op basis van de input. Als info ontbreekt, zet "Nog te bepalen". Schrijf in het Nederlands.`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.isNew) {
      const { clientId, type, title, content } = body;

      if (!clientId || !type || !content) {
        return NextResponse.json(
          { error: "clientId, type en content zijn verplicht" },
          { status: 400 }
        );
      }

      // Laat AI het document structureren
      const structuredContent = await structureDocument(type as DocumentType, content);

      const { data: doc, error } = await supabaseAdmin
        .from("documents")
        .insert({
          client_id: clientId,
          type,
          title,
          content: structuredContent,
          version: 1,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await supabaseAdmin.from("notifications").insert({
        user_id: clientId,
        message: `Je ${title} is ingesteld door je coach`,
        link: `/client/profile/${type}`,
        read: false,
      });

      return NextResponse.json({ document: doc, type: "new" });
    } else {
      const { documentId, content, reason } = body;

      if (!documentId || !content) {
        return NextResponse.json(
          { error: "documentId en content zijn verplicht" },
          { status: 400 }
        );
      }

      const { data: doc } = await supabaseAdmin
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (!doc) {
        return NextResponse.json(
          { error: "Document niet gevonden" },
          { status: 404 }
        );
      }

      // Laat AI het document structureren
      const structuredContent = await structureDocument(doc.type as DocumentType, content);

      await supabaseAdmin.from("document_suggestions").insert({
        document_id: documentId,
        suggested_content: structuredContent,
        reason: reason ?? "Basis-document geupload door admin",
        source_type: "upload",
        source_id: null,
        status: "pending",
      });

      await supabaseAdmin.from("notifications").insert({
        user_id: doc.client_id,
        message: `Er is een nieuw basis-document voorgesteld voor je ${doc.title}`,
        link: `/client/profile/${doc.type}`,
        read: false,
      });

      return NextResponse.json({ type: "suggestion" });
    }
  } catch (error: any) {
    console.error("Set base error:", error);
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

async function structureDocument(type: DocumentType, rawContent: string): Promise<string> {
  const prompt = STRUCTURING_PROMPTS[type];
  if (!prompt) return rawContent;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      thinking: {
        type: "enabled",
        budget_tokens: 6000,
      },
      system: "Je bent een expert in het structureren van documenten. Maak professionele, scanbare documenten in markdown. Schrijf altijd in het Nederlands. Behoud alle originele informatie maar structureer het in het gevraagde formaat.",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\n---\n\nRUWE INPUT:\n\n${rawContent}`,
        },
      ],
    });

    for (const block of response.content) {
      if (block.type === "text") {
        return block.text;
      }
    }
  } catch (error) {
    console.error("AI structuring failed, using raw content:", error);
  }

  return rawContent;
}
