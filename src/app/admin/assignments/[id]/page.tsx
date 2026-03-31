"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Message, Profile, Interview, Assignment } from "@/lib/types";

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

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [assignment, setAssignment] = useState<
    Assignment & { interview: Interview; client: Profile } | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: assignmentData } = await supabase
        .from("assignments")
        .select(
          `
          *,
          interview:interviews(*),
          client:profiles!assignments_client_id_fkey(*)
        `
        )
        .eq("id", id)
        .single();

      if (assignmentData) setAssignment(assignmentData as any);

      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("assignment_id", id)
        .order("created_at", { ascending: true });

      if (messagesData) setMessages(messagesData);
      setLoading(false);
    }

    load();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Transcript laden...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Assignment niet gevonden</p>
      </div>
    );
  }

  const clientInitials =
    assignment.client?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        &larr; Terug
      </Button>

      {/* Interview info */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {assignment.interview?.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {assignment.interview?.description}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={statusColors[assignment.status] ?? ""}
        >
          {statusLabels[assignment.status] ?? assignment.status}
        </Badge>
      </div>

      {/* Klant info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={assignment.client?.avatar_url ?? undefined} />
              <AvatarFallback>{clientInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-slate-900">
                {assignment.client?.full_name ?? "Onbekend"}
              </p>
              <p className="text-sm text-muted-foreground">
                {assignment.client?.email}
              </p>
            </div>
            <div className="ml-auto text-sm text-muted-foreground">
              <p>
                Toegewezen:{" "}
                {new Date(assignment.assigned_at).toLocaleDateString("nl-NL")}
              </p>
              {assignment.completed_at && (
                <p>
                  Afgerond:{" "}
                  {new Date(assignment.completed_at).toLocaleDateString(
                    "nl-NL"
                  )}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Volledig Transcript</CardTitle>
          <CardDescription>
            {messages.length} berichten in dit gesprek
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nog geen berichten in dit interview
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={msg.id}>
                  <div className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        msg.role === "assistant"
                          ? "bg-slate-900 text-white"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {msg.role === "assistant" ? "AI" : clientInitials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {msg.role === "assistant"
                            ? "Claude"
                            : assignment.client?.full_name ?? "Klant"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString("nl-NL")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                  {index < messages.length - 1 && (
                    <Separator className="my-3" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
