"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Lang = "nl" | "en";

const translations = {
  nl: {
    // Login
    login: {
      subtitle: "Log in om interviews te beheren of uit te voeren",
      googleBtn: "Inloggen met Google",
      googleHint: "Je wordt doorgestuurd naar Google om in te loggen",
      emailBtn: "Doorgaan met e-mail",
      emailPlaceholder: "E-mailadres",
      passwordPlaceholder: "Wachtwoord",
      signinBtn: "Inloggen",
      signupBtn: "Account aanmaken",
      signinTab: "Inloggen",
      signupTab: "Registreren",
      orDivider: "of",
      noAccount: "Nog geen account?",
      hasAccount: "Al een account?",
      forgotPassword: "Wachtwoord vergeten?",
      checkEmail: "Check je e-mail voor een bevestigingslink.",
      errorGeneric: "Er is een fout opgetreden. Probeer het opnieuw.",
      errorInvalid: "Ongeldig e-mailadres of wachtwoord.",
    },
    // Nav
    nav: {
      interviews: "Interviews",
      profile: "Mijn Profiel",
      uploads: "Uploads",
      logout: "Uitloggen",
      loading: "Laden...",
      newNotifications: "nieuw",
    },
    // Client dashboard
    dashboard: {
      title: "Mijn Interviews",
      subtitle: "Overzicht van al je toegewezen interviews",
      empty: "Geen interviews gevonden",
      emptyHint: "Je hebt nog geen interviews toegewezen gekregen.",
      statusNotStarted: "Niet gestart",
      statusInProgress: "Bezig",
      statusCompleted: "Afgerond",
      startBtn: "Starten",
      continueBtn: "Verdergaan",
      viewBtn: "Bekijken",
      progress: "voortgang",
    },
    // Interview page
    interview: {
      thinking: "aan het nadenken",
      placeholder: "Typ je antwoord...",
      hint: "Enter om te versturen · Shift+Enter voor nieuwe regel",
      pause: "Pauzeer",
      finish: "Afronden",
      confirmTitle: "Interview afronden",
      confirmDesc: "Weet je zeker dat je dit interview wilt afronden? Na het afronden worden je documenten automatisch gegenereerd.",
      confirmCancel: "Annuleren",
      confirmOk: "Ja, afronden",
      confirming: "Afronden...",
      completed: "Dit interview is afgerond",
      completedBadge: "Afgerond",
      backToOverview: "Terug naar overzicht",
      notFound: "Interview niet gevonden",
      loading: "Interview laden...",
      overview: "Overzicht",
      allMessages: "Alle berichten uit je interview",
    },
    // Profile
    profile: {
      title: "Mijn Profiel",
      subtitle: "Jouw gepersonaliseerde documenten op basis van je interviews",
      noDoc: "Nog niet gegenereerd",
      noDocHint: "Rond een interview af om dit document te genereren.",
      lastUpdated: "Laatst bijgewerkt",
      version: "Versie",
      viewFull: "Bekijk volledig document",
      viewDashboard: "Toon dashboard",
      pendingSuggestion: "voorgestelde wijziging",
      pendingSuggestions: "voorgestelde wijzigingen",
      suggestionBanner: "Er zijn nieuwe inzichten gevonden die dit document kunnen verbeteren.",
      approve: "Goedkeuren & Toepassen",
      reject: "Afwijzen",
      fromInterview: "Uit interview",
      fromUpload: "Uit upload",
      back: "← Terug naar profiel",
      processing: "Bezig...",
      suggestionHint: "💡 Nieuwe suggestie beschikbaar op basis van",
      suggestionHintUpload: "upload",
      suggestionHintInterview: "interview",
    },
    // Uploads
    uploads: {
      title: "Uploads",
      subtitle: "Upload bestanden om je profieldocumenten te verbeteren",
      uploadBtn: "Bestand uploaden",
      empty: "Nog geen uploads",
      emptyHint: "Upload bestanden zoals je website, brochure of eerder werk.",
      statusProcessing: "Verwerken",
      statusProcessed: "Verwerkt",
      statusError: "Fout",
      fileName: "Bestandsnaam",
      uploadedAt: "Geüpload op",
      process: "Verwerken",
    },
    // General
    general: {
      loading: "Laden...",
      error: "Er is een fout opgetreden",
      save: "Opslaan",
      cancel: "Annuleren",
      confirm: "Bevestigen",
      back: "Terug",
    },
  },
  en: {
    // Login
    login: {
      subtitle: "Log in to manage or complete interviews",
      googleBtn: "Sign in with Google",
      googleHint: "You will be redirected to Google to sign in",
      emailBtn: "Continue with email",
      emailPlaceholder: "Email address",
      passwordPlaceholder: "Password",
      signinBtn: "Sign in",
      signupBtn: "Create account",
      signinTab: "Sign in",
      signupTab: "Register",
      orDivider: "or",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      forgotPassword: "Forgot password?",
      checkEmail: "Check your email for a confirmation link.",
      errorGeneric: "An error occurred. Please try again.",
      errorInvalid: "Invalid email address or password.",
    },
    // Nav
    nav: {
      interviews: "Interviews",
      profile: "My Profile",
      uploads: "Uploads",
      logout: "Sign out",
      loading: "Loading...",
      newNotifications: "new",
    },
    // Client dashboard
    dashboard: {
      title: "My Interviews",
      subtitle: "Overview of all your assigned interviews",
      empty: "No interviews found",
      emptyHint: "You have not been assigned any interviews yet.",
      statusNotStarted: "Not started",
      statusInProgress: "In progress",
      statusCompleted: "Completed",
      startBtn: "Start",
      continueBtn: "Continue",
      viewBtn: "View",
      progress: "progress",
    },
    // Interview page
    interview: {
      thinking: "thinking",
      placeholder: "Type your answer...",
      hint: "Enter to send · Shift+Enter for new line",
      pause: "Pause",
      finish: "Finish",
      confirmTitle: "Finish interview",
      confirmDesc: "Are you sure you want to finish this interview? Your documents will be generated automatically afterwards.",
      confirmCancel: "Cancel",
      confirmOk: "Yes, finish",
      confirming: "Finishing...",
      completed: "This interview has been completed",
      completedBadge: "Completed",
      backToOverview: "Back to overview",
      notFound: "Interview not found",
      loading: "Loading interview...",
      overview: "Overview",
      allMessages: "All messages from your interview",
    },
    // Profile
    profile: {
      title: "My Profile",
      subtitle: "Your personalised documents based on your interviews",
      noDoc: "Not yet generated",
      noDocHint: "Complete an interview to generate this document.",
      lastUpdated: "Last updated",
      version: "Version",
      viewFull: "View full document",
      viewDashboard: "Show dashboard",
      pendingSuggestion: "suggested change",
      pendingSuggestions: "suggested changes",
      suggestionBanner: "New insights were found that can improve this document.",
      approve: "Approve & Apply",
      reject: "Reject",
      fromInterview: "From interview",
      fromUpload: "From upload",
      back: "← Back to profile",
      processing: "Processing...",
      suggestionHint: "💡 New suggestion available based on",
      suggestionHintUpload: "upload",
      suggestionHintInterview: "interview",
    },
    // Uploads
    uploads: {
      title: "Uploads",
      subtitle: "Upload files to improve your profile documents",
      uploadBtn: "Upload file",
      empty: "No uploads yet",
      emptyHint: "Upload files such as your website, brochure, or previous work.",
      statusProcessing: "Processing",
      statusProcessed: "Processed",
      statusError: "Error",
      fileName: "File name",
      uploadedAt: "Uploaded at",
      process: "Process",
    },
    // General
    general: {
      loading: "Loading...",
      error: "An error occurred",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      back: "Back",
    },
  },
};

export type Translations = typeof translations.nl;

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("nl");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Lang | null;
    if (stored === "nl" || stored === "en") {
      setLangState(stored);
    } else {
      const browserLang = navigator.language.startsWith("nl") ? "nl" : "en";
      setLangState(browserLang);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem("lang", l);
    setLangState(l);
  }, []);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
