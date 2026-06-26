import React from "react";
import { Compass, Palmtree, ShieldAlert, User, Briefcase, Globe, Info, Phone } from "lucide-react";
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

  return (
    <nav id="navbar-main" className="sticky top-0 z-50 bg-natural-card border-b border-natural-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setTab("catalog")}>
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

          {/* Navigation Links & Lang Selector */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            
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

            <button
              id="nav-tab-catalog"
              onClick={() => setTab("catalog")}
              className={`inline-flex items-center px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                currentTab === "catalog"
                  ? "bg-natural-olive/10 text-natural-olive"
                  : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
              }`}
            >
              <Palmtree className="w-4 h-4 mr-1.5 ml-1.5 shrink-0" />
              <span>{t.tabOffers}</span>
            </button>

            <button
              id="nav-tab-client"
              onClick={() => setTab("client")}
              className={`relative inline-flex items-center px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                currentTab === "client"
                  ? "bg-natural-olive/10 text-natural-olive"
                  : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
              }`}
            >
              <User className="w-4 h-4 mr-1.5 ml-1.5 shrink-0" />
              <span>{t.tabClient}</span>
              {bookingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-natural-warm text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                  {bookingCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-about"
              onClick={() => setTab("about")}
              className={`inline-flex items-center px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                currentTab === "about"
                  ? "bg-natural-olive/10 text-natural-olive"
                  : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
              }`}
            >
              <Info className="w-4 h-4 mr-1.5 ml-1.5 shrink-0" />
              <span>{t.tabAbout}</span>
            </button>

            <button
              id="nav-tab-contact"
              onClick={() => setTab("contact")}
              className={`inline-flex items-center px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                currentTab === "contact"
                  ? "bg-natural-olive/10 text-natural-olive"
                  : "text-natural-muted hover:text-natural-main hover:bg-natural-olive/5"
              }`}
            >
              <Phone className="w-4 h-4 mr-1.5 ml-1.5 shrink-0" />
              <span>{t.tabContact}</span>
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
}
