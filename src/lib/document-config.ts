import type { DocumentType } from "./types";

export const DOCUMENT_TYPES: Record<
  DocumentType,
  { title: string; description: string; color: string; bgColor: string }
> = {
  icp: {
    title: "Ideale Klantprofiel (ICP)",
    description: "Wie is jouw ideale klant? Demografie, pijnpunten, doelen en koopgedrag.",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  offer: {
    title: "Aanbod & Propositie",
    description: "Wat bied je aan? Je kernproduct, pricing en unieke waarde.",
    color: "text-green-700",
    bgColor: "bg-green-50",
  },
  positioning: {
    title: "Positionering",
    description: "Hoe positioneer jij jezelf in de markt? Je onderscheidend vermogen.",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
  },
  tone_of_voice: {
    title: "Tone of Voice",
    description: "Hoe communiceer jij? Schrijfstijl, woordkeuze en persoonlijkheid.",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
  },
};

// Generatie-prompts per document type
export const GENERATION_PROMPTS: Record<DocumentType, string> = {
  icp: `Analyseer het volgende interviewtranscript en genereer een beknopt, dashboard-klaar Ideale Klantprofiel (ICP) document.

BELANGRIJK: Gebruik EXACT deze h2 headers (niet afwijken):

## Samenvatting
Eén korte paragraaf (3-5 zinnen) die de ideale klant beschrijft als persoon. Wie is het, wat doet diegene, wat is de situatie? Schrijf het alsof je die persoon aan iemand beschrijft.

## Demografie
Gebruik een overzichtelijk format met bullet points:
- **Rol**: (bijv. SaaS consultant, fractional CTO)
- **Bedrijfsgrootte**: (bijv. 1-5 personen)
- **Omzet**: (bijv. €50-100K+)
- **Branche**: (bijv. SaaS / B2B tech)
- **Locatie**: (bijv. internationaal, Engelstalig)
- **LinkedIn volgers**: (bereik als relevant)

## Top Pijnpunten
Top 3-5 pijnpunten als bullet list. Per punt: één korte zin + waarom het pijn doet.

## Doelen & Motivaties
Top 3-5 doelen als bullet list. Wat willen ze bereiken? Wat drijft ze?

## Koopgedrag
Hoe nemen ze beslissingen? Wie is betrokken? Wat is het budget en de typische tijdlijn? Gebruik bullets.

## Waar te vinden
Waar zijn ze actief? LinkedIn, communities, events, podcasts? Gebruik bullets.

## Taal & Triggers
Welke woorden en zinnen gebruiken ze? Wat triggert ze om actie te ondernemen? Geef concrete voorbeelden.

## Veelvoorkomende Bezwaren
Top 3-5 bezwaren als bullet list. Waarom kopen ze NIET? Wat houdt ze tegen?

SCHRIJFSTIJL:
- Schrijf in het Nederlands
- Beknopt en scanbaar: bullets, korte zinnen
- Concreet met echte cijfers en voorbeelden uit het interview
- GEEN Q&A format, GEEN interviewvragen opnemen
- Dit is een dashboard voor de klant, niet een intern rapport`,

  offer: `Analyseer het volgende interviewtranscript en genereer een beknopt, dashboard-klaar Aanbod & Propositie document.

BELANGRIJK: Gebruik EXACT deze h2 headers (niet afwijken):

## Kernpropositie
Eén korte paragraaf (2-4 zinnen): wat bied je aan en welk probleem los je op? De elevator pitch.

## De Transformatie
Overzichtelijk format:
- **Situatie voor**: Hoe ziet het leven van de klant eruit VOOR ze met jou werken?
- **Situatie na**: Hoe ziet het eruit NA het traject?
- **De shift**: Wat verandert er fundamenteel?

## Wat je aanbiedt
Beschrijf de dienst/het product. Wat zit erin? Hoe werkt het? Gebruik bullets.

## Pricing
Overzicht van pricing en pakketten. Gebruik een tabel of bullets met bedragen en wat erbij hoort.

## Deliverables
Concrete lijst van wat de klant krijgt. Bullet list.

## Bewezen Resultaten
Case studies, cijfers, testimonials. Concrete voorbeelden met echte resultaten.

## Waarom jij?
Top 3-5 redenen waarom jij en niet de concurrent. Wat is je unfair advantage?

SCHRIJFSTIJL:
- Schrijf in het Nederlands
- Beknopt en scanbaar: bullets, korte zinnen
- Concreet met echte cijfers en voorbeelden uit het interview
- GEEN Q&A format, GEEN interviewvragen opnemen
- Dit is een dashboard voor de klant, niet een intern rapport`,

  positioning: `Analyseer het volgende interviewtranscript en genereer een beknopt, dashboard-klaar Positionering document.

BELANGRIJK: Gebruik EXACT deze h2 headers (niet afwijken):

## Positioneringsstatement
Eén krachtig statement (1-2 zinnen): wie je bent, voor wie, en wat je uniek maakt.

## Doelmarkt
Welk specifiek segment bedien je? Hoe niche is het? Gebruik bullets.

## Categorie & Framing
In welke categorie val je? Hoe definieer je jezelf tegenover de markt?

## Onderscheidend Vermogen
Top 3-5 punten die je anders maken. Gebruik een tabel of bullets met wat jij doet vs. wat de markt doet.

## Concurrentielandschap
Wie zijn de alternatieven? Hoe verschil je? Noem concrete namen als ze uit het interview komen.

## Merkbelofte
Wat beloof je altijd waar te maken? Eén krachtige paragraaf.

## Bewijs
Case studies, cijfers, testimonials die je positie ondersteunen. Concrete voorbeelden.

## Perceptie
Hoe wil je gezien worden vs. hoe word je nu gezien? Gebruik een tabel of bullets.

SCHRIJFSTIJL:
- Schrijf in het Nederlands
- Beknopt en scanbaar: bullets, korte zinnen
- Concreet met echte cijfers en voorbeelden uit het interview
- GEEN Q&A format, GEEN interviewvragen opnemen
- Dit is een dashboard voor de klant, niet een intern rapport`,

  tone_of_voice: `Analyseer het volgende interviewtranscript en genereer een beknopt, dashboard-klaar Tone of Voice document.

BELANGRIJK: Gebruik EXACT deze h2 headers (niet afwijken):

## Kernpersoonlijkheid
3-5 kernwoorden die de communicatiestijl samenvatten, met per woord een korte toelichting (1 zin).

## Stemkarakteristieken
Gebruik een tabel of overzichtelijk format:
- Formeel ←→ Informeel: (waar op de schaal?)
- Serieus ←→ Speels: (waar?)
- Bescheiden ←→ Zelfverzekerd: (waar?)
- Afstandelijk ←→ Persoonlijk: (waar?)

## Woordkeuze
Welke woorden en zinnen gebruikt deze persoon veel? Welke woorden passen NIET? Gebruik twee lijsten: "Wel" en "Niet".

## Voorbeeldzinnen
5-10 zinnen die de stijl perfect illustreren. Gebruik blockquotes (> "zin").

## Do's en Don'ts
Tabel met twee kolommen: Do's en Don'ts. Concrete richtlijnen.

## Toon per Context
Hoe verandert de toon per kanaal? LinkedIn posts, emails, DMs, calls. Gebruik bullets per kanaal.

## Inspiratiebronnen
Welke personen of merken hebben een vergelijkbare stijl? Kort waarom.

SCHRIJFSTIJL:
- Schrijf in het Nederlands
- Beknopt en scanbaar: bullets, korte zinnen
- Concreet met echte voorbeelden uit het interview
- GEEN Q&A format, GEEN interviewvragen opnemen
- Dit is een dashboard voor de klant, niet een intern rapport`,
};
