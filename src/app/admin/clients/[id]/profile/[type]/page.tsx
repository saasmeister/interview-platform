"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const DocumentViewer = dynamic(
  () => import("@/components/document-viewer").then((mod) => ({ default: mod.DocumentViewer })),
  { loading: () => <div className="py-20 text-center text-sm text-slate-400">Document laden...</div> }
);

const ReactMarkdown = dynamic(
  () => import("react-markdown"),
  { loading: () => <div className="py-8 text-center text-sm text-slate-400">Laden...</div> }
);

const SuggestionImpact = dynamic(
  () => import("@/components/suggestion-impact").then((mod) => ({ default: mod.SuggestionImpact })),
  { loading: () => <div className="py-4 text-center text-sm text-slate-400">Impact analyseren...</div> }
);
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DOCUMENT_TYPES } from "@/lib/document-config";
import type { DocumentType, DocumentWithSuggestions } from "@/lib/types";

const DOC_ICONS: Record<DocumentType, string> = {
  icp: "👤",
  offer: "💰",
  positioning: "🎯",
  tone_of_voice: "🗣️",
};

export default function AdminDocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const docType = params.type as DocumentType;
  const config = DOCUMENT_TYPES[docType];

  const [document, setDocument] = useState<DocumentWithSuggestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [showSuggestionFull, setShowSuggestionFull] = useState<string | null>(null);
  const [restructuring, setRestructuring] = useState(false);
  const [showRawContent, setShowRawContent] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadDocument();
  }, [clientId, docType]);

  async function loadDocument() {
    const res = await fetch(`/api/documents?clientId=${clientId}`);
    const data = await res.json();
    const doc = data.documents?.find(
      (d: DocumentWithSuggestions) => d.type === docType
    );
    if (doc) setDocument(doc);
    setLoading(false);
  }

  async function approveSuggestion(suggestionId: string) {
    if (!document) return;
    setApproving(suggestionId);
    await fetch(`/api/documents/${document.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId }),
    });
    await loadDocument();
    setApproving(null);
    setShowSuggestionFull(null);
  }

  async function restructureDocument() {
    if (!document) return;
    setRestructuring(true);
    await fetch(`/api/documents/${document.id}/restructure`, { method: "POST" });
    await loadDocument();
    setRestructuring(false);
  }

  async function rejectSuggestion(suggestionId: string) {
    if (!document) return;
    setApproving(suggestionId);
    await fetch(`/api/documents/${document.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId }),
    });
    await loadDocument();
    setApproving(null);
  }

  if (!config) {
    return <div className="py-20 text-center"><p className="text-muted-foreground">Onbekend document type</p></div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl ${config.bgColor} flex items-center justify-center`}>
            <span className="text-xl">{DOC_ICONS[docType]}</span>
          </div>
          <p className="text-sm text-slate-400">Document laden...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => router.push(`/admin/clients/${clientId}/profile`)}>
          &larr; Terug naar profiel
        </Button>
        <div className="text-center py-16">
          <div className={`w-16 h-16 rounded-2xl ${config.bgColor} flex items-center justify-center mx-auto mb-4`}>
            <span className="text-3xl">{DOC_ICONS[docType]}</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">{config.title}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Dit document is nog niet aangemaakt. Ga terug en stel een basis-document in.
          </p>
        </div>
      </div>
    );
  }

  const pendingSuggestions = document.suggestions?.filter((s) => s.status === "pending") ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => router.push(`/admin/clients/${clientId}/profile`)}>
          &larr; Terug naar profiel
        </Button>
        <Badge variant="outline" className="text-xs">Versie {document.version}</Badge>
      </div>

      {/* Suggesties banner */}
      {pendingSuggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-sm font-medium text-amber-900">
                {pendingSuggestions.length} voorgestelde wijziging{pendingSuggestions.length > 1 ? "en" : ""}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Scroll naar beneden om te beoordelen.</p>
            </div>
          </div>
        </div>
      )}

      {/* Document header */}
      <div className={`${config.bgColor} rounded-2xl p-6`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{DOC_ICONS[docType]}</span>
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${config.color}`}>{config.title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Laatst bijgewerkt: {new Date(document.updated_at).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Acties */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => {
            if (!document) return;
            const blob = new Blob([document.content], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = window.document.createElement("a");
            a.href = url;
            a.download = `${docType}-${clientId}-${new Date().toISOString().split("T")[0]}.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download .md
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={restructureDocument}
          disabled={restructuring}
        >
          {restructuring ? "AI is aan het herstructureren..." : "Herstructureer met AI"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-slate-500"
          onClick={() => setShowRawContent(!showRawContent)}
        >
          {showRawContent ? "Toon dashboard" : "Bekijk volledig document"}
        </Button>
      </div>

      {/* Document inhoud */}
      {showRawContent ? (
        <Card className="shadow-sm">
          <CardContent className="p-8">
            <article className="prose prose-slate prose-sm max-w-none
              prose-headings:text-slate-900 prose-headings:font-semibold
              prose-p:text-slate-700 prose-p:leading-relaxed
              prose-li:text-slate-700 prose-strong:text-slate-900
              prose-table:text-sm prose-th:bg-slate-50 prose-th:px-3 prose-th:py-2
              prose-td:px-3 prose-td:py-2 prose-td:border-b
              prose-blockquote:border-l-4 prose-blockquote:border-slate-300 prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
            ">
              <ReactMarkdown>{document.content}</ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      ) : (
        <DocumentViewer content={document.content} type={docType} />
      )}

      {/* Suggesties met impact-preview */}
      {pendingSuggestions.map((suggestion) => (
        <Card key={suggestion.id} className="border-amber-200 shadow-sm overflow-hidden">
          <div className="bg-amber-50 px-6 py-3 border-b border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">💡</span>
                <span className="text-sm font-medium text-amber-900">Voorgestelde wijziging</span>
              </div>
              <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs">
                {suggestion.source_type === "interview" ? "Uit interview" : "Uit upload"}
              </Badge>
            </div>
            <p className="text-xs text-amber-700 mt-1">{suggestion.reason}</p>
          </div>
          <CardContent className="p-6">
            {/* Impact overzicht */}
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Impact op document</p>
              <SuggestionImpact
                currentContent={document.content}
                suggestedContent={suggestion.suggested_content}
              />
            </div>

            {showSuggestionFull === suggestion.id ? (
              <div className="mb-4 mt-4 border-t pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Volledig nieuw document</p>
                <article className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900">
                  <ReactMarkdown>{suggestion.suggested_content}</ReactMarkdown>
                </article>
                <Button size="sm" variant="ghost" className="mt-3 text-xs text-slate-400" onClick={() => setShowSuggestionFull(null)}>
                  Inklappen
                </Button>
              </div>
            ) : (
              <div className="mt-3">
                <Button size="sm" variant="ghost" className="text-xs text-blue-600" onClick={() => setShowSuggestionFull(suggestion.id)}>
                  Volledig nieuw document bekijken
                </Button>
              </div>
            )}

            <Separator className="my-4" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => approveSuggestion(suggestion.id)} disabled={approving === suggestion.id} className="bg-green-600 hover:bg-green-700">
                {approving === suggestion.id ? "Bezig..." : "Goedkeuren & Toepassen"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => rejectSuggestion(suggestion.id)} disabled={approving === suggestion.id} className="text-red-600 hover:text-red-700">
                Afwijzen
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
