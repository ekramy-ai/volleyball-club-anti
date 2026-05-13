// src/i18n.js — i18next initialization for XURA System
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../locales/en/translation.json";
import ar from "../locales/ar/translation.json";

const savedLang = localStorage.getItem("xura_lang") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  nsSeparator: false,
  keySeparator: false,
});

// Apply RTL direction immediately on load
applyDirection(savedLang);

export function applyDirection(lang) {
  const isRTL = lang === "ar";
  document.documentElement.dir  = isRTL ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export function switchLanguage(lang) {
  i18n.changeLanguage(lang);
  localStorage.setItem("xura_lang", lang);
  applyDirection(lang);
}

export default i18n;
