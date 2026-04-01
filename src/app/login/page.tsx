"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
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
  const [mode, setMode] = useState<"google" | "email">("google");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("error")) {
      setError(t.login.errorGeneric);
    }

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile?.role === "admin") { router.push("/admin"); return; }
        if (profile?.role === "client") { router.push("/client"); return; }
      }
      setLoading(false);
    }

    checkSession();
  }, [supabase, router, searchParams]);

  const handleGoogleLogin = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { queryParams: { prompt: "select_account" } },
    });
    if (error) setError(t.login.errorGeneric);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess(t.login.checkEmail);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange handled by Supabase — redirect via session check
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          router.push(profile?.role === "admin" ? "/admin" : "/client");
        }
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

          {/* Google button */}
          <Button variant="outline" className="w-full h-12 text-base" onClick={handleGoogleLogin}>
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t.login.googleBtn}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">{t.login.orDivider}</span>
            </div>
          </div>

          {/* Email/password form */}
          <div>
            {/* Sign in / Sign up tabs */}
            <div className="flex rounded-lg border border-slate-200 p-1 mb-4">
              <button
                onClick={() => { setAuthMode("signin"); setError(null); setSuccess(null); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  authMode === "signin" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.login.signinTab}
              </button>
              <button
                onClick={() => { setAuthMode("signup"); setError(null); setSuccess(null); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  authMode === "signup" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.login.signupTab}
              </button>
            </div>

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
                {submitting
                  ? "..."
                  : authMode === "signin"
                  ? t.login.signinBtn
                  : t.login.signupBtn}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <LanguageProvider>
      <LoginPageInner />
    </LanguageProvider>
  );
}
