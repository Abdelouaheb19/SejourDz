import React, { useState } from "react";
import { Package } from "../types";
import { Star, Clock, Users, ArrowRight, Heart, Calendar } from "lucide-react";
import { translations, Language } from "../translations";

interface PackageCardProps {
  key?: React.Key | string;
  pkg: Package;
  onViewDetails: (pkg: Package) => void;
  lang?: Language;
}

export default function PackageCard({ pkg, onViewDetails, lang = "fr" }: PackageCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const t = translations[lang];
  const isPromo = pkg.promoPrice !== undefined && pkg.promoPrice < pkg.price;
  const currentPrice = isPromo ? pkg.promoPrice! : pkg.price;

  // Rating count calculated dynamically based on package ID to make it super realistic
  const ratingCount = Math.floor((pkg.id.charCodeAt(0) || 45) * 2.3) + 12;

  // Localized Category
  const getLocalizedCategory = (cat: string) => {
    switch (cat) {
      case "Plage":
        return lang === "ar" ? "🏖️ شواطئي" : lang === "en" ? "Beach" : "Plage";
      case "Culture":
        return lang === "ar" ? "🏛️ ثقافي" : lang === "en" ? "Cultural" : "Culture";
      case "Aventure":
        return lang === "ar" ? "🐪 مغامرة" : lang === "en" ? "Adventure" : "Aventure";
      case "Luxe":
        return lang === "ar" ? "💎 فاخر" : lang === "en" ? "Luxury" : "Luxe";
      case "Famille":
        return lang === "ar" ? "👨‍👩‍👧‍👦 عائلي" : lang === "en" ? "Family" : "Famille";
      default:
        return cat;
    }
  };

  return (
    <div
      id={`pkg-card-${pkg.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-150 hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col h-full relative"
    >
      {/* Container Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={pkg.image}
          alt={pkg.title}
          className="object-cover w-full h-full group-hover:scale-[1.03] transition-all duration-500"
          referrerPolicy="no-referrer"
        />
        
        {/* Wishlist Heart Button - Signature GYG Detail */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3.5 right-3.5 p-2 bg-white/95 text-slate-800 rounded-full shadow-md z-10 transition-transform duration-200 active:scale-90 hover:scale-105"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isLiked ? "fill-rose-500 text-rose-500" : "text-slate-600"
            }`}
          />
        </button>

        {/* Small "Bestseller" or Promo Banner at top left */}
        {isPromo && (
          <span className="absolute top-3.5 left-3.5 bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
            {t.promoBadge}
          </span>
        )}

        {/* Spots Left Warning */}
        {pkg.spotsAvailable <= 4 && pkg.spotsAvailable > 0 && (
          <div className="absolute bottom-3 left-3 bg-[#ff5a00] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {t.spotsLeft.replace("{num}", pkg.spotsAvailable.toString())}
          </div>
        )}
        {pkg.spotsAvailable === 0 && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white text-sm font-black uppercase tracking-widest">
            {t.fullyBooked}
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-1 sm:space-y-1.5">
          {/* Category & Location block */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
            <span>{getLocalizedCategory(pkg.category)}</span>
            <span>•</span>
            <span className="text-[#0071eb]">{pkg.destination}</span>
          </div>
          
          <h3 className="font-serif text-[15px] sm:text-[16px] font-bold text-[#1a2b49] leading-snug tracking-tight group-hover:text-[#ff5a00] transition-colors duration-200">
            {pkg.title}
          </h3>

          {/* Quick specs pill */}
          <div className="flex flex-col gap-1 text-xs text-slate-500 py-1 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {lang === "ar"
                  ? `${pkg.durationDays} أيام / ${pkg.durationDays - 1} ليالي`
                  : lang === "en"
                  ? `${pkg.durationDays} Days / ${pkg.durationDays - 1} Nights`
                  : `${pkg.durationDays} Jours / ${pkg.durationDays - 1} Nuits`}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#ff5a00]" />
              <span>
                {t.departure} {new Date(pkg.startDate).toLocaleDateString(lang === "ar" ? "ar-EG" : lang === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </span>
          </div>

          {/* Dynamic star rating with GYG rating look */}
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 py-0.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-[#ff9900] text-[#ff9900]" />
            </div>
            <span className="font-bold text-[#1a2b49]">{pkg.rating.toFixed(1)}</span>
            <span className="text-slate-400">/ 5</span>
            <span className="text-slate-400">({ratingCount} {t.reviewsCount})</span>
          </div>

          {/* Free Cancellation and Instant booking tag */}
          <div className="pt-1.5 flex flex-wrap gap-1">
            <span className="inline-flex items-[#00875a] text-[10px] font-bold text-[#00875a] bg-[#e6f4ea] px-2 py-0.5 rounded-sm uppercase tracking-wide">
              {t.freeCancellation}
            </span>
            <span className="inline-flex items-[#0071eb] text-[10px] font-bold text-[#0071eb] bg-blue-50 px-2 py-0.5 rounded-sm uppercase tracking-wide">
              {t.instantConfirmation}
            </span>
          </div>
        </div>

        {/* Pricing / Booking Footer */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex items-end justify-between">
          <div>
            {isPromo && (
              <span className="text-[11px] text-slate-400 font-bold line-through block leading-none mb-0.5">
                {pkg.price.toLocaleString("fr-FR")} {lang === "ar" ? "دج" : "DA"}
              </span>
            )}
            <p className="text-[10px] text-slate-400 font-medium leading-none">{t.startingFrom}</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-extrabold text-[#1a2b49]">
                {currentPrice.toLocaleString("fr-FR")} {lang === "ar" ? "دج" : "DA"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">/{lang === "ar" ? "شخص" : lang === "en" ? "pers" : "pers"}</span>
            </div>
          </div>

          <button
            id={`btn-view-${pkg.id}`}
            onClick={() => onViewDetails(pkg)}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-full bg-[#ff5a00] hover:bg-[#e04f00] text-white transition-all duration-200 cursor-pointer shadow-xs whitespace-nowrap"
          >
            {t.viewOffer}
            <ArrowRight className={`w-3.5 h-3.5 ml-1 mr-1 group-hover:translate-x-0.5 transition-transform ${lang === "ar" ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
