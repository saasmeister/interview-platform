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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { Profile, AssignmentWithClient } from "@/lib/types";

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

export default function AdminDashboard() {
  const [clients, setClients] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // Haal alle klanten op
      const { data: clientsData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .order("created_at", { ascending: false });

      if (clientsData) setClients(clientsData);

      // Haal alle assignments op met interview en klant info
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(
          `
          *,
          interview:interviews(*),
          client:profiles!assignments_client_id_fkey(*)
        `
        )
        .order("assigned_at", { ascending: false });

      if (assignmentsData) setAssignments(assignmentsData as any);
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  // Tel statussen
  const totalAssignments = assignments.length;
  const completedCount = assignments.filter(
    (a) => a.status === "completed"
  ).length;
  const inProgressCount = assignments.filter(
    (a) => a.status === "in_progress"
  ).length;
  const notStartedCount = assignments.filter(
    (a) => a.status === "not_started"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Dashboard laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overzicht van alle klanten en interviews
        </p>
      </div>

      {/* Stats overzicht */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Klanten</CardDescription>
            <CardTitle className="text-3xl">{clients.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totaal interviews</CardDescription>
            <CardTitle className="text-3xl">{totalAssignments}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bezig</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {inProgressCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Afgerond</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {completedCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Klantenlijst met hun interviews */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Klanten & Interview Status
        </h2>

        {clients.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Nog geen klanten gevonden. Klanten verschijnen hier nadat ze
                inloggen met Google OAuth.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => {
              const clientAssignments = assignments.filter(
                (a) => a.client_id === client.id
              );
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
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={client.avatar_url ?? undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-900">
                            {client.full_name ?? "Onbekend"}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            {client.email}
                          </span>
                        </div>

                        {clientAssignments.length === 0 ? (
                          <p className="text-sm text-muted-foreground mt-2">
                            Geen interviews toegewezen
                          </p>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {clientAssignments.map((assignment) => (
                              <div
                                key={assignment.id}
                                className="flex items-center justify-between"
                              >
                                <Link
                                  href={`/admin/assignments/${assignment.id}`}
                                  className="text-sm text-slate-700 hover:text-slate-900 hover:underline"
                                >
                                  {assignment.interview?.title ??
                                    "Onbekend interview"}
                                </Link>
                                <Badge
                                  variant="secondary"
                                  className={
                                    statusColors[assignment.status] ?? ""
                                  }
                                >
                                  {statusLabels[assignment.status] ??
                                    assignment.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
