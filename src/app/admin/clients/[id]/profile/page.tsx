"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DOCUMENT_TYPES } from "@/lib/document-config";
import type { Profile, DocumentType, DocumentWithSuggestions } from "@/lib/types";

export default function AdminClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<DocumentWithSuggestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  // Basis document upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<DocumentType | null>(null);
  const [baseContent, setBaseContent] = useState("");
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    const { data: clientData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientData) setClient(clientData);

    const res = await fetch(`/api/documents?clientId=${clientId}`);
    const data = await res.json();
    if (data.documents) setDocuments(data.documents);
    setLoading(false);
  }

  function openUploadDialog(type: DocumentType) {
    setUploadDocType(type);
    setBaseContent("");
    setBaseFile(null);
    setUploadDialogOpen(true);
  }

  async function handleSaveBaseDocument() {
    if (!uploadDocType || !clientId) return;
    setSaving(true);

    let content = baseContent;

    // Als er een bestand is, lees de tekst eruit
    if (baseFile) {
      try {
        content = await baseFile.text();
      } catch {
        // Als het geen tekstbestand is, gebruik de beschrijving
        content = baseContent || `[Geimporteerd uit bestand: ${baseFile.name}]`;
      }
    }

    if (!content.trim()) {
      toast.error("Voer content in of upload een bestand");
      setSaving(false);
      return;
    }

    const docConfig = DOCUMENT_TYPES[uploadDocType];
    const docsByType = new Map<string, DocumentWithSuggestions>();
    documents.forEach((doc) => docsByType.set(doc.type, doc));
    const existingDoc = docsByType.get(uploadDocType);

    if (existingDoc) {
      // Maak een suggestie aan (gaat via goedkeuring)
      await fetch(`/api/documents/set-base`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: existingDoc.id,
          content,
          reason: "Basis-document geupload door admin",
        }),
      });
    } else {
      // Maak nieuw document aan
      await fetch(`/api/documents/set-base`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          type: uploadDocType,
          title: docConfig.title,
          content,
          isNew: true,
        }),
      });
    }

    setSaving(false);
    setUploadDialogOpen(false);
    await loadData();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-muted-foreground"
            onClick={() => router.push(`/admin/clients/${clientId}`)}
          >
            &larr; Terug naar klant
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">
            Klantprofiel: {client?.full_name ?? client?.email}
          </h1>
          <p className="text-muted-foreground mt-1">
            Overzicht van alle profiel-documenten. Je kunt een basis-document uploaden of instellen.
          </p>
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
                className="transition-all hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className={`text-lg ${config.color}`}>
                      {config.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {pendingSuggestions > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                          {pendingSuggestions} suggestie{pendingSuggestions > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {doc && (
                        <Badge variant="outline" className="text-xs">
                          v{doc.version}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {doc ? (
                    <div>
                      <p className="text-sm text-slate-600 line-clamp-3 mb-3">
                        {doc.content.substring(0, 200)}...
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/clients/${clientId}/profile/${type}`)}
                        >
                          Bekijken
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-500"
                          onClick={() => openUploadDialog(type)}
                        >
                          Basis vervangen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      <p className="text-sm text-muted-foreground mb-3">
                        Nog niet gegenereerd
                      </p>
                      <Button
                        size="sm"
                        onClick={() => openUploadDialog(type)}
                      >
                        Basis-document instellen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      {/* Basis document upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {uploadDocType && DOCUMENT_TYPES[uploadDocType]
                ? `${DOCUMENT_TYPES[uploadDocType].title} instellen`
                : "Document instellen"}
            </DialogTitle>
            <DialogDescription>
              Plak de inhoud van een bestaand document, of upload een tekstbestand als basis.
              {docsByType.get(uploadDocType ?? "") &&
                " Het bestaande document wordt vervangen na goedkeuring."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Bestand uploaden */}
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                baseFile ? "border-green-300 bg-green-50" : "border-slate-200 hover:border-slate-300"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="text/*,.md,.txt,.doc,.docx,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setBaseFile(file);
                }}
              />
              {baseFile ? (
                <p className="text-sm text-green-700">{baseFile.name}</p>
              ) : (
                <p className="text-sm text-slate-500">
                  Klik om een bestand te uploaden (optioneel)
                </p>
              )}
            </div>

            <div className="text-center text-xs text-muted-foreground">of</div>

            {/* Tekst plakken */}
            <Textarea
              placeholder="Plak hier de inhoud van het bestaande document..."
              value={baseContent}
              onChange={(e) => setBaseContent(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleSaveBaseDocument}
              disabled={(!baseContent.trim() && !baseFile) || saving}
            >
              {saving ? "AI is het document aan het structureren..." : "Opslaan & Structureren"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
