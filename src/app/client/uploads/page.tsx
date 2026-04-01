"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOCUMENT_TYPES } from "@/lib/document-config";
import type { Upload, DocumentType } from "@/lib/types";

export default function UploadsPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const res = await fetch(`/api/uploads?clientId=${user.id}`);
    const data = await res.json();
    if (data.uploads) setUploads(data.uploads);
    setLoading(false);
  }

  async function handleUpload() {
    if (!selectedFile || !documentType || !userId) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("clientId", userId);
    formData.append("documentType", documentType);
    formData.append("description", description);

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Upload mislukt");
      }

      // Reset form
      setSelectedFile(null);
      setDocumentType("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Herlaad uploads
      await loadData();

      // Start automatisch de verwerking
      if (data.upload?.id) {
        processUpload(data.upload.id);
      }
    } catch (error: any) {
      setError(error.message ?? "Er is een fout opgetreden");
    }

    setUploading(false);
  }

  async function processUpload(uploadId: string) {
    setProcessing(uploadId);
    setError(null);

    try {
      const res = await fetch(`/api/uploads/${uploadId}/process`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Verwerking mislukt");
      }
      await loadData();
    } catch (error: any) {
      setError(error.message ?? "Er is een fout opgetreden bij het verwerken");
    }

    setProcessing(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Uploads laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Uploads</h1>
        <p className="text-muted-foreground mt-1">
          Deel extra informatie om je profiel te verbeteren — transcripties, screenshots, documenten, voice memos.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Upload formulier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nieuw bestand uploaden</CardTitle>
          <CardDescription>
            Upload een bestand en geef aan bij welk profiel-onderdeel het hoort.
            De AI analyseert het en stelt verbeteringen voor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : selectedFile
                ? "border-green-300 bg-green-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,text/*,.pdf,.doc,.docx,.csv,.json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
            />
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium text-green-700">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {formatFileSize(selectedFile.size)} &middot;{" "}
                  {selectedFile.type || "Onbekend type"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Klik om een ander bestand te kiezen
                </p>
              </div>
            ) : (
              <div>
                <svg
                  className="mx-auto h-10 w-10 text-slate-300 mb-3"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-sm text-slate-500">
                  Sleep een bestand hierheen of klik om te kiezen
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Afbeeldingen, tekst, PDF, CSV, documenten
                </p>
              </div>
            )}
          </div>

          {/* Document type selectie */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Dit bestand hoort bij:
            </label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Kies een profiel-onderdeel..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Beschrijving */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Toelichting (optioneel)
            </label>
            <Textarea
              placeholder="Bijv. 'Dit is een transcript van een sales call met een potentiele klant'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !documentType || uploading}
            className="w-full"
          >
            {uploading ? "Uploaden..." : "Upload & Analyseer"}
          </Button>
        </CardContent>
      </Card>

      {/* Eerdere uploads */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Eerdere uploads
          </h2>
          {uploads.map((upload) => (
            <Card key={upload.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      {upload.file_type.startsWith("image/") ? (
                        <svg className="w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {upload.file_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">
                          {DOCUMENT_TYPES[upload.document_type as DocumentType]?.title ?? upload.document_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(upload.created_at).toLocaleDateString("nl-NL")}
                        </span>
                      </div>
                      {upload.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {upload.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {upload.processed ? (
                      <Badge className="bg-green-100 text-green-700">
                        Verwerkt
                      </Badge>
                    ) : processing === upload.id ? (
                      <Badge className="bg-blue-100 text-blue-700">
                        Verwerken...
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => processUpload(upload.id)}
                      >
                        Verwerken
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
