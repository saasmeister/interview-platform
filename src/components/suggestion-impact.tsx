"use client";

import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <span className="text-xs text-slate-400">...</span>,
});

interface SuggestionImpactProps {
  currentContent: string;
  suggestedContent: string;
}

// Parse markdown into sections by h2 headers
function parseSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = content.split("\n");
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/);
    if (h2Match) {
      if (currentTitle) {
        sections.set(currentTitle.toLowerCase().trim(), currentLines.join("\n").trim());
      }
      currentTitle = h2Match[1];
      currentLines = [];
    } else if (!line.match(/^#\s+/)) {
      currentLines.push(line);
    }
  }
  if (currentTitle) {
    sections.set(currentTitle.toLowerCase().trim(), currentLines.join("\n").trim());
  }

  return sections;
}

// Simple similarity check
function contentChanged(a: string, b: string): boolean {
  const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
  return normalize(a) !== normalize(b);
}

export function SuggestionImpact({ currentContent, suggestedContent }: SuggestionImpactProps) {
  const currentSections = parseSections(currentContent);
  const suggestedSections = parseSections(suggestedContent);

  const allTitles = new Set([...currentSections.keys(), ...suggestedSections.keys()]);

  const changes: { title: string; type: "modified" | "added" | "removed"; current?: string; suggested?: string }[] = [];

  for (const title of allTitles) {
    const current = currentSections.get(title);
    const suggested = suggestedSections.get(title);

    if (current && suggested && contentChanged(current, suggested)) {
      changes.push({ title, type: "modified", current, suggested });
    } else if (!current && suggested) {
      changes.push({ title, type: "added", suggested });
    } else if (current && !suggested) {
      changes.push({ title, type: "removed", current });
    }
  }

  if (changes.length === 0) {
    return (
      <div className="text-sm text-slate-500 py-3">
        Geen significante wijzigingen gevonden.
      </div>
    );
  }

  const totalSections = allTitles.size;
  const changedCount = changes.length;

  return (
    <div className="space-y-4">
      {/* Impact samenvatting */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-xs">
          {changedCount} van {totalSections} secties gewijzigd
        </Badge>
        {changes.filter(c => c.type === "added").length > 0 && (
          <Badge className="bg-green-100 text-green-700 text-xs">
            {changes.filter(c => c.type === "added").length} nieuw
          </Badge>
        )}
        {changes.filter(c => c.type === "modified").length > 0 && (
          <Badge className="bg-blue-100 text-blue-700 text-xs">
            {changes.filter(c => c.type === "modified").length} aangepast
          </Badge>
        )}
        {changes.filter(c => c.type === "removed").length > 0 && (
          <Badge className="bg-red-100 text-red-700 text-xs">
            {changes.filter(c => c.type === "removed").length} verwijderd
          </Badge>
        )}
      </div>

      {/* Per-sectie wijzigingen */}
      <div className="space-y-3">
        {changes.map((change) => (
          <div key={change.title} className="border rounded-lg overflow-hidden">
            <div className={`px-4 py-2 flex items-center justify-between ${
              change.type === "added" ? "bg-green-50 border-b border-green-200" :
              change.type === "removed" ? "bg-red-50 border-b border-red-200" :
              "bg-blue-50 border-b border-blue-200"
            }`}>
              <span className="text-sm font-medium capitalize">{change.title}</span>
              <Badge variant="outline" className={`text-xs ${
                change.type === "added" ? "text-green-700 border-green-300" :
                change.type === "removed" ? "text-red-700 border-red-300" :
                "text-blue-700 border-blue-300"
              }`}>
                {change.type === "added" ? "Nieuw" : change.type === "removed" ? "Verwijderd" : "Aangepast"}
              </Badge>
            </div>

            {change.type === "modified" && (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                <div className="p-3 bg-red-50/30">
                  <p className="text-xs font-medium text-red-600 mb-2 uppercase tracking-wide">Huidig</p>
                  <article className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-li:my-0 prose-ul:my-1 text-xs">
                    <ReactMarkdown>{change.current!.substring(0, 500)}</ReactMarkdown>
                  </article>
                </div>
                <div className="p-3 bg-green-50/30">
                  <p className="text-xs font-medium text-green-600 mb-2 uppercase tracking-wide">Nieuw</p>
                  <article className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-li:my-0 prose-ul:my-1 text-xs">
                    <ReactMarkdown>{change.suggested!.substring(0, 500)}</ReactMarkdown>
                  </article>
                </div>
              </div>
            )}

            {change.type === "added" && (
              <div className="p-3 bg-green-50/30">
                <article className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-li:my-0 prose-ul:my-1 text-xs">
                  <ReactMarkdown>{change.suggested!.substring(0, 500)}</ReactMarkdown>
                </article>
              </div>
            )}

            {change.type === "removed" && (
              <div className="p-3 bg-red-50/30">
                <article className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-li:my-0 prose-ul:my-1 text-xs line-through opacity-60">
                  <ReactMarkdown>{change.current!.substring(0, 500)}</ReactMarkdown>
                </article>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
