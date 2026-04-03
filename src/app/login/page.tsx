"use client";

import { createClient } from "@/lib/supabase/client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage, LanguageProvider, type Lang } from "@/lib/i18n";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, setLang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "no_profile") {
      setError(t.login.noSelfRegister);
    } else if (errorParam) {
      setError(t.login.errorGeneric);
    }

    async function checkSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile?.role === "admin") { window.location.href = "/admin"; return; }
          if (profile?.role === "client") { window.location.href = "/client"; return; }
          // Sessie bestaat maar geen profiel -> uitloggen om loop te voorkomen
          await supabase.auth.signOut();
        }
      } catch {
        await supabase.auth.signOut();
      }
      setLoading(false);
    }

    checkSession();
  }, [supabase, router, searchParams]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (signInData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", signInData.user.id)
          .single();
        window.location.href = profile?.role === "admin" ? "/admin" : "/client";
      }
    } catch (err: any) {
      setError(
        err.message?.includes("Invalid") ? t.login.errorInvalid : t.login.errorGeneric
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-muted-foreground">{t.general.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      {/* Language toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
        {(["nl", "en"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              lang === l
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {l === "nl" ? "NL" : "EN"}
          </button>
        ))}
      </div>

      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="pt-8 pb-8 space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="w-7 h-7">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Interview Platform</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t.login.subtitle}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Email/password form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <Input
              type="email"
              placeholder={t.login.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
            <Input
              type="password"
              placeholder={t.login.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-11"
            />
            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting ? "..." : t.login.signinBtn}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            {t.login.noSelfRegister}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <LanguageProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-muted-foreground">Loading...</p></div>}>
        <LoginPageInner />
      </Suspense>
    </LanguageProvider>
  );
}
