"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { useLanguage, LanguageProvider, type Lang } from "@/lib/i18n";

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (data) setProfile(data);
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    }
    loadProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/login";
  };

  const initials = profile?.full_name
    ?.split(" ").map((n) => n[0]).join("").toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/client" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="w-4 h-4">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <span className="font-semibold text-slate-900">Interview Platform</span>
              </Link>

              <nav className="flex items-center gap-1">
                <Link href="/client">
                  <Button variant="ghost" size="sm">{t.nav.interviews}</Button>
                </Link>
                <Link href="/client/profile">
                  <Button variant="ghost" size="sm">{t.nav.profile}</Button>
                </Link>
                <Link href="/client/uploads">
                  <Button variant="ghost" size="sm">{t.nav.uploads}</Button>
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* Language toggle */}
              <div className="flex items-center gap-0.5 bg-slate-100 rounded-md p-0.5">
                {(["nl", "en"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      lang === l ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              {unreadCount > 0 && (
                <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
                  {unreadCount} {t.nav.newNotifications}
                </span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-slate-700">
                      {profile?.full_name ?? t.nav.loading}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ClientLayoutInner>{children}</ClientLayoutInner>
    </LanguageProvider>
  );
}
