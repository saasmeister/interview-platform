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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/types";

export default function ClientsPage() {
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .order("created_at", { ascending: false });

    if (data) setClients(data);
    setLoading(false);
  }

  async function handleCreate() {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          fullName: fullName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        setSaving(false);
        return;
      }

      setInviteUrl(data.inviteUrl || "");
      setEmail("");
      setFullName("");
      loadClients();
    } catch {
      setError("Er is een fout opgetreden");
    }

    setSaving(false);
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Weet je zeker dat je deze klant wilt verwijderen? Alle bijbehorende data wordt ook verwijderd.")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (response.ok) {
        loadClients();
      } else {
        const data = await response.json();
        alert(data.error ?? "Er is een fout opgetreden");
      }
    } catch {
      alert("Er is een fout opgetreden bij het verwijderen");
    }
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Klanten laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Klanten</h1>
          <p className="text-muted-foreground mt-1">
            Beheer je klanten en maak nieuwe aan
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setError(""); setEmail(""); setFullName(""); setInviteUrl(""); setCopied(false); }
        }}>
          <DialogTrigger asChild>
            <Button>
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" x2="19" y1="8" y2="14" />
                <line x1="22" x2="16" y1="11" y2="11" />
              </svg>
              Nieuwe Klant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            {inviteUrl ? (
              <>
                <DialogHeader>
                  <DialogTitle>Uitnodigingslink</DialogTitle>
                  <DialogDescription>
                    Klant aangemaakt! Stuur onderstaande link naar de klant. Via deze link kan diegene een wachtwoord instellen en inloggen.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Uitnodigingslink:</p>
                    <p className="text-sm font-mono break-all text-slate-800">{inviteUrl}</p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? "Gekopieerd!" : "Link kopiëren"}
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDialogOpen(false); setInviteUrl(""); setCopied(false); }}>
                    Sluiten
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Nieuwe klant aanmaken</DialogTitle>
                  <DialogDescription>
                    Voeg een klant toe met hun naam en emailadres. Je ontvangt een uitnodigingslink die je naar de klant kunt sturen.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Volledige naam
                    </label>
                    <Input
                      placeholder="Jan de Vries"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Emailadres
                    </label>
                    <Input
                      type="email"
                      placeholder="jan@bedrijf.nl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      De klant gebruikt dit emailadres om in te loggen
                    </p>
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
                    onClick={handleCreate}
                    disabled={!email.trim() || !fullName.trim() || saving}
                  >
                    {saving ? "Aanmaken..." : "Klant aanmaken"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              Nog geen klanten. Klik op &quot;Nieuwe Klant&quot; om er een toe te
              voegen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const initials =
              client.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() ?? "?";

            return (
              <Card
                key={client.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = `/admin/clients/${client.id}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={client.avatar_url ?? undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {client.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {client.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground">
                        Aangemaakt op{" "}
                        {new Date(client.created_at).toLocaleDateString("nl-NL")}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deletingId === client.id}
                        onClick={(e) => handleDelete(client.id, e)}
                      >
                        {deletingId === client.id ? "..." : "Verwijderen"}
                      </Button>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 text-muted-foreground"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
