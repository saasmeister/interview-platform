"use client";

import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DocumentType } from "@/lib/types";

// Sectie configuratie per document type
const SECTION_CONFIG: Record<DocumentType, { sections: SectionDef[] }> = {
  icp: {
    sections: [
      { id: "samenvatting", title: "Samenvatting", icon: "📋", style: "highlight" },
      { id: "demografie", title: "Demografie", icon: "🏢", style: "table" },
      { id: "pijnpunten", title: "Top Pijnpunten", icon: "🔥", style: "list" },
      { id: "doelen", title: "Doelen & Motivaties", icon: "🎯", style: "list" },
      { id: "koopgedrag", title: "Koopgedrag", icon: "💳", style: "default" },
      { id: "kanalen", title: "Waar te vinden", icon: "📍", style: "list" },
      { id: "taal", title: "Taal & Triggers", icon: "💬", style: "default" },
      { id: "bezwaren", title: "Veelvoorkomende Bezwaren", icon: "🚫", style: "list" },
    ],
  },
  offer: {
    sections: [
      { id: "kernpropositie", title: "Kernpropositie", icon: "💡", style: "highlight" },
      { id: "transformatie", title: "De Transformatie", icon: "🔄", style: "table" },
      { id: "aanbod", title: "Wat je aanbiedt", icon: "📦", style: "default" },
      { id: "pricing", title: "Pricing", icon: "💰", style: "table" },
      { id: "deliverables", title: "Deliverables", icon: "✅", style: "list" },
      { id: "resultaten", title: "Bewezen Resultaten", icon: "📊", style: "list" },
      { id: "onderscheidend", title: "Waarom jij?", icon: "⭐", style: "list" },
    ],
  },
  positioning: {
    sections: [
      { id: "statement", title: "Positioneringsstatement", icon: "🎯", style: "highlight" },
      { id: "doelmarkt", title: "Doelmarkt", icon: "🏢", style: "default" },
      { id: "categorie", title: "Categorie & Framing", icon: "🏷️", style: "default" },
      { id: "onderscheidend", title: "Onderscheidend Vermogen", icon: "⚡", style: "table" },
      { id: "concurrentie", title: "Concurrentielandschap", icon: "🏆", style: "default" },
      { id: "merkbelofte", title: "Merkbelofte", icon: "🤝", style: "highlight" },
      { id: "bewijs", title: "Bewijs", icon: "📊", style: "list" },
      { id: "perceptie", title: "Perceptie", icon: "👁️", style: "table" },
    ],
  },
  tone_of_voice: {
    sections: [
      { id: "kern", title: "Kernpersoonlijkheid", icon: "🎭", style: "highlight" },
      { id: "karakteristieken", title: "Stemkarakteristieken", icon: "🎚️", style: "table" },
      { id: "woordkeuze", title: "Woordkeuze", icon: "📝", style: "default" },
      { id: "voorbeelden", title: "Voorbeeldzinnen", icon: "💬", style: "quotes" },
      { id: "dos-donts", title: "Do's en Don'ts", icon: "✅", style: "table" },
      { id: "context", title: "Toon per Context", icon: "📱", style: "default" },
      { id: "inspiratie", title: "Inspiratiebronnen", icon: "✨", style: "list" },
    ],
  },
};

interface SectionDef {
  id: string;
  title: string;
  icon: string;
  style: "highlight" | "table" | "list" | "default" | "quotes";
}

interface DocumentViewerProps {
  content: string;
  type: DocumentType;
}

// Parse markdown content into sections based on h2 headers
function parseSections(content: string): { title: string; content: string }[] {
  const lines = content.split("\n");
  const sections: { title: string; content: string }[] = [];
  let currentTitle = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    const h1Match = line.match(/^#\s+(.+)/);

    if (h2Match) {
      if (currentTitle || currentContent.length > 0) {
        sections.push({
          title: currentTitle,
          content: currentContent.join("\n").trim(),
        });
      }
      currentTitle = h2Match[1].trim();
      currentContent = [];
    } else if (h1Match) {
      // Skip h1 (document title)
      continue;
    } else {
      currentContent.push(line);
    }
  }

  // Push last section
  if (currentTitle || currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join("\n").trim(),
    });
  }

  return sections;
}

// Match parsed sections to config
function matchSections(
  parsed: { title: string; content: string }[],
  config: SectionDef[]
): { def: SectionDef; content: string }[] {
  const results: { def: SectionDef; content: string }[] = [];

  for (const def of config) {
    // Find matching parsed section by fuzzy title match
    const match = parsed.find((p) => {
      const normalizedParsed = p.title.toLowerCase().replace(/[^a-z\s]/g, "");
      const normalizedDef = def.title.toLowerCase().replace(/[^a-z\s]/g, "");
      return (
        normalizedParsed.includes(normalizedDef) ||
        normalizedDef.includes(normalizedParsed) ||
        normalizedParsed.split(" ").some((w) => normalizedDef.includes(w))
      );
    });

    if (match && match.content) {
      results.push({ def, content: match.content });
    }
  }

  return results;
}

// Color mapping per document type
const TYPE_COLORS: Record<DocumentType, { border: string; bg: string; accent: string }> = {
  icp: { border: "border-blue-200", bg: "bg-blue-50", accent: "text-blue-700" },
  offer: { border: "border-green-200", bg: "bg-green-50", accent: "text-green-700" },
  positioning: { border: "border-purple-200", bg: "bg-purple-50", accent: "text-purple-700" },
  tone_of_voice: { border: "border-orange-200", bg: "bg-orange-50", accent: "text-orange-700" },
};

function SectionCard({
  def,
  content,
  type,
}: {
  def: SectionDef;
  content: string;
  type: DocumentType;
}) {
  const colors = TYPE_COLORS[type];

  if (def.style === "highlight") {
    return (
      <Card className={`${colors.border} ${colors.bg} col-span-full`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{def.icon}</span>
            <div>
              <h3 className={`text-sm font-semibold ${colors.accent} uppercase tracking-wide mb-2`}>
                {def.title}
              </h3>
              <div className="text-base text-slate-800 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-blockquote:border-0 prose-blockquote:p-0 prose-blockquote:not-italic prose-blockquote:text-slate-800 prose-blockquote:text-base">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (def.style === "quotes") {
    // Extract quoted lines
    const quotes = content
      .split("\n")
      .filter((l) => l.startsWith(">") || l.startsWith('"'))
      .map((l) => l.replace(/^>\s*"?|"?\s*$/g, "").replace(/^"|"$/g, "").trim())
      .filter(Boolean);

    return (
      <Card className="col-span-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{def.icon}</span>
            <CardTitle className="text-base">{def.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {quotes.length > 0 ? quotes.map((q, i) => (
              <div key={i} className={`${colors.bg} rounded-lg px-4 py-3 border-l-4 ${colors.border}`}>
                <p className="text-sm text-slate-700 italic">&ldquo;{q}&rdquo;</p>
              </div>
            )) : (
              <div className="prose prose-sm max-w-none prose-p:text-slate-700 prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{def.icon}</span>
          <CardTitle className="text-base">{def.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <article className="prose prose-sm max-w-none
          prose-headings:text-slate-800 prose-headings:text-sm prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
          prose-p:text-slate-700 prose-p:leading-relaxed prose-p:my-1
          prose-li:text-slate-700 prose-li:my-0.5
          prose-strong:text-slate-900
          prose-table:text-sm prose-table:my-2
          prose-th:bg-slate-50 prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-th:font-medium prose-th:text-xs prose-th:uppercase prose-th:tracking-wide prose-th:text-slate-500
          prose-td:px-3 prose-td:py-2 prose-td:border-b prose-td:text-slate-700
          prose-blockquote:border-l-4 prose-blockquote:border-slate-200 prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r prose-blockquote:not-italic prose-blockquote:text-slate-700 prose-blockquote:my-2
          prose-ul:my-1 prose-ol:my-1
        ">
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>
      </CardContent>
    </Card>
  );
}

export function DocumentViewer({ content, type }: DocumentViewerProps) {
  const config = SECTION_CONFIG[type];

  if (!config) {
    // Fallback: render als plain markdown
    return (
      <Card>
        <CardContent className="p-8">
          <article className="prose prose-slate prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    );
  }

  const parsed = parseSections(content);
  const matched = matchSections(parsed, config.sections);

  if (matched.length === 0) {
    // Geen secties gevonden — render als plain markdown
    return (
      <Card>
        <CardContent className="p-8">
          <article className="prose prose-slate prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {matched.map(({ def, content: sectionContent }) => (
        <SectionCard key={def.id} def={def} content={sectionContent} type={type} />
      ))}
    </div>
  );
}
