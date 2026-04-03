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
      { id: "demografie", title: "Demografie", icon: "🏢", style: "stats" },
      { id: "pijnpunten", title: "Top Pijnpunten", icon: "🔥", style: "numbered" },
      { id: "doelen", title: "Doelen & Motivaties", icon: "🎯", style: "numbered" },
      { id: "koopgedrag", title: "Koopgedrag", icon: "💳", style: "default" },
      { id: "kanalen", title: "Waar te vinden", icon: "📍", style: "tags" },
      { id: "taal", title: "Taal & Triggers", icon: "💬", style: "default" },
      { id: "bezwaren", title: "Veelvoorkomende Bezwaren", icon: "🚫", style: "numbered" },
    ],
  },
  offer: {
    sections: [
      { id: "kernpropositie", title: "Kernpropositie", icon: "💡", style: "highlight" },
      { id: "transformatie", title: "De Transformatie", icon: "🔄", style: "transformation" },
      { id: "aanbod", title: "Wat je aanbiedt", icon: "📦", style: "default" },
      { id: "pricing", title: "Pricing", icon: "💰", style: "default" },
      { id: "deliverables", title: "Deliverables", icon: "✅", style: "checklist" },
      { id: "resultaten", title: "Bewezen Resultaten", icon: "📊", style: "default" },
      { id: "onderscheidend", title: "Waarom jij?", icon: "⭐", style: "numbered" },
    ],
  },
  positioning: {
    sections: [
      { id: "statement", title: "Positioneringsstatement", icon: "🎯", style: "highlight" },
      { id: "doelmarkt", title: "Doelmarkt", icon: "🏢", style: "default" },
      { id: "categorie", title: "Categorie & Framing", icon: "🏷️", style: "default" },
      { id: "onderscheidend", title: "Onderscheidend Vermogen", icon: "⚡", style: "numbered" },
      { id: "concurrentie", title: "Concurrentielandschap", icon: "🏆", style: "default" },
      { id: "merkbelofte", title: "Merkbelofte", icon: "🤝", style: "highlight" },
      { id: "bewijs", title: "Bewijs", icon: "📊", style: "default" },
      { id: "perceptie", title: "Perceptie", icon: "👁️", style: "default" },
    ],
  },
  tone_of_voice: {
    sections: [
      { id: "kern", title: "Kernpersoonlijkheid", icon: "🎭", style: "tags" },
      { id: "karakteristieken", title: "Stemkarakteristieken", icon: "🎚️", style: "sliders" },
      { id: "woordkeuze", title: "Woordkeuze", icon: "📝", style: "twocolumn" },
      { id: "voorbeelden", title: "Voorbeeldzinnen", icon: "💬", style: "quotes" },
      { id: "dos-donts", title: "Do's en Don'ts", icon: "✅", style: "twocolumn" },
      { id: "context", title: "Toon per Context", icon: "📱", style: "default" },
      { id: "inspiratie", title: "Inspiratiebronnen", icon: "✨", style: "default" },
    ],
  },
};

interface SectionDef {
  id: string;
  title: string;
  icon: string;
  style: "highlight" | "stats" | "numbered" | "tags" | "default" | "quotes" | "transformation" | "checklist" | "sliders" | "twocolumn";
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
        sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
      }
      currentTitle = h2Match[1].trim();
      currentContent = [];
    } else if (h1Match) {
      continue;
    } else {
      currentContent.push(line);
    }
  }

  if (currentTitle || currentContent.length > 0) {
    sections.push({ title: currentTitle, content: currentContent.join("\n").trim() });
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
    const match = parsed.find((p) => {
      const normalizedParsed = p.title.toLowerCase().replace(/[^a-z\s]/g, "");
      const normalizedDef = def.title.toLowerCase().replace(/[^a-z\s]/g, "");
      return (
        normalizedParsed.includes(normalizedDef) ||
        normalizedDef.includes(normalizedParsed) ||
        normalizedParsed.split(" ").some((w) => w.length > 3 && normalizedDef.includes(w))
      );
    });

    if (match && match.content) {
      results.push({ def, content: match.content });
    }
  }

  return results;
}

// Extract bullet points from content
function extractBullets(content: string): string[] {
  return content
    .split("\n")
    .filter((l) => l.match(/^[-*]\s+/) || l.match(/^\d+\.\s+/))
    .map((l) => l.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim())
    .filter(Boolean);
}

// Extract key-value pairs from content (e.g. **Key**: Value)
function extractKeyValues(content: string): { key: string; value: string }[] {
  const pairs: { key: string; value: string }[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/\*\*(.+?)\*\*[:\s]+(.+)/);
    if (match) {
      pairs.push({ key: match[1].trim(), value: match[2].trim() });
    }
  }
  return pairs;
}

// Color mapping per document type
const TYPE_COLORS: Record<DocumentType, { border: string; bg: string; accent: string; gradient: string }> = {
  icp: { border: "border-blue-200", bg: "bg-blue-50", accent: "text-blue-700", gradient: "from-blue-500 to-blue-600" },
  offer: { border: "border-green-200", bg: "bg-green-50", accent: "text-green-700", gradient: "from-green-500 to-green-600" },
  positioning: { border: "border-purple-200", bg: "bg-purple-50", accent: "text-purple-700", gradient: "from-purple-500 to-purple-600" },
  tone_of_voice: { border: "border-orange-200", bg: "bg-orange-50", accent: "text-orange-700", gradient: "from-orange-500 to-orange-600" },
};

function SectionCard({ def, content, type }: { def: SectionDef; content: string; type: DocumentType }) {
  const colors = TYPE_COLORS[type];

  // Highlight: full-width accent card
  if (def.style === "highlight") {
    return (
      <Card className={`${colors.border} ${colors.bg} col-span-full`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <span className="text-xl filter brightness-0 invert">{def.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className={`text-xs font-semibold ${colors.accent} uppercase tracking-widest mb-3`}>
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

  // Stats: key-value pairs as stat cards
  if (def.style === "stats") {
    const pairs = extractKeyValues(content);
    if (pairs.length > 0) {
      return (
        <Card className="col-span-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{def.icon}</span>
              <CardTitle className="text-base">{def.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {pairs.map((pair, i) => (
                <div key={i} className={`${colors.bg} rounded-xl p-3`}>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{pair.key}</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{pair.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Numbered: bullets as numbered list with accent
  if (def.style === "numbered") {
    const bullets = extractBullets(content);
    if (bullets.length > 0) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{def.icon}</span>
              <CardTitle className="text-base">{def.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className="text-[10px] font-bold text-white">{i + 1}</span>
                  </div>
                  <div className="flex-1 text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none prose-strong:text-slate-900 prose-p:my-0">
                    <ReactMarkdown>{bullet}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Tags: bullets as badge-like tags
  if (def.style === "tags") {
    const bullets = extractBullets(content);
    if (bullets.length > 0) {
      return (
        <Card className="col-span-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{def.icon}</span>
              <CardTitle className="text-base">{def.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {bullets.map((bullet, i) => {
                // Check if it has a bold part (keyword + description)
                const boldMatch = bullet.match(/\*\*(.+?)\*\*[:\s]*(.*)/);
                if (boldMatch) {
                  return (
                    <div key={i} className={`${colors.bg} ${colors.border} border rounded-xl px-4 py-2.5`}>
                      <span className={`text-sm font-semibold ${colors.accent}`}>{boldMatch[1]}</span>
                      {boldMatch[2] && <p className="text-xs text-slate-600 mt-0.5">{boldMatch[2]}</p>}
                    </div>
                  );
                }
                return (
                  <Badge key={i} variant="outline" className={`${colors.bg} ${colors.accent} text-sm px-3 py-1.5`}>
                    {bullet}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Quotes: blockquotes styled nicely
  if (def.style === "quotes") {
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {quotes.length > 0 ? quotes.map((q, i) => (
              <div key={i} className={`${colors.bg} rounded-xl px-4 py-3 border-l-4 ${colors.border}`}>
                <p className="text-sm text-slate-700 italic leading-relaxed">&ldquo;{q}&rdquo;</p>
              </div>
            )) : (
              <div className="col-span-full prose prose-sm max-w-none prose-p:text-slate-700 prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transformation: voor-na weergave
  if (def.style === "transformation") {
    const pairs = extractKeyValues(content);
    const before = pairs.find(p => p.key.toLowerCase().includes("voor") || p.key.toLowerCase().includes("before"));
    const after = pairs.find(p => p.key.toLowerCase().includes("na") || p.key.toLowerCase().includes("after"));
    const shift = pairs.find(p => p.key.toLowerCase().includes("shift") || p.key.toLowerCase().includes("verand"));

    if (before || after) {
      return (
        <Card className="col-span-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{def.icon}</span>
              <CardTitle className="text-base">{def.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {before && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Voor</p>
                  <p className="text-sm text-slate-700">{before.value}</p>
                </div>
              )}
              {shift && (
                <div className={`${colors.bg} ${colors.border} border rounded-xl p-4 flex items-center`}>
                  <div>
                    <p className={`text-xs font-semibold ${colors.accent} uppercase tracking-wide mb-2`}>De shift</p>
                    <p className="text-sm text-slate-700">{shift.value}</p>
                  </div>
                </div>
              )}
              {after && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Na</p>
                  <p className="text-sm text-slate-700">{after.value}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Checklist: bullets als checklist items
  if (def.style === "checklist") {
    const bullets = extractBullets(content);
    if (bullets.length > 0) {
      return (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{def.icon}</span>
              <CardTitle className="text-base">{def.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-700 prose prose-sm max-w-none prose-strong:text-slate-900 prose-p:my-0">
                    <ReactMarkdown>{bullet}</ReactMarkdown>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Sliders: for tone of voice scale items
  if (def.style === "sliders") {
    const pairs = extractKeyValues(content);
    if (pairs.length > 0) {
      return (
        <Card className="col-span-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{def.icon}</span>
              <CardTitle className="text-base">{def.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {pairs.map((pair, i) => {
                // Try to parse scale (e.g. "Formeel ←→ Informeel")
                const scaleMatch = pair.key.match(/(.+?)\s*[←↔→]+\s*(.+)/);
                const valueText = pair.value.replace(/[()]/g, "").trim();

                return (
                  <div key={i}>
                    {scaleMatch ? (
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                          <span>{scaleMatch[1].trim()}</span>
                          <span>{scaleMatch[2].trim()}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full relative">
                          <div className={`absolute h-full rounded-full bg-gradient-to-r ${colors.gradient} opacity-30`} style={{ width: "100%" }} />
                          <div className={`absolute w-4 h-4 rounded-full bg-gradient-to-br ${colors.gradient} shadow-sm -top-1`} style={{ left: "60%" }} />
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5">{valueText}</p>
                      </div>
                    ) : (
                      <div className={`${colors.bg} rounded-lg px-4 py-2.5`}>
                        <span className={`text-sm font-medium ${colors.accent}`}>{pair.key}</span>
                        <span className="text-sm text-slate-600 ml-2">{pair.value}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Two column: split into two lists (Wel/Niet, Do/Don't)
  if (def.style === "twocolumn") {
    const lines = content.split("\n");
    const lists: { title: string; items: string[] }[] = [];
    let currentList: { title: string; items: string[] } | null = null;

    for (const line of lines) {
      const h3Match = line.match(/^###\s+(.+)/);
      const bulletMatch = line.match(/^[-*]\s+(.+)/);
      const boldHeaderMatch = line.match(/^\*\*(.+?)\*\*\s*$/);

      if (h3Match || boldHeaderMatch) {
        if (currentList) lists.push(currentList);
        currentList = { title: (h3Match?.[1] || boldHeaderMatch?.[1] || "").trim(), items: [] };
      } else if (bulletMatch && currentList) {
        currentList.items.push(bulletMatch[1].trim());
      } else if (bulletMatch && !currentList) {
        currentList = { title: "", items: [bulletMatch[1].trim()] };
      }
    }
    if (currentList) lists.push(currentList);

    if (lists.length >= 2) {
      const isDosDonts = def.id === "dos-donts";
      return (
        <Card className="col-span-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{def.icon}</span>
              <CardTitle className="text-base">{def.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-xl p-4 ${isDosDonts ? "bg-green-50 border border-green-200" : `${colors.bg} ${colors.border} border`}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDosDonts ? "text-green-600" : colors.accent}`}>
                  {lists[0].title || "Wel"}
                </p>
                <div className="space-y-2">
                  {lists[0].items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {isDosDonts && <span className="text-green-500 mt-0.5">✓</span>}
                      <span className="text-sm text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`rounded-xl p-4 ${isDosDonts ? "bg-red-50 border border-red-200" : "bg-slate-50 border border-slate-200"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDosDonts ? "text-red-600" : "text-slate-500"}`}>
                  {lists[1].title || "Niet"}
                </p>
                <div className="space-y-2">
                  {lists[1].items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {isDosDonts && <span className="text-red-500 mt-0.5">✗</span>}
                      <span className="text-sm text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  // Default: clean card with markdown rendering
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
