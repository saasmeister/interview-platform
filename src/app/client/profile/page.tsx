"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_TYPES } from "@/lib/document-config";
import type { DocumentType, DocumentWithSuggestions } from "@/lib/types";

const DOC_ICONS: Record<DocumentType, string> = {
  icp: "👤",
  offer: "💰",
  positioning: "🎯",
  tone_of_voice: "🗣️",
};

export default function ClientProfilePage() {
  const [documents, setDocuments] = useState<DocumentWithSuggestions[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch(`/api/documents?clientId=${user.id}`);
    const data = await res.json();
    if (data.documents) setDocuments(data.documents);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Profiel laden...</p>
      </div>
    );
  }

  const docsByType = new Map<string, DocumentWithSuggestions>();
  documents.forEach((doc) => docsByType.set(doc.type, doc));

  const totalDocs = documents.length;
  const totalSuggestions = documents.reduce(
    (acc, doc) => acc + (doc.suggestions?.filter((s) => s.status === "pending").length ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Mijn Profiel</h1>
        <p className="text-muted-foreground mt-1">
          Je klantprofiel wordt opgebouwd op basis van interviews en uploads.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-900">{totalDocs}/4</p>
          <p className="text-xs text-slate-500 mt-1">Documenten actief</p>
        </div>
        <div className={`rounded-xl p-4 ${totalSuggestions > 0 ? "bg-amber-50" : "bg-slate-50"}`}>
          <p className={`text-2xl font-bold ${totalSuggestions > 0 ? "text-amber-700" : "text-slate-900"}`}>
            {totalSuggestions}
          </p>
          <p className="text-xs text-slate-500 mt-1">Openstaande suggesties</p>
        </div>
      </div>

      {/* Document kaarten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.entries(DOCUMENT_TYPES) as [DocumentType, typeof DOCUMENT_TYPES[DocumentType]][]).map(
          ([type, config]) => {
            const doc = docsByType.get(type);
            const pendingSuggestions = doc?.suggestions?.filter(
              (s) => s.status === "pending"
            ).length ?? 0;

            return (
              <Card
                key={type}
                className={`cursor-pointer transition-all hover:shadow-md group ${
                  !doc ? "opacity-60 hover:opacity-80" : ""
                }`}
                onClick={() => router.push(`/client/profile/${type}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                        <span className="text-lg">{DOC_ICONS[type]}</span>
                      </div>
                      <div>
                        <CardTitle className="text-base group-hover:text-slate-700 transition-colors">
                          {config.title}
                        </CardTitle>
                        {doc && (
                          <span className="text-xs text-slate-400">v{doc.version}</span>
                        )}
                      </div>
                    </div>
                    {pendingSuggestions > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs">
                        {pendingSuggestions} nieuw
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {doc ? (
                    <div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {doc.content.replace(/[#*_\-]/g, "").substring(0, 150)}...
                      </p>
                      <p className="text-xs text-slate-400 mt-3">
                        Bijgewerkt {new Date(doc.updated_at).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  ) : (
                    <div className="py-1">
                      <p className="text-sm text-muted-foreground">
                        Nog niet beschikbaar
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Wordt gegenereerd na het interview
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }
        )}
      </div>
    </div>
  );
}
