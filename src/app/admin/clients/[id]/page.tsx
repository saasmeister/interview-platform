"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import type { Profile, Assignment, Interview, Message } from "@/lib/types";

const statusLabels: Record<string, string> = {
  not_started: "Niet gestart",
  in_progress: "Bezig",
  completed: "Afgerond",
};

const statusColors: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

interface AssignmentWithDetails extends Assignment {
  interview: Interview;
  messages: Message[];
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (clientId) loadClientData();
  }, [clientId]);

  async function loadClientData() {
    setLoading(true);

    // Haal klant profiel op
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", clientId)
      .single();

    if (profileData) setClient(profileData);

    // Haal alle assignments op met interview info
    const { data: assignmentsData } = await supabase
      .from("assignments")
      .select(`
        *,
        interview:interviews(*)
      `)
      .eq("client_id", clientId)
      .order("assigned_at", { ascending: false });

    if (assignmentsData) {
      // Voor elke assignment, haal het aantal berichten op
      const enriched = await Promise.all(
        assignmentsData.map(async (a: any) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("*")
            .eq("assignment_id", a.id)
            .order("created_at", { ascending: true });

          return { ...a, messages: messages ?? [] };
        })
      );
      setAssignments(enriched);
    }

    setLoading(false);
  }

  function openEditDialog() {
    if (!client) return;
    setEditName(client.full_name ?? "");
    setEditEmail(client.email);
    setEditError("");
    setEditDialogOpen(true);
  }

  async function handleEdit() {
    setEditSaving(true);
    setEditError("");

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editEmail.toLowerCase().trim(),
          fullName: editName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEditError(data.error);
        setEditSaving(false);
        return;
      }

      setClient(data.profile);
      setEditDialogOpen(false);
    } catch {
      setEditError("Er is een fout opgetreden");
    }

    setEditSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? "Er is een fout opgetreden bij het verwijderen");
        setDeleting(false);
        setDeleteConfirmOpen(false);
        return;
      }

      toast.success("Klant verwijderd");
      router.push("/admin/clients");
    } catch {
      toast.error("Er is een fout opgetreden bij het verwijderen");
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Klant laden...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Klant niet gevonden.</p>
        <Button variant="outline" onClick={() => router.push("/admin/clients")}>
          Terug naar klanten
        </Button>
      </div>
    );
  }

  const initials =
    client.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  const completedCount = assignments.filter((a) => a.status === "completed").length;
  const inProgressCount = assignments.filter((a) => a.status === "in_progress").length;
  const notStartedCount = assignments.filter((a) => a.status === "not_started").length;

  return (
    <div className="space-y-6">
      {/* Terug-knop */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/admin/clients")}
        className="text-muted-foreground hover:text-slate-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 mr-1"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Terug naar klanten
      </Button>

      {/* Klant header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarImage src={client.avatar_url ?? undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {client.full_name ?? "Onbekend"}
              </h1>
              <p className="text-muted-foreground">{client.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Aangemaakt op{" "}
                {new Date(client.created_at).toLocaleDateString("nl-NL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {assignments.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Totaal</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {inProgressCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Bezig</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {completedCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Afgerond</p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEditDialog}
                >
                  Bewerken
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={deleting}
                >
                  {deleting ? "Verwijderen..." : "Verwijderen"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Klantprofiel link */}
      <Card className="border-slate-200 hover:shadow-md transition-all cursor-pointer" onClick={() => router.push(`/admin/clients/${clientId}/profile`)}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Klantprofiel</h2>
              <p className="text-sm text-muted-foreground">
                ICP, Aanbod, Positionering en Tone of Voice documenten
              </p>
            </div>
            <Button variant="outline" size="sm">
              Bekijken &rarr;
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interviews overzicht */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Interviews
        </h2>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Nog geen interviews toegewezen aan deze klant.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-slate-900">
                          {assignment.interview?.title ?? "Onbekend interview"}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={statusColors[assignment.status] ?? ""}
                        >
                          {statusLabels[assignment.status] ?? assignment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {assignment.interview?.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Toegewezen op{" "}
                          {new Date(assignment.assigned_at).toLocaleDateString(
                            "nl-NL"
                          )}
                        </span>
                        {assignment.completed_at && (
                          <span>
                            Afgerond op{" "}
                            {new Date(
                              assignment.completed_at
                            ).toLocaleDateString("nl-NL")}
                          </span>
                        )}
                        <span>
                          {assignment.messages.length} berichten
                        </span>
                      </div>
                    </div>

                    {assignment.messages.length > 0 && (
                      <Link href={`/admin/assignments/${assignment.id}`}>
                        <Button variant="outline" size="sm">
                          Bekijk transcript
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Preview van laatste berichten bij afgeronde interviews */}
                  {assignment.status === "completed" &&
                    assignment.messages.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Laatste berichten
                          </p>
                          {assignment.messages.slice(-3).map((msg) => (
                            <div
                              key={msg.id}
                              className={`text-sm p-2 rounded ${
                                msg.role === "assistant"
                                  ? "bg-slate-50 text-slate-700"
                                  : "bg-blue-50 text-blue-900"
                              }`}
                            >
                              <span className="font-medium text-xs uppercase tracking-wide">
                                {msg.role === "assistant" ? "Claude" : "Klant"}:{" "}
                              </span>
                              <span className="line-clamp-2">{msg.content}</span>
                            </div>
                          ))}
                          {assignment.messages.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              ... en {assignment.messages.length - 3} eerdere
                              berichten
                            </p>
                          )}
                        </div>
                      </>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bewerk dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Klant bewerken</DialogTitle>
            <DialogDescription>
              Pas de naam of het emailadres van deze klant aan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editError && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
                {editError}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Volledige naam
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Emailadres
              </label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editName.trim() || !editEmail.trim() || editSaving}
            >
              {editSaving ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Klant verwijderen"
        description="Weet je zeker dat je deze klant wilt verwijderen? Alle bijbehorende interviews, berichten en documenten worden ook verwijderd."
        confirmLabel="Verwijderen"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
