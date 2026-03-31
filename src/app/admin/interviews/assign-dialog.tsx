"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile, Interview } from "@/lib/types";

interface AssignDialogProps {
  interview: Interview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

export function AssignDialog({
  interview,
  open,
  onOpenChange,
  onAssigned,
}: AssignDialogProps) {
  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  async function loadClients() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .order("full_name");

    if (data) setClients(data);
    setLoading(false);
  }

  async function handleAssign(clientId: string) {
    if (!interview) return;
    setAssigning(clientId);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Check of deze combinatie al bestaat
    const { data: existingList } = await supabase
      .from("assignments")
      .select("id")
      .eq("interview_id", interview.id)
      .eq("client_id", clientId);

    if (existingList && existingList.length > 0) {
      alert("Dit interview is al toegewezen aan deze klant.");
      setAssigning(null);
      return;
    }

    // Maak de assignment aan
    const { data: assignment } = await supabase
      .from("assignments")
      .insert({
        interview_id: interview.id,
        client_id: clientId,
        assigned_by: user.id,
        status: "not_started",
      })
      .select()
      .single();

    // Maak een in-app notificatie voor de klant + stuur email
    if (assignment) {
      await supabase.from("notifications").insert({
        user_id: clientId,
        message: `Je hebt een nieuw interview: "${interview.title}"`,
        link: `/client/interview/${assignment.id}`,
        read: false,
      });

      // Stuur email notificatie (fire and forget)
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "assigned",
          assignmentId: assignment.id,
        }),
      }).catch(() => {});
    }

    setAssigning(null);
    onOpenChange(false);
    onAssigned();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Interview toewijzen</DialogTitle>
          <DialogDescription>
            Wijs &quot;{interview?.title}&quot; toe aan een klant. De klant
            ontvangt een notificatie.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Klanten laden...
            </p>
          ) : clients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Geen klanten gevonden. Klanten moeten eerst inloggen via Google
              OAuth.
            </p>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => {
                const initials =
                  client.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() ?? "?";

                return (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={client.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {client.full_name ?? "Onbekend"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {client.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssign(client.id)}
                      disabled={assigning === client.id}
                    >
                      {assigning === client.id ? "Toewijzen..." : "Toewijzen"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Sluiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
