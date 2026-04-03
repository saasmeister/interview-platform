"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage, LanguageProvider, type Lang } from "@/lib/i18n";

function InvitePageInner() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const { lang, setLang, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/invite?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok) {
          if (data.error === "already_used") {
            setTokenError(t.invite.alreadyUsed);
          } else {
            setTokenError(t.invite.invalidToken);
          }
          setLoading(false);
          return;
        }

        setEmail(data.email);
        setFullName(data.fullName || "");
        setLoading(false);
      } catch {
        setTokenError(t.invite.invalidToken);
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError(t.invite.passwordMismatch);
      return;
    }

    if (password.length < 6) {
      setError(t.invite.passwordHint);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "already_used") {
          setError(t.invite.alreadyUsed);
        } else if (data.error === "invalid_token") {
          setError(t.invite.invalidToken);
        } else {
          setError(data.error || t.invite.errorGeneric);
        }
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError(t.invite.errorGeneric);
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

          {tokenError ? (
            <div className="text-center space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{tokenError}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
                className="w-full"
              >
                {t.invite.backToLogin}
              </Button>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">{t.invite.success}</p>
              </div>
              <Button onClick={() => router.push("/login")} className="w-full">
                {t.invite.loginLink}
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">
                  {t.invite.title}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t.invite.subtitle}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t.invite.emailLabel}
                  </label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="h-11 bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t.invite.nameLabel}
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    disabled
                    className="h-11 bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t.invite.passwordLabel}
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t.invite.passwordHint}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {t.invite.passwordConfirmLabel}
                  </label>
                  <Input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={submitting}
                >
                  {submitting ? t.invite.submitting : t.invite.submitBtn}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <LanguageProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        }
      >
        <InvitePageInner />
      </Suspense>
    </LanguageProvider>
  );
}
