import React, { useState } from "react";
import { Package, Booking } from "../types";
import { Check, X, Calendar, MapPin, Undo2, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { translations, Language } from "../translations";

interface PackageDetailsProps {
  pkg: Package;
  onBack: () => void;
  onConfirmBooking: (bookingInput: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    passengers: string[];
    specialRequests: string;
    aiCustomization?: string;
  }) => void;
  lang?: Language;
}

export default function PackageDetails({ pkg, onBack, onConfirmBooking, lang = "fr" }: PackageDetailsProps) {
  const t = translations[lang];
  const [bookingStep, setBookingStep] = useState<"details" | "booking">("details");
  
  // Booking Form State
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [numPassengers, setNumPassengers] = useState(1);
  const [passengers, setPassengers] = useState<string[]>([""]);
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const handleNumPassengersChange = (val: number) => {
    const count = Math.min(pkg.spotsAvailable, Math.max(1, val));
    setNumPassengers(count);
    
    // adjust passengers array size
    const updated = [...passengers];
    if (count > updated.length) {
      while (updated.length < count) {
        updated.push("");
      }
    } else {
      updated.splice(count);
    }
    setPassengers(updated);
  };

  const handlePassengerNameChange = (index: number, name: string) => {
    const updated = [...passengers];
    updated[index] = name;
    setPassengers(updated);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      setBookingError("Veuillez saisir les coordonnées principales du titulaire.");
      return;
    }

    // Ensure all passenger names are filled
    const invalidPass = passengers.some(p => !p.trim());
    if (invalidPass) {
      setBookingError("Veuillez saisir le nom complet de tous les voyageurs.");
      return;
    }

    setBookingInProgress(true);
    setBookingError("");

    try {
      onConfirmBooking({
        clientName,
        clientEmail,
        clientPhone,
        passengers,
        specialRequests,
        aiCustomization: undefined
      });
    } catch (err: any) {
      setBookingError(err.message || "Erreur de réservation.");
      setBookingInProgress(false);
    }
  };

  const isPromo = pkg.promoPrice !== undefined && pkg.promoPrice < pkg.price;
  const currentPrice = isPromo ? pkg.promoPrice! : pkg.price;

  return (
    <div id={`details-container-${pkg.id}`} className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      {/* Return Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center text-sm font-medium text-natural-muted hover:text-natural-olive mb-6 transition-colors cursor-pointer"
      >
        <Undo2 className="w-4 h-4 mr-2" />
        <span>Retourner au catalogue des séjours</span>
      </button>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden h-[300px] sm:h-[400px] mb-8 shadow-xs">
        <img
          src={pkg.image}
          alt={pkg.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-natural-main/90 via-natural-main/40 to-transparent flex flex-col justify-end p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-natural-olive text-white text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-md">
              {pkg.category}
            </span>
            <span className="bg-white/20 backdrop-blur-xs text-white text-xs font-medium px-3 py-1 rounded-md flex items-center gap-1">
              {pkg.durationDays} Jours / {(pkg.durationDays - 1)} Nuits
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            {pkg.title}
          </h1>
          <p className="text-white/90 text-sm sm:text-base mt-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-natural-warm" />
            <span>{pkg.destination}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Columns (Details Or Booking) */}
        <div className="lg:col-span-2 space-y-8">
          {bookingStep === "details" ? (
            <>
              {/* Description */}
              <div className="bg-white rounded-2xl p-6 border border-natural-border shadow-xs">
                <h2 className="font-serif text-lg font-bold text-natural-main border-b border-natural-border pb-3 mb-4">
                  Présentation du Package
                </h2>
                <p className="text-natural-muted text-sm leading-relaxed whitespace-pre-line">
                  {pkg.description}
                </p>
              </div>

              {/* Inclusions and Exclusions split layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* INCLUS */}
                <div className="bg-natural-olive/10 rounded-2xl p-6 border border-natural-border/60 shadow-xs">
                  <h3 className="text-sm font-bold text-natural-olive uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Check className="w-5 h-5 text-natural-olive stroke-[3]" />
                    <span>Ce qui est inclus</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {pkg.inclusions.map((inc, index) => (
                      <li key={index} className="flex items-start text-xs text-natural-olive font-medium">
                        <Check className="w-4 h-4 text-natural-olive mr-2 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* NON INCLUS */}
                <div className="bg-natural-warm/10 rounded-2xl p-6 border border-natural-border/60 shadow-xs">
                  <h3 className="text-sm font-bold text-natural-warm uppercase tracking-wider flex items-center gap-2 mb-4">
                    <X className="w-5 h-5 text-natural-warm stroke-[3]" />
                    <span>Non inclus</span>
                  </h3>
                  <ul className="space-y-2.5">
                    {pkg.exclusions.map((exc, index) => (
                      <li key={index} className="flex items-start text-xs text-natural-warm font-medium">
                        <X className="w-4 h-4 text-natural-warm mr-2 shrink-0 mt-0.5" />
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Day-by-day Itinerary Program */}
              <div className="bg-white rounded-2xl p-6 border border-natural-border shadow-xs">
                <h2 className="font-serif text-lg font-bold text-natural-main border-b border-natural-border pb-3 mb-6">
                  Le Programme Jour après Jour
                </h2>
                <div className="relative border-l border-natural-olive/20 ml-4 space-y-6">
                  {pkg.schedule.map((day) => (
                    <div key={day.day} className="relative pl-6">
                      {/* Timeline dot */}
                      <span className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-natural-olive border-2 border-white text-[9px] font-bold text-white">
                        {day.day}
                      </span>
                      <h4 className="text-sm font-bold text-natural-main">
                        Jour {day.day} : {day.title}
                      </h4>
                      <p className="text-natural-muted text-xs mt-1 leading-relaxed">
                        {day.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions d'annulation */}
              <div className="bg-natural-bg rounded-2xl p-6 border border-natural-border text-xs text-natural-muted">
                <h4 className="font-serif font-bold text-natural-main mb-2 uppercase tracking-wide">
                  Conditions de réservation & d'annulation
                </h4>
                <p className="leading-relaxed">
                  • Annulation gratuite jusqu'à 30 jours avant le départ. <br />
                  • De 29 à 15 jours : retenue de 30% du montant total (correspondant à l'acompte). <br />
                  • Moins de 15 jours : 100% de retenue. <br />
                  • Les places disponibles sont mises à jour en temps réel selon les confirmations de vols de notre agence locale.
                </p>
              </div>
            </>
          ) : (
            /* BOOKING REGISTRATION FORM SCREEN */
            <div className="bg-white rounded-2xl p-6 border border-natural-border shadow-sm">
              <div className="flex items-center justify-between border-b border-natural-border pb-4 mb-6">
                <h2 className="font-serif text-lg font-bold text-natural-main">Saisie des Voyageurs & Validation</h2>
                <button
                  type="button"
                  onClick={() => setBookingStep("details")}
                  className="text-xs font-semibold text-natural-olive hover:text-natural-warm"
                >
                  Revenir à la fiche
                </button>
              </div>

              {bookingError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-900 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{bookingError}</span>
                </div>
              )}

              <form onSubmit={handleBookSubmit} className="space-y-6">
                {/* Main Client Coordinates */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-natural-soft">
                    1. Coordonnées de Facturation (Titulaire)
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-natural-main mb-1">Nom Complet *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Jean Dupont"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-natural-main mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="Ex: jean.dupont@email.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-natural-main mb-1">Numéro de Téléphone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: +33 6 12 34 56 78"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                    />
                  </div>
                </div>

                {/* Traveler Passenger details */}
                <div className="space-y-4 pt-4 border-t border-natural-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-natural-soft">
                      2. Liste des Voyageurs à inscrire
                    </h3>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-natural-muted font-medium">Nombre de places :</label>
                      <select
                        value={numPassengers}
                        onChange={(e) => handleNumPassengersChange(parseInt(e.target.value))}
                        className="text-xs font-bold border border-natural-border rounded-lg p-1 bg-white focus:outline-hidden"
                      >
                        {Array.from({ length: pkg.spotsAvailable }, (_, i) => i + 1).slice(0, 8).map((n) => (
                          <option key={n} value={n}>{n} {n > 1 ? "personnes" : "personne"}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {passengers.map((pName, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <span className="text-xs font-bold text-natural-muted shrink-0 w-8">
                          N° {index + 1} :
                        </span>
                        <input
                          type="text"
                          required
                          placeholder={`Nom complet du voyageur ${index + 1}`}
                          value={pName}
                          onChange={(e) => handlePassengerNameChange(index, e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Request */}
                <div className="space-y-2 pt-4 border-t border-natural-border">
                  <label className="block text-xs font-bold uppercase tracking-wider text-natural-muted">
                    3. Notes ou Remarques Spéciales
                  </label>
                  <textarea
                    placeholder="Chambres twin, régimes alimentaires, horaires d'arrivée particuliers..."
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-natural-border bg-natural-bg/10 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                  />
                </div>

                {/* Submitting Buttons */}
                <div className="pt-6 border-t border-natural-border flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingStep("details")}
                    className="h-11 px-5 text-xs font-bold rounded-xl text-natural-soft hover:bg-natural-bg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={bookingInProgress}
                    className="h-11 px-6 text-xs font-bold rounded-xl bg-natural-olive text-white hover:bg-natural-olive-hover transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {bookingInProgress ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Création en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirmer ma réservation</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar Sidebar Booking Info Panel / AI Extension Block */}
        <div className="space-y-6">
          {/* Price checkout box - Elegant GYG style */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200 space-y-4">
            <div className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest leading-none">
              Tarif à partir de
            </div>
            
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-[#1a2b49]">{currentPrice.toLocaleString("fr-FR")} DA</span>
              <span className="text-xs text-slate-500">/ voyageur</span>
            </div>

            {isPromo && (
              <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-sm text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                Promotion de -{(pkg.price - pkg.promoPrice!).toLocaleString("fr-FR")} DA incluse
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Date de départ :</span>
                <span className="font-bold text-[#1a2b49] bg-slate-100 px-2 py-0.5 rounded-sm">{pkg.startDate}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Places restantes :</span>
                {pkg.spotsAvailable > 0 ? (
                  <span className="font-bold text-[#00875a]">{pkg.spotsAvailable} sur {pkg.spotsMax} places</span>
                ) : (
                  <span className="font-bold text-rose-500">Complet</span>
                )}
              </div>
            </div>

            {bookingStep === "details" && (
              <div className="space-y-3 pt-3">
                {pkg.spotsAvailable > 0 ? (
                  <button
                    onClick={() => setBookingStep("booking")}
                    className="w-full h-12 bg-[#ff5a00] hover:bg-[#e04f00] text-white font-extrabold rounded-full transition-all duration-200 cursor-pointer shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    <span>Vérifier la disponibilité</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full h-12 bg-slate-100 text-slate-400 font-extrabold rounded-full cursor-not-allowed text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Séjour Complet</span>
                  </button>
                )}
                
                <div className="space-y-2 pt-2 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5 text-[#00875a]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00875a]"></span>
                    <span>Annulation gratuite disponible</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>Pas de redevance additionnelle</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>Assistance francophone / locale</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
