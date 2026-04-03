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
import type { Interview, DocumentType, InterviewType } from "@/lib/types";

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
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [documentType, setDocumentType] = useState<string>("");
  const [interviewType, setInterviewType] = useState<InterviewType>("profile");
  const [topic, setTopic] = useState("");

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
    setInterviewType("profile");
    setTopic("");
    setEditingInterview(null);
    setError(null);
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
    setInterviewType(interview.interview_type ?? "profile");
    setTopic(interview.topic ?? "");
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Je bent niet ingelogd. Log opnieuw in en probeer het nog eens.");
      setSaving(false);
      return;
    }

    const payload = {
      title,
      description,
      system_prompt: systemPrompt,
      document_type: interviewType === "profile" ? (documentType || null) : null,
      interview_type: interviewType,
      topic: interviewType === "content" ? (topic || null) : null,
    };

    const { error: dbError } = editingInterview
      ? await supabase
          .from("interviews")
          .update(payload)
          .eq("id", editingInterview.id)
      : await supabase
          .from("interviews")
          .insert({ ...payload, created_by: user.id });

    setSaving(false);

    if (dbError) {
      setError(`Kon interview niet opslaan: ${dbError.message}`);
      return;
    }

    setDialogOpen(false);
    resetForm();
    loadInterviews();
  }

  async function handleDelete(id: string) {
    if (!confirm("Weet je zeker dat je dit interview wilt verwijderen?")) return;

    const { error: dbError } = await supabase.from("interviews").delete().eq("id", id);
    if (dbError) {
      setError(`Kon interview niet verwijderen: ${dbError.message}`);
      return;
    }
    setError(null);
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

              {/* Interview type selectie */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Type interview
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInterviewType("profile")}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      interviewType === "profile"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">Profiel-interview</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Voedt ICP, aanbod, positionering of tone of voice
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewType("content")}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      interviewType === "content"
                        ? "border-green-500 bg-green-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">Content-interview</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Wekelijks interview voor content & inzichten
                    </p>
                  </button>
                </div>
              </div>

              {/* Profiel: document type */}
              {interviewType === "profile" && (
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
                      <SelectItem value="none">Geen (scant alle profielen)</SelectItem>
                      {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Content: onderwerp */}
              {interviewType === "content" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Onderwerp / thema
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Welk onderwerp behandelt dit interview? De output wordt als content-document opgeslagen.
                  </p>
                  <Input
                    placeholder="Bijv. Weekelijkse content check-in, Klantverhalen, Markttrends..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Systeem-prompt
                </label>
                <p className="text-xs text-muted-foreground">
                  {interviewType === "content"
                    ? "Instructies voor Claude. Beschrijf welke vragen gesteld moeten worden en wat de gewenste output is (bijv. blogpost, social media content, etc.)."
                    : "Dit zijn de instructies die Claude volgt tijdens het interview. Beschrijf welke vragen Claude moet stellen en hoe het gesprek moet verlopen."}
                </p>
                <Textarea
                  placeholder={interviewType === "content"
                    ? `Bijv. Je bent een content-interviewer. Stel vragen over:\n- Wat er deze week is gebeurd\n- Interessante klantgesprekken\n- Inzichten en learnings\n\nGenereer aan het einde een samenvatting met content-ideeën.`
                    : `Bijv. Je bent een interviewer voor een senior developer positie. Stel vragen over:\n- Technische ervaring\n- Teamwork\n- Probleemoplossend vermogen\n\nStel één vraag per keer en wacht op het antwoord.`}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
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
                  <div className="flex items-center gap-1.5">
                    <Badge className={`text-xs ${
                      interview.interview_type === "content"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {interview.interview_type === "content" ? "Content" : "Profiel"}
                    </Badge>
                    {interview.document_type && DOCUMENT_TYPES[interview.document_type as DocumentType] && (
                      <Badge variant="outline" className={`text-xs ${DOCUMENT_TYPES[interview.document_type as DocumentType].color}`}>
                        {DOCUMENT_TYPES[interview.document_type as DocumentType].title}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>
                  {interview.description}
                  {interview.topic && (
                    <span className="block text-xs text-green-600 mt-1">Onderwerp: {interview.topic}</span>
                  )}
                </CardDescription>
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
