import React, { useState } from "react";
import { Compass, Palmtree, ShieldAlert, User, Briefcase, Globe, Info, Phone, Menu, X } from "lucide-react";
import { translations, Language } from "../translations";

interface NavbarProps {
  currentTab: "catalog" | "client" | "admin" | "about" | "contact";
  setTab: (tab: "catalog" | "client" | "admin" | "about" | "contact") => void;
  bookingCount: number;
  lang: Language;
  setLang: (lang: Language) => void;
}

export default function Navbar({ currentTab, setTab, bookingCount, lang, setLang }: NavbarProps) {
  const t = translations[lang];
  const [isOpen, setIsOpen] = useState(false);

  const handleTabClick = (tab: "catalog" | "client" | "admin" | "about" | "contact") => {
    setTab(tab);
    setIsOpen(false);
  };

  return (
    <nav id="navbar-main" className="sticky top-0 z-50 bg-natural-card border-b border-natural-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => handleTabClick("catalog")}>
            <div className="p-2 bg-natural-olive/10 rounded-lg text-natural-olive">
              <Compass className="w-6 h-6 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-natural-olive">
                {lang === "ar" ? "سياحة دي-زاد" : "Séjours DZ"}
              </span>
              <span className="text-[10px] block text-natural-warm font-semibold tracking-wider uppercase">
                {t.brandSubtitle}
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: Navigation Links (Desktop) & Menu Trigger (Mobile) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Lang Dropdown Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1.5 relative group">
              <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="bg-transparent text-[11px] font-extrabold text-slate-700 focus:outline-hidden cursor-pointer accent-[#ff5a00] uppercase"
                title="Select Language"
              >
                <option value="fr">🇨🇷 Fr</option>
                <option value="en">🇬🇧 En</option>
                <option value="ar">🇩🇿 Ar</option>
              </select>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <button
                id="nav-tab-catalog"
                onClick={() => handleTabClick("catalog")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                  currentTab === "catalog"
                    ? "bg-natural-olive/10 text-natural-olive"
                    : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
                }`}
              >
                <Palmtree className="w-4 h-4 shrink-0" />
                <span>{t.tabOffers}</span>
              </button>

              <button
                id="nav-tab-client"
                onClick={() => handleTabClick("client")}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                  currentTab === "client"
                    ? "bg-natural-olive/10 text-natural-olive"
                    : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>{t.tabClient}</span>
                {bookingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-natural-warm text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                    {bookingCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-about"
                onClick={() => handleTabClick("about")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                  currentTab === "about"
                    ? "bg-natural-olive/10 text-natural-olive"
                    : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
                }`}
              >
                <Info className="w-4 h-4 shrink-0" />
                <span>{t.tabAbout}</span>
              </button>

              <button
                id="nav-tab-contact"
                onClick={() => handleTabClick("contact")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                  currentTab === "contact"
                    ? "bg-natural-olive/10 text-natural-olive"
                    : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
                }`}
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>{t.tabContact}</span>
              </button>

              {currentTab === "admin" && (
                <button
                  id="nav-tab-admin"
                  onClick={() => handleTabClick("admin")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-red-50 text-red-700 whitespace-nowrap cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <span>{t.tabAdmin || "Admin"}</span>
                </button>
              )}
            </div>

            {/* Hamburger Button (Mobile/Tablet Only) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-natural-muted hover:text-natural-main hover:bg-natural-olive/5 transition-colors focus:outline-hidden cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Menu Dropdown */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-natural-border bg-natural-card ${
          isOpen ? "max-h-96 opacity-100 py-3" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 space-y-1">
          <button
            onClick={() => handleTabClick("catalog")}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              currentTab === "catalog"
                ? "bg-natural-olive/10 text-natural-olive"
                : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
            }`}
          >
            <Palmtree className="w-5 h-5 shrink-0" />
            <span>{t.tabOffers}</span>
          </button>

          <button
            onClick={() => handleTabClick("client")}
            className={`relative flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              currentTab === "client"
                ? "bg-natural-olive/10 text-natural-olive"
                : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
            }`}
          >
            <User className="w-5 h-5 shrink-0" />
            <span>{t.tabClient}</span>
            {bookingCount > 0 && (
              <span className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-natural-warm text-[10px] font-bold text-white ring-2 ring-white animate-pulse`}>
                {bookingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick("about")}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              currentTab === "about"
                ? "bg-natural-olive/10 text-natural-olive"
                : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
            }`}
          >
            <Info className="w-5 h-5 shrink-0" />
            <span>{t.tabAbout}</span>
          </button>

          <button
            onClick={() => handleTabClick("contact")}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              currentTab === "contact"
                ? "bg-natural-olive/10 text-natural-olive"
                : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
            }`}
          >
            <Phone className="w-5 h-5 shrink-0" />
            <span>{t.tabContact}</span>
          </button>

          {currentTab === "admin" && (
            <button
              onClick={() => handleTabClick("admin")}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl bg-red-50 text-red-700 transition-all cursor-pointer"
            >
              <Briefcase className="w-5 h-5 shrink-0" />
              <span>{t.tabAdmin || "Admin"}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
