import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { DocumentType } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STRUCTURE_PROMPTS: Record<DocumentType, string> = {
  icp: `Analyseer de onderstaande tekst over een Ideale Klantprofiel (ICP) en structureer het in EXACT dit markdown formaat.
Gebruik de informatie uit de tekst om elke sectie in te vullen. Als informatie ontbreekt, schrijf "Nog te bepalen".

# Ideale Klantprofiel (ICP)

## Samenvatting
> Schrijf hier een korte, krachtige samenvatting van de ideale klant in 2-3 zinnen.

## Demografie
| Kenmerk | Detail |
|---------|--------|
| Branche | ... |
| Rol / Functietitel | ... |
| Bedrijfsgrootte | ... |
| Omzet | ... |
| Locatie | ... |
| LinkedIn volgers | ... |

## Top Pijnpunten
1. **Naam van pijnpunt** — Uitgebreide beschrijving
2. **Naam van pijnpunt** — Uitgebreide beschrijving
3. **Naam van pijnpunt** — Uitgebreide beschrijving

## Doelen & Motivaties
- **Primair doel**: Beschrijving
- **Secundair doel**: Beschrijving
- **Dieperliggend verlangen**: Beschrijving

## Koopgedrag
- **Beslissingsproces**: Hoe nemen ze beslissingen?
- **Budget**: Wat kunnen/willen ze uitgeven?
- **Tijdlijn**: Wanneer zijn ze klaar om te kopen?
- **Triggers**: Wat zorgt ervoor dat ze NU actie ondernemen?

## Waar te vinden
- **Online kanalen**: LinkedIn, communities, platforms...
- **Offline**: Events, netwerken, conferenties...
- **Content die ze consumeren**: Podcasts, newsletters, blogs...

## Taal & Triggers
### Wat ze zeggen
> "Letterlijke quotes of parafrasen van wat deze persoon zegt"
> "Nog een quote"

### Wat actie triggert
- Trigger 1
- Trigger 2

## Veelvoorkomende Bezwaren
1. **Bezwaar** — Hoe te weerleggen
2. **Bezwaar** — Hoe te weerleggen
3. **Bezwaar** — Hoe te weerleggen

BELANGRIJK: Gebruik EXACT de ## headers zoals hierboven. Vul ALLES in met informatie uit de tekst. Schrijf in het Nederlands.`,

  offer: `Analyseer de onderstaande tekst over een Aanbod/Propositie en structureer het in EXACT dit markdown formaat.

# Aanbod & Propositie

## Kernpropositie
> Eenduidig statement: wat bied je aan, voor wie, en welk probleem los je op?

## De Transformatie
| Van (zonder jou) | Naar (met jou) |
|-------------------|----------------|
| Situatie 1 | Resultaat 1 |
| Situatie 2 | Resultaat 2 |
| Situatie 3 | Resultaat 3 |

## Wat je aanbiedt
### Pakket / Dienst naam
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
- Deliverable 3

## Bewezen Resultaten
- **Resultaat**: Concreet cijfer of uitkomst
- **Resultaat**: Concreet cijfer of uitkomst

## Waarom jij?
1. **Onderscheidend punt** — Uitleg
2. **Onderscheidend punt** — Uitleg

BELANGRIJK: Gebruik EXACT de ## headers. Vul alles in uit de tekst. Schrijf in het Nederlands.`,

  positioning: `Analyseer de onderstaande tekst over Positionering en structureer het in EXACT dit markdown formaat.

# Positionering

## Positioneringsstatement
> "Voor [doelgroep] die [probleem], is [naam] de [categorie] die [unieke waarde], in tegenstelling tot [alternatieven]."

## Doelmarkt
- **Segment**: ...
- **Grootte**: ...
- **Trend**: ...

## Categorie & Framing
- **Hoe je jezelf noemt**: ...
- **In welk hokje je valt**: ...

## Onderscheidend Vermogen
| Jij | Concurrentie |
|-----|-------------|
| ... | ... |

## Concurrentielandschap
### Directe concurrenten
- **Concurrent**: Wat ze doen + verschil

### Indirecte alternatieven
- Alternatief + waarom jij beter bent

## Merkbelofte
> Wat beloof je altijd waar te maken?

## Bewijs
- Case study of testimonial
- Cijfers of resultaten

## Perceptie
| Hoe je gezien wilt worden | Hoe je nu gezien wordt |
|---------------------------|----------------------|
| ... | ... |

BELANGRIJK: Gebruik EXACT de ## headers. Vul alles in. Schrijf in het Nederlands.`,

  tone_of_voice: `Analyseer de onderstaande tekst over Tone of Voice en structureer het in EXACT dit markdown formaat.

# Tone of Voice

## Kernpersoonlijkheid
> 3-5 woorden die de communicatiestijl samenvatten

## Stemkarakteristieken
| Dimensie | Positie | Toelichting |
|----------|---------|-------------|
| Formeel ↔ Informeel | ... | ... |
| Serieus ↔ Speels | ... | ... |
| Bescheiden ↔ Zelfverzekerd | ... | ... |

## Woordkeuze
### Woorden die passen
- woord, woord, woord

### Woorden die NIET passen
- woord, woord, woord

## Voorbeeldzinnen
> "Voorbeeld van schrijfstijl"
> "Nog een voorbeeld"
> "En nog een"

## Do's en Don'ts
| Do | Don't |
|-----|---------|
| ... | ... |

## Toon per Context
- **LinkedIn posts**: ...
- **Emails**: ...
- **DM's**: ...

## Inspiratiebronnen
- Persoon/merk + waarom vergelijkbaar

BELANGRIJK: Gebruik EXACT de ## headers. Vul alles in. Schrijf in het Nederlands.`,
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    const { data: doc, error } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: "Document niet gevonden" }, { status: 404 });
    }

    const docType = doc.type as DocumentType;
    const prompt = STRUCTURE_PROMPTS[docType];

    if (!prompt) {
      return NextResponse.json({ error: "Onbekend document type" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      thinking: {
        type: "enabled",
        budget_tokens: 8000,
      },
      system: "Je bent een expert in het structureren van documenten. Je taak is om ongestructureerde tekst om te zetten in een perfect geformateerd markdown document met de exacte structuur die gevraagd wordt. Behoud ALLE informatie uit de originele tekst. Schrijf in het Nederlands.",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\n---\n\nTE STRUCTUREREN TEKST:\n\n${doc.content}`,
        },
      ],
    });

    let structuredContent = "";
    for (const block of response.content) {
      if (block.type === "text") {
        structuredContent = block.text;
        break;
      }
    }

    if (!structuredContent) {
      return NextResponse.json({ error: "Geen output gegenereerd" }, { status: 500 });
    }

    // Update het document
    await supabaseAdmin
      .from("documents")
      .update({
        content: structuredContent,
        version: doc.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    return NextResponse.json({
      message: "Document geherstructureerd",
      newVersion: doc.version + 1,
    });
  } catch (error: any) {
    console.error("Restructure error:", error);
    return NextResponse.json(
      { error: error.message ?? "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
