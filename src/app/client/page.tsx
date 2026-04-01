"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AssignmentWithInterview } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";

export default function ClientDashboard() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [assignments, setAssignments] = useState<AssignmentWithInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadAssignments() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("assignments")
        .select(`*, interview:interviews(*)`)
        .eq("client_id", session.user.id)
        .order("assigned_at", { ascending: false });
      if (data) setAssignments(data as AssignmentWithInterview[]);
      setLoading(false);
    }
    loadAssignments();
  }, [supabase]);

  const locale = lang === "nl" ? "nl-NL" : "en-GB";

  const statusConfig = {
    not_started: {
      label: t.dashboard.statusNotStarted,
      color: "bg-slate-100 text-slate-700",
      action: t.dashboard.startBtn,
    },
    in_progress: {
      label: t.dashboard.statusInProgress,
      color: "bg-blue-100 text-blue-700",
      action: t.dashboard.continueBtn,
    },
    completed: {
      label: t.dashboard.statusCompleted,
      color: "bg-green-100 text-green-700",
      action: t.dashboard.viewBtn,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t.general.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{t.dashboard.title}</h1>
        <p className="text-muted-foreground mt-1">{t.dashboard.subtitle}</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground font-medium">{t.dashboard.empty}</p>
            <p className="text-sm text-muted-foreground mt-1">{t.dashboard.emptyHint}</p>
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
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {assignment.interview.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {new Date(assignment.assigned_at).toLocaleDateString(locale)}
                        </span>
                        {assignment.completed_at && (
                          <span>
                            {new Date(assignment.completed_at).toLocaleDateString(locale)}
                          </span>
                        )}
                        {assignment.progress > 0 && assignment.status !== "completed" && (
                          <span>{assignment.progress}% {t.dashboard.progress}</span>
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
