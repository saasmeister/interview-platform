"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import type { Profile } from "@/lib/types";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accName, setAccName] = useState("");
  const [accPassword, setAccPassword] = useState("");
  const [accPasswordConfirm, setAccPasswordConfirm] = useState("");
  const [accSaving, setAccSaving] = useState(false);
  const [accError, setAccError] = useState("");
  const [accSuccess, setAccSuccess] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const userId = user.id;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data || data.role !== "admin") {
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      setProfile(data);

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);

      setUnreadCount(count ?? 0);
    }

    loadProfile();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.href = "/login";
  };

  const handleAccountSave = async () => {
    setAccError("");
    setAccSuccess("");

    if (accPassword && accPassword !== accPasswordConfirm) {
      setAccError("Wachtwoorden komen niet overeen");
      return;
    }
    if (accPassword && accPassword.length < 6) {
      setAccError("Wachtwoord moet minimaal 6 tekens zijn");
      return;
    }

    setAccSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: accName || undefined,
          newPassword: accPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAccError(data.error || "Er is een fout opgetreden");
      } else {
        setAccSuccess("Account bijgewerkt!");
        if (accName && profile) {
          setProfile({ ...profile, full_name: accName });
        }
        setAccPassword("");
        setAccPasswordConfirm("");
      }
    } catch {
      setAccError("Er is een fout opgetreden");
    } finally {
      setAccSaving(false);
    }
  };

  const openAccountDialog = () => {
    setAccName(profile?.full_name || "");
    setAccPassword("");
    setAccPasswordConfirm("");
    setAccError("");
    setAccSuccess("");
    setAccountOpen(true);
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <span className="font-semibold text-slate-900">
                  Interview Platform
                </span>
              </Link>

              <nav className="flex items-center gap-1">
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/admin/interviews">
                  <Button variant="ghost" size="sm">
                    Interviews
                  </Button>
                </Link>
                <Link href="/admin/clients">
                  <Button variant="ghost" size="sm">
                    Klanten
                  </Button>
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin/notifications">
                <Button variant="ghost" size="sm" className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-slate-700">
                      {profile?.full_name ?? "Laden..."}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={openAccountDialog}
                    className="cursor-pointer"
                  >
                    Accountinstellingen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer"
                  >
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Account settings dialog */}
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Accountinstellingen</DialogTitle>
            <DialogDescription>
              Wijzig je naam of wachtwoord.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {accError && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
                {accError}
              </div>
            )}
            {accSuccess && (
              <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md border border-green-200">
                {accSuccess}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Volledige naam
              </label>
              <Input
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Nieuw wachtwoord
              </label>
              <Input
                type="password"
                value={accPassword}
                onChange={(e) => setAccPassword(e.target.value)}
                placeholder="Laat leeg om niet te wijzigen"
              />
            </div>
            {accPassword && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Bevestig nieuw wachtwoord
                </label>
                <Input
                  type="password"
                  value={accPasswordConfirm}
                  onChange={(e) => setAccPasswordConfirm(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAccountSave} disabled={accSaving}>
              {accSaving ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
