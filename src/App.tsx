import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import PackageCard from "./components/PackageCard";
import PackageDetails from "./components/PackageDetails";
import ClientSpace from "./components/ClientSpace";
import AdminPanel from "./components/AdminPanel";
import About from "./components/About";
import Contact from "./components/Contact";
import { Package, Booking } from "./types";
import { Search, Compass, ShieldAlert, Award, Compass as GlobeIcon, CheckCircle2, SlidersHorizontal, Image, Smile, Palmtree, Calendar, MessageSquare, Mail, Send, Check } from "lucide-react";
import { translations, Language } from "./translations";

export default function App() {
  const [tab, setTab] = useState<"catalog" | "client" | "admin" | "about" | "contact">("catalog");
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);

  // Language state
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("lang") as Language) || "fr";
  });

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const t = translations[lang];

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [budgetLimit, setBudgetLimit] = useState<number>(600000);
  const [dateStartFilter, setDateStartFilter] = useState("");
  const [dateEndFilter, setDateEndFilter] = useState("");

  // App load alerts
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successNotif, setSuccessNotif] = useState("");
  const [lastBooking, setLastBooking] = useState<any>(null);

  // DB & API settings
  const [apiType, setApiType] = useState<"node" | "wamp">(() => {
    return (localStorage.getItem("apiType") as "node" | "wamp") || "wamp";
  });
  const [wampUrl, setWampUrl] = useState<string>(() => {
    return localStorage.getItem("wampUrl") || "http://localhost/php-database/api.php";
  });

  useEffect(() => {
    localStorage.setItem("apiType", apiType);
  }, [apiType]);

  useEffect(() => {
    localStorage.setItem("wampUrl", wampUrl);
  }, [wampUrl]);

  // Load baseline packages and bookings on mount and whenever connection config changes
  useEffect(() => {
    fetchPackages();
    fetchBookings();
  }, [apiType, wampUrl]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      if (apiType === "wamp") {
        const res = await fetch(`${wampUrl}?action=get_packages`);
        if (!res.ok) throw new Error("Impossible de se connecter au serveur WampServer.");
        const json = await res.json();
        if (json.success) {
          setPackages(json.data || []);
        } else {
          throw new Error(json.message || "Erreur lors de la récupération depuis WampServer.");
        }
      } else {
        const res = await fetch("/api/packages");
        if (!res.ok) throw new Error("Impossible de charger les forfaits voyages.");
        const data = await res.json();
        setPackages(data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Erreur lors de la récupération du catalogue voyages. Veuillez vérifier que votre serveur local WampServer est actif et accessible.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      if (apiType === "wamp") {
        const res = await fetch(`${wampUrl}?action=get_bookings`);
        if (!res.ok) throw new Error("Impossible de se connecter au serveur WampServer.");
        const json = await res.json();
        if (json.success) {
          setBookings(json.data || []);
        }
      } else {
        const res = await fetch("/api/bookings");
        if (!res.ok) throw new Error("Impossible de charger le carnet de réservations.");
        const data = await res.json();
        setBookings(data);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // 1. CREATE BOOKING MUTATION
  const handleConfirmBooking = async (bookingInput: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    passengers: string[];
    specialRequests: string;
    aiCustomization?: string;
  }) => {
    if (!selectedPkg) return;

    try {
      const payload = {
        packageId: selectedPkg.id,
        clientName: bookingInput.clientName,
        clientEmail: bookingInput.clientEmail,
        clientPhone: bookingInput.clientPhone,
        passengers: bookingInput.passengers,
        specialRequests: bookingInput.specialRequests,
        aiCustomization: bookingInput.aiCustomization,
        totalAmount: (selectedPkg.promoPrice || selectedPkg.price) * bookingInput.passengers.length
      };

      let bookingId = "";

      if (apiType === "wamp") {
        const response = await fetch(`${wampUrl}?action=add_booking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || "Une erreur s'est produite lors de la réservation sur WampServer.");
        }
        bookingId = json.data?.id || "book-" + Date.now().toString().slice(-6);
      } else {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Une erreur s'est produite lors de la réservation.");
        }
        bookingId = data.id;
      }

      // Refresh app states
      await fetchPackages();
      await fetchBookings();
      
      const pkgRef = selectedPkg;
      setLastBooking({
        id: bookingId,
        clientName: bookingInput.clientName,
        clientEmail: bookingInput.clientEmail,
        clientPhone: bookingInput.clientPhone,
        packageTitle: pkgRef.title,
        destination: pkgRef.destination,
        totalAmount: (pkgRef.promoPrice || pkgRef.price) * bookingInput.passengers.length,
        passengers: bookingInput.passengers,
        startDate: pkgRef.startDate
      });
      
      setSelectedPkg(null);
      setSuccessNotif(`Félicitations ! Votre réservation pour "${pkgRef.title}" a été enregistrée avec succès sous la référence ${bookingId}.`);
      setTab("client");

      // Set timeout to clear notifications/lastBooking
      setTimeout(() => {
        setSuccessNotif("");
        setLastBooking(null);
      }, 45000); // Give 45 seconds for user to click WhatsApp or Email buttons
    } catch (err: any) {
      throw err;
    }
  };

  // 2. ADD NEW PACKAGE MUTATION (Admin)
  const handleAddPackage = async (newPkgFields: Partial<Package>) => {
    try {
      if (apiType === "wamp") {
        const response = await fetch(`${wampUrl}?action=add_package`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPkgFields)
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || "Erreur de création de fiches sur WampServer.");
        }
      } else {
        const response = await fetch("/api/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPkgFields)
        });
        if (!response.ok) throw new Error("Erreur de création de fiches.");
      }
      await fetchPackages();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Impossible de créer la nouvelle fiche voyage.");
    }
  };

  // 3. EDIT EXISTING PACKAGE MUTATION (Admin)
  const handleUpdatePackage = async (pkgId: string, updatedFields: Partial<Package>) => {
    try {
      if (apiType === "wamp") {
        const response = await fetch(`${wampUrl}?action=update_package`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...updatedFields, id: pkgId })
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || "Erreur de mise à jour sur WampServer.");
        }
      } else {
        const response = await fetch(`/api/packages/${pkgId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFields)
        });
        if (!response.ok) throw new Error("Erreur de mise à jour.");
      }
      await fetchPackages();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Impossible d'actualiser le package voyage.");
    }
  };

  // 4. DELETE PACKAGE MUTATION (Admin)
  const handleDeletePackage = async (pkgId: string) => {
    try {
      if (apiType === "wamp") {
        const response = await fetch(`${wampUrl}?action=delete_package`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: pkgId })
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || "Erreur de suppression sur WampServer.");
        }
      } else {
        const response = await fetch(`/api/packages/${pkgId}`, {
          method: "DELETE"
        });
        if (!response.ok) throw new Error("Erreur de suppression.");
      }
      await fetchPackages();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Impossible de supprimer le package.");
    }
  };

  // 5. UPDATE BOOKING STATS (Admin validate ticket / cancel ticket)
  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: 'En attente' | 'Confirmé' | 'Annulé',
    paymentStatus?: 'Non payé' | 'Acompte payé' | 'Payé',
    paymentAmount?: number
  ) => {
    try {
      const payload = {
        id: bookingId,
        status,
        ...(paymentStatus !== undefined && { paymentStatus }),
        ...(paymentAmount !== undefined && { paymentAmount })
      };

      if (apiType === "wamp") {
        const response = await fetch(`${wampUrl}?action=update_booking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || "Erreur d'édition du statut sur WampServer.");
        }
      } else {
        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Erreur d'édition du statut.");
      }
      await fetchBookings();
      await fetchPackages();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de la mise à jour.");
    }
  };

  // 6. CLIENT SECURE PAYMENT INSTANT MUTATION
  const handleUpdateBookingPayment = async (
    bookingId: string,
    paymentMethod: string,
    amount: number,
    paymentStatus: 'Acompte payé' | 'Payé'
  ) => {
    const existing = bookings.find(b => b.id === bookingId);
    if (!existing) return;
    const currentAmountPaid = existing.paymentAmount || 0;

    try {
      const payload = {
        id: bookingId,
        paymentMethod,
        paymentAmount: currentAmountPaid + amount,
        paymentStatus
      };

      if (apiType === "wamp") {
        const response = await fetch(`${wampUrl}?action=update_booking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || "Erreur passerelle sur WampServer.");
        }
      } else {
        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Erreur passerelle.");
      }
      await fetchBookings();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRefreshAll = async () => {
    await fetchPackages();
    await fetchBookings();
  };

  // Filter package matching constraints
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "Tous" || pkg.category === selectedCategory;
    const actualPrice = pkg.promoPrice !== undefined ? pkg.promoPrice : pkg.price;
    const matchesBudget = actualPrice <= budgetLimit;

    // Date filtering (YYYY-MM-DD match/comparison)
    const matchesStartDate = !dateStartFilter || pkg.startDate >= dateStartFilter;
    const matchesEndDate = !dateEndFilter || pkg.startDate <= dateEndFilter;

    // Grand public only sees active packages
    const matchesVisibility = tab !== "catalog" || pkg.status === "active";

    return matchesSearch && matchesCategory && matchesBudget && matchesStartDate && matchesEndDate && matchesVisibility;
  });

  return (
    <div id="app-root-layout" className={`min-h-screen bg-neutral-50/50 text-gray-800 flex flex-col antialiased ${lang === 'ar' ? 'font-serif' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Navbar segment */}
      <Navbar currentTab={tab} setTab={(t) => { setTab(t); setSelectedPkg(null); }} bookingCount={bookings.length} lang={lang} setLang={setLang} />

      {/* Main Body */}
      <main className="flex-1 pb-16">
        
        {/* Success / Info Global Banner Notification bubble with WhatsApp and Email trigger triggers */}
        {successNotif && (
          <div className="max-w-7xl mx-auto px-4 mt-6">
            <div className="p-6 bg-emerald-50/70 border-2 border-dashed border-emerald-400 text-emerald-950 font-medium text-xs rounded-3xl space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <span className="font-extrabold text-sm block text-emerald-900">🎉 Succès de la réservation !</span>
                  <p className="text-emerald-950 text-xs font-semibold leading-relaxed">{successNotif}</p>
                </div>
                <button 
                  onClick={() => {
                    setSuccessNotif("");
                    setLastBooking(null);
                  }} 
                  className="text-emerald-700 hover:text-emerald-900 font-extrabold text-sm ml-auto p-1 bg-white/40 hover:bg-white/80 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {lastBooking && (
                <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-emerald-200/60 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">
                      Notifier le client ({lastBooking.clientName}) :
                    </h4>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Cliquez ci-dessous pour envoyer instantanément la confirmation officielle par WhatsApp ou par E-mail :
                    </p>
                    <div className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1.5 pt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Notifications de confirmation prêtes à l'envoi</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 justify-end">
                    {/* WhatsApp Action Button */}
                    <a
                      href={`https://api.whatsapp.com/send?phone=${
                        (() => {
                          let cleaned = lastBooking.clientPhone.replace(/\D/g, "");
                          if (cleaned.startsWith("0") && cleaned.length === 10) {
                            cleaned = "213" + cleaned.substring(1);
                          } else if (!cleaned.startsWith("213") && cleaned.length === 9) {
                            cleaned = "213" + cleaned;
                          }
                          return cleaned;
                        })()
                      }&text=${encodeURIComponent(
                        `🌟 *Séjours DZ - Confirmation de Réservation* 🌟\n\nBonjour ${lastBooking.clientName},\nNous avons le plaisir de vous confirmer l'enregistrement de votre demande de réservation sous la référence *${lastBooking.id}* !\n\n🗺️ *Séjour :* ${lastBooking.packageTitle}\n👥 *Voyageurs :* ${lastBooking.passengers?.length || 1} personne(s) (${lastBooking.passengers?.join(", ") || lastBooking.clientName})\n💰 *Montant Total :* ${lastBooking.totalAmount.toLocaleString("fr-FR")} DA\n⏱️ *Date du départ :* ${lastBooking.startDate}\n\nPour finaliser votre inscription, notre conseiller de l'agence Évasion Voyages va vous contacter au plus vite pour valider les détails et les vols.\nRetrouvez tous les détails de votre voyage dans votre Espace Client sur notre site.\n\nMerci de votre confiance !\n🇩🇿 *Séjours DZ / Évasion Voyages*`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Envoyer par WhatsApp</span>
                    </a>

                    {/* Email Action Button */}
                    <a
                      href={`mailto:${lastBooking.clientEmail}?subject=${encodeURIComponent(
                        `Confirmation de votre demande de réservation ${lastBooking.id} - Séjours DZ`
                      )}&body=${encodeURIComponent(
                        `Bonjour ${lastBooking.clientName},\n\nNous vous remercions pour votre intérêt pour nos voyages d'exception avec Séjours DZ (Évasion Voyages).\n\nVotre demande de réservation a bien été enregistrée sous la référence ${lastBooking.id}.\n\nRécapitulatif de votre séjour :\n- Séjour : ${lastBooking.packageTitle} (Destination : ${lastBooking.destination})\n- Date de départ : ${lastBooking.startDate}\n- Nombre de voyageurs : ${lastBooking.passengers?.length || 1} personne(s) (${lastBooking.passengers?.join(", ") || lastBooking.clientName})\n- Montant total du dossier : ${lastBooking.totalAmount.toLocaleString("fr-FR")} DA\n\nProchaines étapes :\n1. Un conseiller clientèle va prendre contact avec vous par téléphone ou WhatsApp sous 24h.\n2. Vous pourrez ensuite effectuer le paiement de l'acompte directement sur votre Espace Client pour garantir vos places de vols.\n\nPour toute question urgente, n'hésitez pas à nous écrire directement ou à nous appeler.\n\nCordialement,\nL'équipe Séjours DZ\nÉvasion Voyages S.A.S. - Licence État N° 1245/2026`
                      )}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Envoyer par E-mail</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="max-w-7xl mx-auto px-4 mt-6">
            <div className="p-4 bg-rose-50 border border-rose-300 text-rose-950 text-xs rounded-2xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg("")} className="ml-auto hover:text-rose-600 font-extrabold">✕</button>
            </div>
          </div>
        )}

        {/* DETAILS SCREEN */}
        {selectedPkg ? (
          <PackageDetails
            pkg={selectedPkg}
            onBack={() => setSelectedPkg(null)}
            onConfirmBooking={handleConfirmBooking}
            lang={lang}
          />
        ) : (
          <>
            {/* CATALOGUE TAB */}
            {tab === "catalog" && (
              <div className="space-y-10 animate-fade-in">
                
                {/* GetYourGuide Premium Hero Section */}
                <div 
                  className="relative py-20 sm:py-32 px-4 overflow-hidden bg-cover bg-center rounded-b-[2.5rem] sm:rounded-b-[4rem] shadow-lg"
                  style={{
                    backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.75)), url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80')"
                  }}
                >
                  <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10 pb-4">
                    <span className="inline-flex items-center gap-1.5 bg-[#ff5a00] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md">
                      {t.heroBadge}
                    </span>
                    <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                      {t.heroTitle}
                    </h1>
                    <p className="text-slate-200 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                      {t.heroSubtitle}
                    </p>

                    {/* Integrated Search Chamber - Copying GYG's famous search bar */}
                    <div className="max-w-4xl mx-auto mt-8 bg-white p-3 sm:p-4 rounded-3xl sm:rounded-full shadow-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2 items-center text-left">
                      {/* Search Term input */}
                      <div className="sm:col-span-4 relative px-3 border-r-0 sm:border-r border-slate-200">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.searchDestinationLabel}</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Search className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            placeholder={t.searchDestinationPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-xs font-semibold text-slate-700 bg-transparent focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Date Filter input */}
                      <div className="sm:col-span-3 relative px-3 border-r-0 sm:border-r border-slate-200">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.searchDateLabel}</label>
                          {dateStartFilter && (
                            <button
                              onClick={() => setDateStartFilter("")}
                              className="text-[9px] text-[#ff5a00] font-bold hover:underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <input
                            type="date"
                            value={dateStartFilter}
                            onChange={(e) => setDateStartFilter(e.target.value)}
                            className="w-full text-xs font-semibold text-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Slider Budget widget */}
                      <div className="sm:col-span-3 relative px-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>{t.searchBudgetLabel}</span>
                          <span className="text-[#0071eb] font-semibold">{budgetLimit.toLocaleString("fr-FR")} {lang === "ar" ? "دج" : "DA"}</span>
                        </div>
                        <input
                          type="range"
                          min="50000"
                          max="600000"
                          step="10000"
                          value={budgetLimit}
                          onChange={(e) => setBudgetLimit(Number(e.target.value))}
                          className="w-full accent-[#ff5a00] h-1.5 bg-slate-100 rounded-lg cursor-pointer mt-2"
                        />
                      </div>

                      {/* Search trigger and display */}
                      <div className="sm:col-span-2 text-right">
                        <button
                          onClick={() => {}}
                          className="w-full h-11 bg-[#ff5a00] hover:bg-[#e04f00] text-white font-extrabold text-xs sm:text-sm rounded-2xl sm:rounded-full transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <Search className="w-4 h-4" />
                          <span>{t.searchButton}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categories capsules sub-nav - High quality GYG icons selection */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1a2b49] flex items-center gap-2">
                      <Compass className="w-5 h-5 text-[#ff5a00]" />
                      <span>{t.browseCategories}</span>
                    </h2>
                    {searchQuery || selectedCategory !== "Tous" || budgetLimit < 600000 || dateStartFilter ? (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("Tous");
                          setBudgetLimit(600000);
                          setDateStartFilter("");
                        }}
                        className="text-xs font-bold text-[#0071eb] hover:underline"
                      >
                        {t.clearFilters}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none scroll-smooth">
                    {[
                      { id: "Tous", label: lang === "ar" ? "✨ الكل" : lang === "en" ? "✨ Explore All" : "✨ Tout explorer" },
                      { id: "Culture", label: lang === "ar" ? "🏛️ ثقافة وتاريخ" : lang === "en" ? "🏛️ Culture & History" : "🏛️ Culture & Richesse" },
                      { id: "Plage", label: lang === "ar" ? "🏖️ شواطئ ورمال" : lang === "en" ? "🏖️ Sands & Beach" : "🏖️ Sables & Plages" },
                      { id: "Aventure", label: lang === "ar" ? "🐪 مغامرة وصحراء" : lang === "en" ? "🐪 Sahara & Trail" : "🐪 Sahara & Trail" },
                      { id: "Luxe", label: lang === "ar" ? "💎 إقامة فاخرة" : lang === "en" ? "💎 Luxury Escape" : "💎 Luxe & Escapade" },
                      { id: "Famille", label: lang === "ar" ? "👨‍👩‍👧‍👦 رحلات عائلية" : lang === "en" ? "👨‍👩‍👧‍👦 Family Getaways" : "👨‍👩‍👧‍👦 Escapades Famille" }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-5 py-2.5 text-xs font-bold rounded-full transition-all duration-200 border whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          selectedCategory === cat.id
                            ? "bg-[#1a2b49] text-white border-[#1a2b49] shadow-sm select-none scale-105"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Package Card Grid layout */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {loading ? (
                    <div className="text-center py-20 space-y-4">
                      <div className="w-10 h-10 border-4 border-natural-olive border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-natural-muted font-bold uppercase tracking-wider">Chargement des meilleures offres de Séjours DZ...</p>
                    </div>
                  ) : filteredPackages.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-natural-border space-y-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-natural-bg text-natural-muted flex items-center justify-center">
                        <GlobeIcon className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif text-md font-bold text-natural-main">Aucune offre de voyage trouvée</h3>
                      <p className="text-xs text-natural-muted max-w-sm mx-auto leading-relaxed">
                        Ajustez vos filtres d'exploration, augmentez votre budget maximum par personne ou tapez une nouvelle requête.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("Tous");
                          setBudgetLimit(600000);
                        }}
                        className="text-xs font-bold text-natural-olive hover:underline cursor-pointer"
                      >
                        Réinitialiser tous les filtres
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredPackages.map((p) => (
                        <PackageCard key={p.id} pkg={p} onViewDetails={setSelectedPkg} lang={lang} />
                      ))}
                    </div>
                  )}
                </div>

                {/* B2C agency values */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                  <div className="bg-white rounded-3xl p-8 border border-natural-border flex flex-col md:flex-row items-center gap-6 justify-between shadow-xs">
                    <div className="space-y-1 text-center md:text-left">
                      <h4 className="font-serif font-bold text-natural-main">Pourquoi réserver avec l'agence Séjours DZ?</h4>
                      <p className="text-xs text-natural-muted">Service client 24h/24 localisé sur place • Accès exclusif aux meilleurs vols.</p>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center justify-center">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-natural-olive bg-natural-olive/10 px-3 py-1.5 rounded-lg">
                        <Award className="w-4 h-4 text-natural-olive" />
                        <span>Licence Officielle Tourisme</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-natural-olive bg-natural-olive/10 px-3 py-1.5 rounded-lg">
                        <GlobeIcon className="w-4 h-4 text-natural-olive" />
                        <span>Partenariats Certifiés</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* CLIENT SPACE TAB */}
            {tab === "client" && (
              <ClientSpace
                bookings={bookings}
                onRefreshBookings={fetchBookings}
                onUpdateBookingPayment={handleUpdateBookingPayment}
                apiType={apiType}
                wampUrl={wampUrl}
              />
            )}

            {/* ABOUT TAB */}
            {tab === "about" && (
              <About lang={lang} />
            )}

            {/* CONTACT TAB */}
            {tab === "contact" && (
              <Contact lang={lang} />
            )}

            {/* ADMIN AGENT MANAGER PANEL TAB */}
            {tab === "admin" && (
              <AdminPanel
                packages={packages}
                bookings={bookings}
                onAddPackage={handleAddPackage}
                onUpdatePackage={handleUpdatePackage}
                onDeletePackage={handleDeletePackage}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onRefreshAll={handleRefreshAll}
                apiType={apiType}
                setApiType={setApiType}
                wampUrl={wampUrl}
                setWampUrl={setWampUrl}
              />
            )}
          </>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="bg-[#1a2b49] text-white/60 py-12 text-xs text-center border-t border-slate-150/10 space-y-2">
        <p className="font-serif text-sm text-white font-bold mb-1">Séjours DZ</p>
        <p>© 2026 Évasion Voyages S.A.S. • Tous droits réservés.</p>
     
      </footer>
    </div>
  );
}
