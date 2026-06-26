import React, { useState } from "react";
import { Package, Booking, SystemStats } from "../types";
import { Plus, Trash2, Edit2, Check, X, ShieldAlert, CircleCheck, BarChart3, PackageOpen, FileText, CheckCircle, XCircle, RefreshCw, Layers, Database, Link2, AlertCircle } from "lucide-react";

interface AdminPanelProps {
  packages: Package[];
  bookings: Booking[];
  onAddPackage: (pkg: Partial<Package>) => void;
  onUpdatePackage: (pkgId: string, updatedFields: Partial<Package>) => void;
  onDeletePackage: (pkgId: string) => void;
  onUpdateBookingStatus: (bookingId: string, status: 'En attente' | 'Confirmé' | 'Annulé', paymentStatus?: 'Non payé' | 'Acompte payé' | 'Payé', paymentAmount?: number) => void;
  onRefreshAll: () => void;
  apiType: "node" | "wamp";
  setApiType: (type: "node" | "wamp") => void;
  wampUrl: string;
  setWampUrl: (url: string) => void;
}

export default function AdminPanel({
  packages,
  bookings,
  onAddPackage,
  onUpdatePackage,
  onDeletePackage,
  onUpdateBookingStatus,
  onRefreshAll,
  apiType,
  setApiType,
  wampUrl,
  setWampUrl
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"stats" | "packages" | "bookings">("stats");

  // State for creating or editing a package
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgTitle, setPkgTitle] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgDestination, setPkgDestination] = useState("");
  const [pkgDurationDays, setPkgDurationDays] = useState(7);
  const [pkgPrice, setPkgPrice] = useState(500);
  const [pkgPromoPrice, setPkgPromoPrice] = useState<string>("");
  const [pkgImage, setPkgImage] = useState("");
  const [pkgSpotsMax, setPkgSpotsMax] = useState(15);
  const [pkgStartDate, setPkgStartDate] = useState("2026-09-01");
  const [pkgEndDate, setPkgEndDate] = useState("2026-09-08");
  const [pkgCategory, setPkgCategory] = useState<'Plage' | 'Culture' | 'Aventure' | 'Luxe' | 'Famille'>("Culture");
  const [pkgInclusionsRaw, setPkgInclusionsRaw] = useState("");
  const [pkgExclusionsRaw, setPkgExclusionsRaw] = useState("");
  const [pkgStatus, setPkgStatus] = useState<"active" | "inactive">("active");

  const [formMsg, setFormMsg] = useState("");

  // Populate form for editing
  const handleStartEdit = (p: Package) => {
    setEditingPkgId(p.id);
    setPkgTitle(p.title);
    setPkgDescription(p.description);
    setPkgDestination(p.destination);
    setPkgDurationDays(p.durationDays);
    setPkgPrice(p.price);
    setPkgPromoPrice(p.promoPrice ? p.promoPrice.toString() : "");
    setPkgImage(p.image);
    setPkgSpotsMax(p.spotsMax);
    setPkgStartDate(p.startDate);
    setPkgEndDate(p.endDate);
    setPkgCategory(p.category);
    setPkgInclusionsRaw(p.inclusions?.join("\n") || "");
    setPkgExclusionsRaw(p.exclusions?.join("\n") || "");
    setPkgStatus(p.status);
    
    // Auto-scroll to form coordinates
    document.getElementById("package-form-anchor")?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleClearForm = () => {
    setEditingPkgId(null);
    setPkgTitle("");
    setPkgDescription("");
    setPkgDestination("");
    setPkgDurationDays(7);
    setPkgPrice(600);
    setPkgPromoPrice("");
    setPkgImage("");
    setPkgSpotsMax(12);
    setPkgStartDate("2026-09-10");
    setPkgEndDate("2026-09-17");
    setPkgCategory("Culture");
    setPkgInclusionsRaw("");
    setPkgExclusionsRaw("");
    setPkgStatus("active");
    setFormMsg("");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle || !pkgDestination || !pkgPrice) {
      setFormMsg("Veuillez remplir au moins le titre, la destination et le prix.");
      return;
    }

    const payload: Partial<Package> = {
      title: pkgTitle,
      description: pkgDescription || "Aucune description fournie.",
      destination: pkgDestination,
      durationDays: Number(pkgDurationDays),
      price: Number(pkgPrice),
      promoPrice: pkgPromoPrice ? Number(pkgPromoPrice) : undefined,
      image: pkgImage || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1000&auto=format&fit=crop&q=80",
      spotsMax: Number(pkgSpotsMax),
      startDate: pkgStartDate,
      endDate: pkgEndDate,
      category: pkgCategory,
      inclusions: pkgInclusionsRaw.split("\n").map(s => s.trim()).filter(Boolean),
      exclusions: pkgExclusionsRaw.split("\n").map(s => s.trim()).filter(Boolean),
      status: pkgStatus,
      // Minimal default daily schedule adapted to duration if empty
      schedule: editingPkgId 
        ? packages.find(p => p.id === editingPkgId)?.schedule || [{ day: 1, title: "Départ", desc: "Arrivée et transfert à l'hôtel." }]
        : Array.from({ length: Number(pkgDurationDays) }, (_, idx) => ({
            day: idx + 1,
            title: idx === 0 ? "Arrivée et Installation" : idx === Number(pkgDurationDays) - 1 ? "Retour" : "Visites libres",
            desc: "Programme libre à planifier par l'agence."
          }))
    };

    if (editingPkgId) {
      onUpdatePackage(editingPkgId, payload);
      setFormMsg("Offre modifiée avec succès !");
    } else {
      onAddPackage(payload);
      setFormMsg("Nouvelle offre ajoutée au catalogue !");
    }

    setTimeout(() => {
      handleClearForm();
    }, 1500);
  };

  // Helper quick calculations
  const totalRevenue = bookings
    .filter(b => b.status !== "Annulé")
    .reduce((sum, b) => sum + (b.paymentAmount || 0), 0);

  const stats: SystemStats = {
    totalBookings: bookings.length,
    totalRevenue,
    activePackages: packages.filter(p => p.status === "active").length,
    pendingValidation: bookings.filter(b => b.status === "En attente").length
  };

  return (
    <div id="admin-panel-container" className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner Control */}
      <div className="bg-[#2c2a26] text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">Console de Gestion Émation</h2>
          <p className="text-xs text-white/70 mt-1">
            Pilotez les offres voyages, supervisez les dossiers clients, mettez à jour les quotas de places et validez les règlements reçus.
          </p>
        </div>

        <button
          onClick={onRefreshAll}
          className="h-10 px-4 bg-[#1e1c19] hover:bg-[#2d2a25] text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer text-white/90"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser les flux</span>
        </button>
      </div>

      {/* Liaison WampServer Bridge Configuration Card */}
      <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Liaison Serveur local WampServer (PHP/MySQL)
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                apiType === "wamp" ? "bg-emerald-100 text-emerald-800 animate-pulse" : "bg-amber-100 text-amber-800"
              }`}>
                {apiType === "wamp" ? "Connecté à WampServer (Live)" : "Mode Fichier Local (db.json)"}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connectez ce site interactif à votre base de données WampServer pour synchroniser les forfaits et réservations en temps réel.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Mode de Stockage des Données</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setApiType("node")}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  apiType === "node"
                    ? "bg-slate-950 text-white border-transparent shadow-xs font-black"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>Simulateur Local (db.json)</span>
              </button>
              <button
                type="button"
                onClick={() => setApiType("wamp")}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  apiType === "wamp"
                    ? "bg-amber-600 text-white border-transparent shadow-xs font-black"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>WampServer (PHP / MySQL)</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">Adresse URL de votre API PHP (WampServer)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={wampUrl}
                onChange={(e) => setWampUrl(e.target.value)}
                placeholder="Ex: http://localhost/php-database/api.php"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-hidden font-mono bg-slate-50/50"
              />
              <button
                type="button"
                onClick={onRefreshAll}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tester / Sync
              </button>
            </div>
          </div>
        </div>

        {apiType === "wamp" && (
          <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl text-[11px] text-amber-900 space-y-1 animate-fade-in">
            <span className="font-extrabold flex items-center gap-1.5 text-amber-950 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Directives pour lier votre base de données WampServer :
            </span>
            <ul className="list-decimal pl-4 space-y-1 mt-1 text-slate-600 font-medium">
              <li>Lancez <strong>WampServer</strong> sur votre ordinateur et assurez-vous que les icônes de services (Apache & MySQL) sont au vert.</li>
              <li>Créez la base de données <code>sejoursdz_db</code> dans phpMyAdmin.</li>
              <li>Importez le fichier de structure SQL <code>/php-database/database_setup.sql</code> fourni dans votre projet.</li>
              <li>Toutes les modifications faites dans ce portail d'administration ou sur le site mettront à jour directement votre table MySQL locale !</li>
            </ul>
          </div>
        )}
      </div>

      {/* Admin sub-navigation tabs */}
      <div className="flex border-b border-natural-border pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("stats")}
          className={`px-4 py-2 border-b-2 text-xs font-bold tracking-wider uppercase transition-all ${
            activeSubTab === "stats"
              ? "border-natural-olive text-natural-olive"
              : "border-transparent text-natural-muted hover:text-natural-main"
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-1" />
          Vue Globale & Stats
        </button>
        <button
          onClick={() => setActiveSubTab("packages")}
          className={`px-4 py-2 border-b-2 text-xs font-bold tracking-wider uppercase transition-all ${
            activeSubTab === "packages"
              ? "border-natural-olive text-natural-olive"
              : "border-transparent text-natural-muted hover:text-natural-main"
          }`}
        >
          <Layers className="w-4 h-4 inline mr-1" />
          Offres Voyages ({packages.length})
        </button>
        <button
          onClick={() => setActiveSubTab("bookings")}
          className={`px-4 py-2 border-b-2 text-xs font-bold tracking-wider uppercase transition-all ${
            activeSubTab === "bookings"
              ? "border-natural-olive text-natural-olive"
              : "border-transparent text-natural-muted hover:text-natural-main"
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1" />
          Suivi des Réservations ({bookings.length})
        </button>
      </div>

      {/* 1. STATS TAB */}
      {activeSubTab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-natural-card rounded-2xl p-6 border border-natural-border shadow-xs">
              <span className="text-natural-muted text-[10px] font-bold uppercase tracking-wider block mb-1">Total Réservations</span>
              <span className="text-2xl font-bold text-natural-main">{stats.totalBookings} dossiers</span>
              <p className="text-[10px] text-natural-muted/70 mt-2">Enregistrées dans le système</p>
            </div>

            <div className="bg-natural-card rounded-2xl p-6 border border-natural-border shadow-xs">
              <span className="text-natural-muted text-[10px] font-bold uppercase tracking-wider block mb-1">Recettes perçues</span>
              <span className="text-2xl font-bold text-natural-olive">{stats.totalRevenue.toLocaleString("fr-FR")} DA</span>
              <p className="text-[10px] text-natural-muted/70 mt-2">Fonds encaissés (acompte et soldes)</p>
            </div>

            <div className="bg-natural-card rounded-2xl p-6 border border-natural-border shadow-xs">
              <span className="text-natural-muted text-[10px] font-bold uppercase tracking-wider block mb-1">Packages Actifs</span>
              <span className="text-2xl font-bold text-natural-main">{stats.activePackages} séjours</span>
              <p className="text-[10px] text-natural-muted/70 mt-2">Visibles par le grand public</p>
            </div>

            <div className="bg-natural-card rounded-2xl p-6 border border-natural-border shadow-xs">
              <span className="text-natural-muted text-[10px] font-bold uppercase tracking-wider block mb-1">En attente de validation</span>
              <span className={`text-2xl font-bold ${stats.pendingValidation > 0 ? 'text-natural-warm animate-pulse' : 'text-natural-main'}`}>{stats.pendingValidation} dossiers</span>
              <p className="text-[10px] text-natural-muted/70 mt-2">Nécessitent une validation manuelle</p>
            </div>
          </div>

          {/* Quick instructions and assistance details */}
          <div className="bg-natural-bg border border-natural-border p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <h3 className="font-serif text-sm font-bold text-natural-main">Activité récente d'Évasion</h3>
              <p className="text-xs text-natural-muted leading-relaxed">
                Ce panneau d'analyse compile en temps réel les dossiers de réservation. Le statut d'une commande affecte directement les quotas de sièges disponibles sur le vol pour le package concerné. Un dossier annulé restitue automatiquement les places disponibles d'ici la date de départ.
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-natural-border flex items-center gap-3">
              <div className="p-2.5 bg-natural-olive/10 text-natural-olive rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="text-xs text-natural-muted">
                <span className="font-semibold text-natural-main block font-serif">Taux de remplissage global :</span>
                {packages.length > 0 ? (
                  <span className="font-bold text-natural-olive text-sm">
                    {Math.round(
                      (packages.reduce((sum, p) => sum + (p.spotsMax - p.spotsAvailable), 0) /
                      packages.reduce((sum, p) => sum + p.spotsMax, 0)) * 100
                    )} % des places disponibles
                  </span>
                ) : (
                  <span className="text-natural-muted/50">Pas de package configuré</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PACKAGES TAB & FORM */}
      {activeSubTab === "packages" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* List of current packages in Table form */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-natural-muted border-b border-natural-border pb-2">
              Fiches Voyages Configurées ({packages.length})
            </h3>

            <div className="space-y-4">
              {packages.map((p) => {
                const isPromo = p.promoPrice !== undefined && p.promoPrice < p.price;
                return (
                  <div
                    key={p.id}
                    className="p-4 bg-natural-card border border-natural-border rounded-2xl shadow-xs flex items-center justify-between gap-4 hover:border-natural-olive/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-16 h-12 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif text-sm font-bold text-natural-main">{p.title}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                            p.status === "active" ? "bg-natural-olive/15 text-natural-olive" : "bg-natural-bg text-natural-muted"
                          }`}>
                            {p.status === "active" ? "En ligne" : "Masqué"}
                          </span>
                        </div>
                        <p className="text-[11px] text-natural-muted mt-0.5">
                          {p.destination} • {p.durationDays} Jours • Catégorie : {p.category}
                        </p>
                        <p className="text-[11px] text-natural-olive font-bold mt-1">
                          Places : {p.spotsAvailable} / {p.spotsMax} restantes • Prix : {isPromo ? `${p.promoPrice?.toLocaleString("fr-FR")} DA (Promo)` : `${p.price?.toLocaleString("fr-FR")} DA`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="p-1.5 bg-[#fdfcfb] hover:bg-natural-olive/10 hover:text-natural-olive text-natural-muted rounded-lg transition-colors border border-natural-border cursor-pointer"
                        title="Modifier le voyage"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Confirmez-vous la suppression définitive de cette offre voyage ?")) {
                            onDeletePackage(p.id);
                          }
                        }}
                        className="p-1.5 bg-[#fdfcfb] hover:bg-natural-warm/15 hover:text-natural-warm text-natural-muted rounded-lg transition-colors border border-natural-border cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create or Edit Package Form */}
          <div id="package-form-anchor" className="bg-natural-card p-6 rounded-2xl border border-natural-border shadow-sm space-y-4">
            <h3 className="font-serif text-sm font-bold text-natural-main border-b border-natural-border pb-3">
              {editingPkgId ? "Modifier l'Offre existante" : "Créer une nouvelle Offre"}
            </h3>

            {formMsg && (
              <div className="p-3 bg-natural-olive/15 border border-natural-olive/25 text-natural-olive text-xs rounded-xl font-medium">
                {formMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-natural-muted font-bold uppercase tracking-wider mb-1">Titre de l'offre *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Escapade aux Maldives"
                  className="w-full p-2 rounded-lg border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-1 focus:ring-natural-olive text-xs"
                  value={pkgTitle}
                  onChange={(e) => setPkgTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-natural-muted font-bold uppercase tracking-wider mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Malé, Maldives"
                    className="w-full p-2 rounded-lg border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-1 focus:ring-natural-olive text-xs"
                    value={pkgDestination}
                    onChange={(e) => setPkgDestination(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-natural-muted font-bold uppercase tracking-wider mb-1">Format de Voyage</label>
                  <select
                    className="w-full p-2 bg-white rounded-lg border border-natural-border focus:outline-hidden text-xs"
                    value={pkgCategory}
                    onChange={(e) => setPkgCategory(e.target.value as any)}
                  >
                    <option value="Culture">🏛️ Culture</option>
                    <option value="Plage">🏖️ Plage</option>
                    <option value="Aventure">🥾 Aventure</option>
                    <option value="Luxe">💎 Luxe</option>
                    <option value="Famille">👶 Famille</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-natural-muted font-bold uppercase tracking-wider mb-1">Description narrative</label>
                <textarea
                  rows={3}
                  placeholder="Expliquez en quelques lignes les points forts du package touristique proposé..."
                  className="w-full p-2 rounded-lg border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-1 focus:ring-natural-olive text-xs"
                  value={pkgDescription}
                  onChange={(e) => setPkgDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-natural-muted font-bold uppercase tracking-wider mb-0.5">Durée (Jours)</label>
                  <input
                    type="number"
                    required
                    className="w-full p-2 rounded-lg border border-natural-border bg-natural-bg/30 focus:outline-hidden text-xs text-center"
                    value={pkgDurationDays}
                    onChange={(e) => setPkgDurationDays(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-natural-muted font-bold uppercase tracking-wider mb-0.5">Places Max (Quota)</label>
                  <input
                    type="number"
                    required
                    className="w-full p-2 rounded-lg border border-natural-border bg-natural-bg/30 focus:outline-hidden text-xs text-center"
                    value={pkgSpotsMax}
                    onChange={(e) => setPkgSpotsMax(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-natural-muted font-bold uppercase tracking-wider mb-0.5">Prix Public (DA)</label>
                  <input
                    type="number"
                    required
                    className="w-full p-2 rounded-lg border border-natural-border bg-natural-bg/30 focus:outline-hidden text-xs text-center"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-natural-muted font-bold uppercase tracking-wider mb-1">Prix Promotionnel (DA)</label>
                  <input
                    type="number"
                    placeholder="Ex: 158000"
                    className="w-full p-2 rounded-lg border border-natural-border bg-natural-bg/30 focus:outline-hidden text-xs text-center"
                    value={pkgPromoPrice}
                    onChange={(e) => setPkgPromoPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-natural-muted font-bold uppercase tracking-wider mb-1">Statut d'Affichage</label>
                  <select
                    className="w-full p-2 bg-white rounded-lg border border-natural-border focus:outline-hidden text-xs"
                    value={pkgStatus}
                    onChange={(e) => setPkgStatus(e.target.value as any)}
                  >
                    <option value="active">🟢 Affiché au Public</option>
                    <option value="inactive">🔴 Masqué des ventes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-natural-muted font-bold uppercase tracking-wider mb-1">Date estimée de Départ</label>
                <input
                  type="date"
                  className="w-full p-2 rounded-lg border border-natural-border bg-natural-bg/30 focus:outline-hidden text-xs"
                  value={pkgStartDate}
                  onChange={(e) => setPkgStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-natural-muted font-bold uppercase tracking-wider mb-1">Image URL du paysage</label>
                <input
                  type="url"
                  placeholder="Lien HTTPS de l'image"
                  className="w-full p-2 rounded-lg border border-natural-border bg-natural-bg/30 focus:outline-hidden text-xs"
                  value={pkgImage}
                  onChange={(e) => setPkgImage(e.target.value)}
                />
                <span className="text-[10px] text-natural-muted/60">Laisser vide pour charger le paysage par défaut de l'agence.</span>
              </div>

              <div>
                <label className="block text-natural-muted font-bold uppercase tracking-wider mb-1">Éléments inclus (1 par ligne)</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Vol Aller-Retour régulier&#10;Hôtel 4 étoiles en bord de plage&#10;Demi-pension gourmande"
                  className="w-full p-2 rounded-lg border border-natural-border bg-natural-bg/30 focus:outline-hidden text-xs leading-relaxed"
                  value={pkgInclusionsRaw}
                  onChange={(e) => setPkgInclusionsRaw(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-natural-muted font-bold uppercase tracking-wider mb-1">Éléments non inclus (1 par ligne)</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Boissons hors repas&#10;Assurance annulation facultative"
                  className="w-full p-2 rounded-lg border border-natural-border bg-natural-bg/30 focus:outline-hidden text-xs leading-relaxed"
                  value={pkgExclusionsRaw}
                  onChange={(e) => setPkgExclusionsRaw(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                {editingPkgId && (
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="px-4 py-2 bg-natural-bg hover:bg-natural-border font-bold rounded-lg transition-colors cursor-pointer text-natural-muted"
                  >
                    Annuler l'Édition
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-natural-olive hover:bg-natural-olive-hover text-white font-extrabold rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingPkgId ? "Enregistrer les modifications" : "Publier l'Offre"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. BOOKINGS FOLLOW-UP TAB */}
      {activeSubTab === "bookings" && (
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-natural-muted border-b border-natural-border pb-2">
            Supervision de toutes les réserves émises ({bookings.length})
          </h3>

          {bookings.length === 0 ? (
            <div className="bg-natural-card rounded-3xl py-12 px-6 text-center border border-natural-border italic text-natural-muted">
              Aucune commande voyage n'est enregistrée pour le moment.
            </div>
          ) : (
            <div className="bg-natural-card rounded-2xl border border-natural-border shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-natural-bg border-b border-natural-border font-bold uppercase text-natural-muted text-[10px] tracking-wider">
                    <th className="p-4">Réf / Date</th>
                    <th className="p-4">Client principal</th>
                    <th className="p-4">Séjour ciblé</th>
                    <th className="p-4">Voyageurs</th>
                    <th className="p-4">Montant Total</th>
                    <th className="p-4">Montant Versé</th>
                    <th className="p-4">Statut Financier</th>
                    <th className="p-4">Validation Agence</th>
                    <th className="p-4">Actions / Statuts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-natural-border/40">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-natural-bg/45 transition-colors">
                      <td className="p-4 font-semibold text-natural-main">
                        <span className="font-mono bg-natural-bg border border-natural-border px-1.5 py-0.5 rounded-sm block text-[10px] text-center w-max text-natural-muted">{b.id}</span>
                        <span className="text-[10px] text-natural-muted mt-1 block">
                          {new Date(b.dateBooked).toLocaleDateString("fr-FR")}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-bold text-natural-main block">{b.clientName}</span>
                        <span className="text-[10px] text-natural-muted block">{b.clientEmail}</span>
                        <span className="text-[10px] text-natural-muted block">{b.clientPhone}</span>
                      </td>

                      <td className="p-4 max-w-[160px] truncate font-serif font-semibold text-natural-main">
                        {b.packageTitle}
                      </td>

                      <td className="p-4 font-medium text-natural-muted">
                        {b.passengers?.length || 1} pers.
                        <span className="text-[10px] text-natural-muted/60 block max-w-[150px] truncate" title={b.passengers?.join(", ")}>
                          ({b.passengers?.join(", ")})
                        </span>
                      </td>

                      <td className="p-4 font-bold text-natural-main">
                        {b.totalAmount.toLocaleString("fr-FR")} DA
                      </td>

                      <td className="p-4 font-bold text-natural-olive">
                        {(b.paymentAmount || 0).toLocaleString("fr-FR")} DA
                      </td>

                      <td className="p-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase leading-none block w-max ${
                          b.paymentStatus === "Payé" ? "bg-natural-olive text-white" :
                          b.paymentStatus === "Acompte payé" ? "bg-natural-olive/15 text-natural-olive" :
                          "bg-natural-warm/15 text-natural-warm"
                        }`}>
                          {b.paymentStatus}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase leading-none block w-max ${
                          b.status === "Confirmé" ? "bg-natural-olive/10 text-natural-olive border border-natural-olive/20" :
                          b.status === "Annulé" ? "bg-natural-warm/15 text-natural-warm border border-natural-warm/25" :
                          "bg-natural-bg text-natural-muted border border-natural-border animate-pulse"
                        }`}>
                          {b.status}
                        </span>
                      </td>

                      <td className="p-4 space-y-1.5 min-w-[100px]">
                        {/* Status selector buttons */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, "Confirmé", "Acompte payé", b.paymentAmount || 500)}
                            className="bg-natural-olive/10 text-natural-olive hover:bg-natural-olive hover:text-white px-1.5 py-1 rounded-sm text-[9px] font-extrabold tracking-wide uppercase transition-colors cursor-pointer"
                            title="Confirmer & Enregistrer un acompte"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, "Confirmé", "Payé", b.totalAmount)}
                            className="bg-natural-olive text-white hover:bg-natural-olive-hover px-1.5 py-1 rounded-sm text-[9px] font-extrabold tracking-wide uppercase transition-colors cursor-pointer"
                            title="Solder le paiement"
                          >
                            Solder
                          </button>
                        </div>
                        <button
                          onClick={() => onUpdateBookingStatus(b.id, "Annulé", b.paymentStatus, b.paymentAmount)}
                          className="bg-natural-warm/15 text-natural-warm hover:bg-natural-warm hover:text-white px-1.5 py-1 rounded-sm text-[9px] font-bold tracking-wide uppercase transition-colors w-full block cursor-pointer"
                          title="Annuler le dossier et libérer les sièges"
                        >
                          Annuler
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
