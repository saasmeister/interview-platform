"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Message, AssignmentWithInterview } from "@/lib/types";
import { useLanguage } from "@/lib/i18n";

// Typing animatie component — toont tekst woord voor woord
function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const words = text.split(" ");

  useEffect(() => {
    if (currentIndex < words.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => (prev ? prev + " " + words[currentIndex] : words[currentIndex]));
        setCurrentIndex((prev) => prev + 1);
      }, 30 + Math.random() * 20); // Variabele snelheid voor natuurlijk effect
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, words, onComplete]);

  return (
    <span>
      {displayedText}
      {currentIndex < words.length && (
        <span className="inline-block w-0.5 h-4 bg-slate-400 ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  );
}

// Thinking indicator met animated dots
function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
          <path d="M10 21h4" />
        </svg>
      </div>
      <div className="pt-1">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1.2s" }} />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1.2s" }} />
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1.2s" }} />
          </div>
          <span className="text-xs text-slate-400 ml-1">{t.interview.thinking}</span>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<AssignmentWithInterview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);
  const [animatingMessageId, setAnimatingMessageId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completing, setCompleting] = useState(false);
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [assignmentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Auto-start
  useEffect(() => {
    if (!loading && assignment && messages.length === 0 && !autoStarted && !isCompleted) {
      setAutoStarted(true);
      startInterview();
    }
  }, [loading, assignment, messages, autoStarted, isCompleted]);

  // Auto-resize textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
  }, []);

  async function loadData() {
    const { data: assignmentData } = await supabase
      .from("assignments")
      .select(`*, interview:interviews(*)`)
      .eq("id", assignmentId)
      .single();

    if (assignmentData) {
      setAssignment(assignmentData as any);
      setIsCompleted(assignmentData.status === "completed");
      setProgress((assignmentData as any).progress ?? 0);
    }

    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("assignment_id", assignmentId)
      .order("created_at", { ascending: true });

    if (messagesData) setMessages(messagesData);
    setLoading(false);
  }

  async function startInterview() {
    setSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, autoStart: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Er is een fout opgetreden");

      if (data.progress !== null && data.progress !== undefined) {
        setProgress(data.progress);
      }

      const { data: updatedMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("created_at", { ascending: true });

      if (updatedMessages && updatedMessages.length > 0) {
        const lastMsg = updatedMessages[updatedMessages.length - 1];
        if (lastMsg.role === "assistant") {
          setAnimatingMessageId(lastMsg.id);
        }
        setMessages(updatedMessages);
      }
    } catch (error: any) {
      console.error("Auto-start error:", error);
    }
    setSending(false);
  }

  async function sendMessage() {
    if (!input.trim() || sending || isCompleted) return;

    const userMessage = input.trim();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setSending(true);

    const tempUserMsg: Message = {
      id: "temp-user",
      assignment_id: assignmentId,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, message: userMessage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Er is een fout opgetreden");

      if (data.progress !== null && data.progress !== undefined) {
        setProgress(data.progress);
      }

      const { data: updatedMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("created_at", { ascending: true });

      if (updatedMessages && updatedMessages.length > 0) {
        const lastMsg = updatedMessages[updatedMessages.length - 1];
        if (lastMsg.role === "assistant") {
          setAnimatingMessageId(lastMsg.id);
        }
        setMessages(updatedMessages);
      }
    } catch (error: any) {
      alert(error.message);
      setMessages((prev) => prev.filter((m) => m.id !== "temp-user"));
      setInput(userMessage);
    }

    setSending(false);
    textareaRef.current?.focus();
  }

  async function confirmComplete() {
    setCompleting(true);
    await supabase
      .from("assignments")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", assignmentId);

    if (assignment) {
      await supabase.from("notifications").insert({
        user_id: assignment.assigned_by,
        message: `Interview "${assignment.interview?.title}" is afgerond`,
        link: `/admin/assignments/${assignmentId}`,
        read: false,
      });

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "completed", assignmentId }),
      }).catch(() => {});

      // Genereer document automatisch na afronding
      fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      }).catch(() => {});
    }

    setIsCompleted(true);
    setShowCompleteDialog(false);
    setCompleting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 animate-pulse" />
          <p className="text-sm text-slate-400">Interview laden...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Interview niet gevonden</p>
      </div>
    );
  }

  // Afgerond: overzicht
  if (isCompleted) {
    const outputContent = (assignment as any).output_content as string | null;
    const isContentInterview = (assignment.interview as any)?.interview_type === "content";

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {assignment.interview?.title}
            </h1>
            <p className="text-muted-foreground mt-1">{t.interview.completed}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700">{t.interview.completedBadge}</Badge>
            {isContentInterview && (
              <Badge className="bg-green-100 text-green-700 text-xs">Content</Badge>
            )}
          </div>
        </div>

        {/* Content output (alleen bij content-interviews) */}
        {outputContent && (
          <Card className="border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-green-800">Output</CardTitle>
                  <CardDescription>De gegenereerde content op basis van je interview</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const blob = new Blob([outputContent], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${assignment.interview?.title?.replace(/\s+/g, "-").toLowerCase() ?? "output"}-${new Date().toISOString().split("T")[0]}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download .md
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <article className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900">
                <div dangerouslySetInnerHTML={{ __html: outputContent.replace(/\n/g, "<br/>") }} />
              </article>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gesprek</CardTitle>
            <CardDescription>Alle berichten uit je interview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  {msg.role === "assistant" ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                        <path d="M10 21h4" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-slate-600">Jij</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => router.push("/client")}>
          {t.interview.backToOverview}
        </Button>
      </div>
    );
  }

  // Actief interview: Claude-achtige chat
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header met progressiebalk */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                <path d="M10 21h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">{assignment.interview?.title}</h1>
              <p className="text-xs text-slate-400">{assignment.interview?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: progress < 30
                      ? "linear-gradient(90deg, #f97316, #fb923c)"
                      : progress < 70
                      ? "linear-gradient(90deg, #f97316, #eab308)"
                      : "linear-gradient(90deg, #22c55e, #16a34a)",
                  }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums w-8">{progress}%</span>
            </div>
            <div className="w-px h-5 bg-slate-200" />
            <button
              onClick={() => router.push("/client")}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-50"
            >
              {t.interview.pause}
            </button>
            <button
              onClick={() => setShowCompleteDialog(true)}
              className="text-xs text-green-600 hover:text-green-700 transition-colors px-3 py-1.5 rounded-md hover:bg-green-50 font-medium"
            >
              {t.interview.finish}
            </button>
          </div>
        </div>
      </div>

      {/* Chat berichten — centered zoals Claude */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {messages.filter(m => m.id !== "temp-user" || !messages.some(mm => mm.id !== "temp-user" && mm.role === "user" && mm.content === m.content)).map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 animate-fade-in ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                    <path d="M10 21h4" />
                  </svg>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-slate-600">Jij</span>
                </div>
              )}

              <div className={`flex-1 min-w-0 ${msg.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`inline-block text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "assistant"
                      ? "text-slate-800"
                      : "bg-slate-100 text-slate-800 rounded-2xl rounded-tr-sm px-4 py-2.5"
                  }`}
                >
                  {msg.role === "assistant" && animatingMessageId === msg.id ? (
                    <TypewriterText
                      text={msg.content}
                      onComplete={() => setAnimatingMessageId(null)}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </div>
          ))}

          {sending && <ThinkingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input — minimaal en clean zoals Claude */}
      <div className="border-t bg-white">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="relative flex items-end bg-slate-50 rounded-2xl border border-slate-200 focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-100 transition-all">
            <textarea
              ref={textareaRef}
              placeholder={t.interview.placeholder}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={sending}
              className="flex-1 bg-transparent border-0 resize-none px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 max-h-40"
              style={{ minHeight: "44px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="m-1.5 p-2 rounded-xl bg-slate-900 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
          <p className="text-[11px] text-slate-300 text-center mt-2">
            {t.interview.hint}
          </p>
        </div>
      </div>

      {/* Afronden bevestiging dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Interview afronden</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit interview wilt afronden? Na het afronden worden je documenten automatisch gegenereerd.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={completing}
            >
              Annuleren
            </Button>
            <Button
              onClick={confirmComplete}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {completing ? "Afronden..." : "Ja, afronden"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
