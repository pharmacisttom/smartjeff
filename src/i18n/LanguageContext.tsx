"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Locale, defaultLocale, dictionary, SUPPORTED_LANGUAGES, LocaleInfo } from "./config";

interface LanguageContextType {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (path: string, fallback?: string) => string;
  languages: LocaleInfo[];
  currentLanguage: LocaleInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("smarto_locale") as Locale;
      if (saved && (saved === "th" || saved === "my" || saved === "km" || saved === "en")) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = defaultLocale;
      }
    } catch (e) {
      console.error("Failed to read locale:", e);
    } finally {
      setMounted(true);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem("smarto_locale", next);
      document.documentElement.lang = next;
      window.dispatchEvent(new CustomEvent("smarto:locale-change", { detail: next }));
    } catch (e) {
      console.error("Failed to save locale:", e);
    }
  }, []);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      const parts = path.split(".");
      if (parts.length !== 2) return fallback || path;

      const [section, key] = parts;
      const langDict = dictionary[locale] || dictionary[defaultLocale];
      const sectionDict = langDict?.[section];
      if (sectionDict && typeof sectionDict[key] === "string") {
        return sectionDict[key];
      }

      // Fallback to defaultLocale (Thai)
      const defaultSection = dictionary[defaultLocale]?.[section];
      if (defaultSection && typeof defaultSection[key] === "string") {
        return defaultSection[key];
      }

      return fallback || path;
    },
    [locale]
  );

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === locale) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      locale: defaultLocale,
      setLocale: () => {},
      t: (path: string, fallback?: string) => {
        const parts = path.split(".");
        if (parts.length === 2) {
          const [sec, k] = parts;
          return dictionary[defaultLocale]?.[sec]?.[k] || fallback || path;
        }
        return fallback || path;
      },
      languages: SUPPORTED_LANGUAGES,
      currentLanguage: SUPPORTED_LANGUAGES[0],
    };
  }
  return context;
}
