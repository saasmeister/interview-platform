"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AssignmentWithInterview } from "@/lib/types";

export default function ClientDashboard() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentWithInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadAssignments() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const { data } = await supabase
        .from("assignments")
        .select(`
          *,
          interview:interviews(*)
        `)
        .eq("client_id", session.user.id)
        .order("assigned_at", { ascending: false });

      if (data) setAssignments(data as AssignmentWithInterview[]);
      setLoading(false);
    }

    loadAssignments();
  }, [supabase]);

  const statusConfig = {
    not_started: {
      label: "Niet gestart",
      color: "bg-slate-100 text-slate-700",
      action: "Start",
    },
    in_progress: {
      label: "Bezig",
      color: "bg-blue-100 text-blue-700",
      action: "Hervat",
    },
    completed: {
      label: "Voltooid",
      color: "bg-green-100 text-green-700",
      action: "Bekijk",
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Interviews laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Mijn Interviews</h1>
        <p className="text-muted-foreground mt-1">
          Hieronder vind je alle interviews die aan jou zijn toegewezen.
        </p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Je hebt nog geen interviews. Je coach wijst ze aan je toe.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const config = statusConfig[assignment.status];
            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-900">
                          {assignment.interview.title}
                        </h3>
                        <Badge className={config.color}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {assignment.interview.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Toegewezen:{" "}
                          {new Date(assignment.assigned_at).toLocaleDateString("nl-NL")}
                        </span>
                        {assignment.completed_at && (
                          <span>
                            Voltooid:{" "}
                            {new Date(assignment.completed_at).toLocaleDateString("nl-NL")}
                          </span>
                        )}
                        {assignment.progress > 0 && assignment.status !== "completed" && (
                          <span>{assignment.progress}% voltooid</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push(`/client/interview/${assignment.id}`)}
                      variant={assignment.status === "completed" ? "outline" : "default"}
                      size="sm"
                    >
                      {config.action}
                    </Button>
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
