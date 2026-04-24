"use client";

import { useEffect } from "react";
import { useLocale } from "./locale-provider";

export function LanguageHtmlUpdater() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
