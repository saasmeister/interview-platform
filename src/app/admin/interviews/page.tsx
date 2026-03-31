"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AssignDialog } from "./assign-dialog";
import { DOCUMENT_TYPES } from "@/lib/document-config";
import type { Interview, DocumentType } from "@/lib/types";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningInterview, setAssigningInterview] = useState<Interview | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [documentType, setDocumentType] = useState<string>("");

  const supabase = createClient();

  useEffect(() => {
    loadInterviews();
  }, []);

  async function loadInterviews() {
    const { data } = await supabase
      .from("interviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setInterviews(data);
    setLoading(false);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setSystemPrompt("");
    setDocumentType("");
    setEditingInterview(null);
  }

  function openCreateDialog() {
    resetForm();
    setDialogOpen(true);
  }

  function openEditDialog(interview: Interview) {
    setEditingInterview(interview);
    setTitle(interview.title);
    setDescription(interview.description);
    setSystemPrompt(interview.system_prompt);
    setDocumentType(interview.document_type ?? "");
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (editingInterview) {
      // Bewerken
      await supabase
        .from("interviews")
        .update({
          title,
          description,
          system_prompt: systemPrompt,
          document_type: documentType || null,
        })
        .eq("id", editingInterview.id);
    } else {
      // Nieuw aanmaken
      await supabase.from("interviews").insert({
        title,
        description,
        system_prompt: systemPrompt,
        document_type: documentType || null,
        created_by: user.id,
      });
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    loadInterviews();
  }

  async function handleDelete(id: string) {
    if (!confirm("Weet je zeker dat je dit interview wilt verwijderen?")) return;

    await supabase.from("interviews").delete().eq("id", id);
    loadInterviews();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Interviews laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Interviews</h1>
          <p className="text-muted-foreground mt-1">
            Maak interviews aan en beheer ze
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 mr-2"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Nieuw Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingInterview
                  ? "Interview bewerken"
                  : "Nieuw interview aanmaken"}
              </DialogTitle>
              <DialogDescription>
                {editingInterview
                  ? "Pas de gegevens van dit interview aan."
                  : "Maak een nieuw interview aan met een systeem-prompt voor Claude."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Naam
                </label>
                <Input
                  placeholder="Bijv. Intake gesprek Senior Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Beschrijving
                </label>
                <Textarea
                  placeholder="Korte beschrijving van het interview..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Document type
                </label>
                <p className="text-xs text-muted-foreground">
                  Welk klantprofiel-document voedt dit interview? Na afronding wordt automatisch een document gegenereerd.
                </p>
                <Select value={documentType} onValueChange={(v) => setDocumentType(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Geen (optioneel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen</SelectItem>
                    {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Systeem-prompt
                </label>
                <p className="text-xs text-muted-foreground">
                  Dit zijn de instructies die Claude volgt tijdens het interview.
                  Beschrijf welke vragen Claude moet stellen en hoe het gesprek
                  moet verlopen.
                </p>
                <Textarea
                  placeholder={`Bijv. Je bent een interviewer voor een senior developer positie. Stel vragen over:\n- Technische ervaring\n- Teamwork\n- Probleemoplossend vermogen\n\nStel één vraag per keer en wacht op het antwoord.`}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleSave}
                disabled={!title.trim() || !systemPrompt.trim() || saving}
              >
                {saving
                  ? "Opslaan..."
                  : editingInterview
                  ? "Opslaan"
                  : "Aanmaken"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {interviews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              Nog geen interviews aangemaakt. Klik op &quot;Nieuw
              Interview&quot; om er een te maken.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map((interview) => (
            <Card key={interview.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{interview.title}</CardTitle>
                  {interview.document_type && DOCUMENT_TYPES[interview.document_type as DocumentType] && (
                    <Badge variant="outline" className={`text-xs ${DOCUMENT_TYPES[interview.document_type as DocumentType].color}`}>
                      {DOCUMENT_TYPES[interview.document_type as DocumentType].title}
                    </Badge>
                  )}
                </div>
                <CardDescription>{interview.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Systeem-prompt
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-3 font-mono bg-slate-50 p-2 rounded">
                      {interview.system_prompt}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Aangemaakt op{" "}
                    {new Date(interview.created_at).toLocaleDateString("nl-NL")}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setAssigningInterview(interview);
                        setAssignDialogOpen(true);
                      }}
                    >
                      Toewijzen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(interview)}
                    >
                      Bewerken
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(interview.id)}
                    >
                      Verwijderen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AssignDialog
        interview={assigningInterview}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onAssigned={loadInterviews}
      />
    </div>
  );
}
