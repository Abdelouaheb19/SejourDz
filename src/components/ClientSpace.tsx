import React, { useState, useEffect } from "react";
import { Booking } from "../types";
import { User, Mail, Calendar, CreditCard, Download, ShieldCheck, Ticket, Sparkles, CheckCircle2, AlertTriangle, Printer, Wallet, Building2, Lock, Phone } from "lucide-react";

interface ClientSpaceProps {
  bookings: Booking[];
  onRefreshBookings: () => void;
  onUpdateBookingPayment: (bookingId: string, paymentMethod: string, amount: number, paymentStatus: 'Acompte payé' | 'Payé') => void;
  apiType?: "node" | "wamp";
  wampUrl?: string;
}

export default function ClientSpace({ bookings, onRefreshBookings, onUpdateBookingPayment, apiType = "node", wampUrl = "" }: ClientSpaceProps) {
  const [emailInput, setEmailInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Authentication states
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; phone?: string } | null>(null);

  // Load saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem("sejours_dz_client");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && u.email) {
          setCurrentUser(u);
          setEmailInput(u.email);
          setIsLoggedIn(true);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, []);

  // Simulated Card Payment State
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [paymentDone, setPaymentDone] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'cash' | 'virement'>('card');
  const [transactionId, setTransactionId] = useState("");

  // Ticket Preview modal/view state
  const [ticketToPrint, setTicketToPrint] = useState<Booking | null>(null);

  // Authenticate against database API
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);
 
    if (authMode === "login") {
      try {
        if (apiType === "wamp") {
          const res = await fetch(`${wampUrl}?action=login_client`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: emailInput.trim(),
              password: passwordInput,
            }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || "Adresse email ou mot de passe incorrect.");
          }
          const userObj = json.data;
          setCurrentUser(userObj);
          setEmailInput(userObj.email);
          localStorage.setItem("sejours_dz_client", JSON.stringify(userObj));
          setIsLoggedIn(true);
          setPasswordInput("");
        } else {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: emailInput.trim(),
              password: passwordInput,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Une erreur est survenue lors de la connexion.");
          }
          
          setCurrentUser(data.user);
          setEmailInput(data.user.email);
          localStorage.setItem("sejours_dz_client", JSON.stringify(data.user));
          setIsLoggedIn(true);
          setPasswordInput("");
        }
      } catch (error: any) {
        setErrorMessage(error.message || "Erreur de connexion");
      } finally {
        setIsLoading(false);
      }
    } else {
      if (passwordInput !== confirmPasswordInput) {
        setErrorMessage("Les deux mots de passe ne correspondent pas.");
        setIsLoading(false);
        return;
      }
      if (passwordInput.length < 6) {
        setErrorMessage("Le mot de passe doit contenir au moins 6 caractères.");
        setIsLoading(false);
        return;
      }
 
      try {
        if (apiType === "wamp") {
          const id = "user-" + Date.now();
          const res = await fetch(`${wampUrl}?action=add_client`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              name: nameInput.trim(),
              email: emailInput.trim(),
              phone: phoneInput.trim(),
              password: passwordInput,
            }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || "Une erreur est survenue lors de l'inscription sur WampServer.");
          }
 
          setSuccessMessage("Compte créé avec succès ! Connexion automatique...");
          const userObj = { id, name: nameInput.trim(), email: emailInput.trim(), phone: phoneInput.trim() };
 
          // Auto-login
          setTimeout(() => {
            setCurrentUser(userObj);
            setEmailInput(userObj.email);
            localStorage.setItem("sejours_dz_client", JSON.stringify(userObj));
            setIsLoggedIn(true);
            setPasswordInput("");
            setConfirmPasswordInput("");
            setNameInput("");
            setPhoneInput("");
            setSuccessMessage("");
            setIsLoading(false);
          }, 1200);
        } else {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: emailInput.trim(),
              password: passwordInput,
              name: nameInput.trim(),
              phone: phoneInput.trim(),
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Une erreur est survenue lors de l'inscription.");
          }
 
          setSuccessMessage("Compte créé avec succès ! Connexion automatique...");
          
          // Auto-login
          setTimeout(() => {
            setCurrentUser(data.user);
            setEmailInput(data.user.email);
            localStorage.setItem("sejours_dz_client", JSON.stringify(data.user));
            setIsLoggedIn(true);
            setPasswordInput("");
            setConfirmPasswordInput("");
            setNameInput("");
            setPhoneInput("");
            setSuccessMessage("");
            setIsLoading(false);
          }, 1200);
        }
 
      } catch (error: any) {
        setErrorMessage(error.message || "Erreur d'inscription");
        setIsLoading(false);
      }
    }
  };

  const myBookings = bookings.filter(b => b.clientEmail.toLowerCase() === emailInput.toLowerCase().trim());

  const handleOpenPayment = (b: Booking, type: "total" | "deposit") => {
    const remains = b.totalAmount - (b.paymentAmount || 0);
    const amt = type === "total" ? remains : Math.min(100000, remains);
    setPaymentAmount(amt);
    setPayingBooking(b);
    setCardNumber("4532 •••• •••• 9812");
    setCardExpiry("12/28");
    setCardCvc("432");
    setPaymentDone(false);
    setPaymentError("");
    setSelectedPaymentMethod("card");
    setTransactionId("");
  };

  const handleProcessPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBooking) return;

    let methodLabel = "Carte bancaire";
    if (selectedPaymentMethod === "card") {
      if (!cardNumber || !cardExpiry || !cardCvc) {
        setPaymentError("Veuillez remplir les informations de carte bancaire de simulation.");
        return;
      }
      methodLabel = "Carte bancaire";
    } else if (selectedPaymentMethod === "cash") {
      methodLabel = "Espèces en agence";
    } else {
      if (!transactionId.trim()) {
        setPaymentError("Veuillez renseigner le numéro ou la référence de votre versement.");
        return;
      }
      methodLabel = `Dépôt CCP (Bordereau: ${transactionId})`;
    }

    try {
      const isFull = (payingBooking.paymentAmount + paymentAmount) >= payingBooking.totalAmount;
      const targetStatus = isFull ? "Payé" : "Acompte payé";
      
      onUpdateBookingPayment(payingBooking.id, methodLabel, paymentAmount, targetStatus);
      setPaymentDone(true);
      setTimeout(() => {
        setPayingBooking(null);
        setPaymentDone(false);
      }, 2500);
    } catch (err: any) {
      setPaymentError(err.message || "Erreur de paiement.");
    }
  };

  // Quick suggestions based on mock emails available in db.json (initialized withJean and Sarah)
  const quickEmails = Array.from(new Set(bookings.map(b => b.clientEmail)));

  return (
    <div id="client-space-container" className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {!isLoggedIn ? (
        /* LOGIN / SIGNUP PORTAL */
        <div className="max-w-md mx-auto bg-natural-card rounded-3xl p-8 border border-natural-border shadow-xs space-y-6 animate-in fade-in duration-300">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-natural-olive/10 text-natural-olive flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-xl font-bold text-natural-main">Espace Client Évasion</h2>
            <p className="text-xs text-natural-muted max-w-xs mx-auto">
              Suivez vos voyages, effectuez des paiements sécurisés et accédez à vos carnets de route personnalisés.
            </p>
          </div>

          {/* Secure Tabs */}
          <div className="flex border border-natural-border p-1 bg-natural-bg/40 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-natural-olive text-white shadow-xs'
                  : 'text-natural-muted hover:text-natural-main'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-natural-olive text-white shadow-xs'
                  : 'text-natural-muted hover:text-natural-main'
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 bg-natural-warm/10 border border-natural-warm/20 text-natural-warm text-xs font-medium rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-natural-olive/10 border border-natural-olive/20 text-natural-olive text-xs font-medium rounded-xl flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-natural-main mb-1">Nom complet :</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-muted/60" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Jean Dupont"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full text-sm pl-11 pr-4 py-3 rounded-xl border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-natural-main mb-1">Numéro de téléphone (facultatif) :</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-muted/60" />
                    <input
                      type="tel"
                      placeholder="Ex: +213 555 123 456"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full text-sm pl-11 pr-4 py-3 rounded-xl border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-natural-main mb-1">Votre adresse e-mail :</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-muted/60" />
                <input
                  type="email"
                  required
                  placeholder="Ex: jean.dupont@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full text-sm pl-11 pr-4 py-3 rounded-xl border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-natural-main mb-1">Mot de passe :</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-muted/60" />
                <input
                  type="password"
                  required
                  placeholder={authMode === 'signup' ? "6 caractères minimum" : "Entrez votre mot de passe"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full text-sm pl-11 pr-4 py-3 rounded-xl border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                />
              </div>
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-natural-main mb-1">Confirmer le mot de passe :</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-natural-muted/60" />
                  <input
                    type="password"
                    required
                    placeholder="Répétez le mot de passe"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full text-sm pl-11 pr-4 py-3 rounded-xl border border-natural-border bg-natural-bg/30 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-11 bg-natural-olive text-white hover:bg-natural-olive-hover font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isLoading && (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{authMode === 'login' ? 'Accéder à mes réservations' : 'Créer mon compte client'}</span>
            </button>
          </form>

          {quickEmails.length > 0 && authMode === 'login' && (
            <div className="pt-4 border-t border-natural-border">
              <span className="text-[10px] uppercase font-bold text-natural-muted/70 block mb-2">
                Démonstration rapide (Comptes de test) :
              </span>
              <div className="flex flex-wrap gap-2">
                {quickEmails.map((email) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => {
                      setEmailInput(email);
                      setPasswordInput("123456");
                    }}
                    className="text-xs bg-natural-bg hover:bg-natural-olive/10 hover:text-natural-olive border border-natural-border px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {email}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-natural-muted mt-2 block leading-relaxed">
                * Utilisez le mot de passe <strong>123456</strong> pour vous connecter sur ces comptes pré-générés ou inscrivez un nouveau compte.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* MY BOOKINGS LIST */
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-natural-card rounded-3xl p-6 border border-natural-border flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-natural-main">Mes Voyages & Réservations</h2>
                <span className="bg-natural-olive/10 text-natural-olive text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  {myBookings.length} Dossier{myBookings.length !== 1 && "s"}
                </span>
              </div>
              <p className="text-xs text-natural-muted mt-1">
                Connecté avec : <span className="font-semibold text-natural-olive">{emailInput}</span>
              </p>
            </div>
            
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setEmailInput("");
              }}
              className="text-xs font-semibold text-natural-muted hover:text-natural-warm cursor-pointer"
            >
              Se déconnecter de mon profil
            </button>
          </div>

          {/* Bookings Display list */}
          {myBookings.length === 0 ? (
            <div className="bg-natural-card rounded-3xl py-12 px-6 text-center border border-natural-border space-y-3 shadow-xs">
              <div className="mx-auto w-12 h-12 bg-natural-bg text-natural-muted flex items-center justify-center rounded-full">
                <Ticket className="w-6 h-6" />
              </div>
              <p className="text-natural-muted text-sm font-medium">Aucun dossier de voyage n'est enregistré sous l'adresse e-mail renseignée.</p>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setEmailInput("");
                }}
                className="text-natural-olive text-xs font-bold hover:underline cursor-pointer"
              >
                Essayer un autre e-mail
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {myBookings.map((b) => {
                const remainsToPay = b.totalAmount - b.paymentAmount;
                return (
                  <div
                    key={b.id}
                    className="bg-natural-card rounded-3xl border border-natural-border shadow-xs overflow-hidden flex flex-col sm:flex-row h-full"
                  >
                    {/* Tiny visual thumb image */}
                    {b.packageImage && (
                      <div className="sm:w-48 bg-natural-bg overflow-hidden relative min-h-[140px]">
                        <img
                          src={b.packageImage}
                          alt={b.packageTitle}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-natural-olive/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                          ID: {b.id}
                        </div>
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      {/* Top Booking Title & Status Row */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-base font-bold text-natural-main">{b.packageTitle}</h3>
                          <p className="text-xs text-natural-muted mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Réservé le {new Date(b.dateBooked).toLocaleDateString("fr-FR")}</span>
                          </p>
                        </div>

                        {/* Badges status */}
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            b.status === "Confirmé" ? "bg-natural-olive/10 text-natural-olive border border-natural-olive/20" :
                            b.status === "Annulé" ? "bg-natural-warm/10 text-natural-warm border border-natural-warm/20" :
                            "bg-natural-bg text-natural-muted border border-natural-border animate-pulse"
                          }`}>
                            {b.status}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            b.paymentStatus === "Payé" ? "bg-natural-olive text-white" :
                            b.paymentStatus === "Acompte payé" ? "bg-natural-olive/10 text-natural-olive border border-natural-olive/20" :
                            "bg-natural-warm/10 text-natural-warm border border-natural-warm/20"
                          }`}>
                            Paiement : {b.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-t border-b border-natural-border text-xs">
                        <div>
                          <span className="text-natural-muted block mb-0.5">Inscrits ({b.passengers?.length || 1}) :</span>
                          <span className="font-semibold text-natural-main">
                            {b.passengers?.join(", ")}
                          </span>
                        </div>
                        <div>
                          <span className="text-natural-muted block mb-0.5">Montant Total :</span>
                          <span className="font-extrabold text-natural-main text-sm">{b.totalAmount.toLocaleString("fr-FR")} DA</span>
                        </div>
                        <div>
                          <span className="text-natural-muted block mb-0.5">Déjà versé :</span>
                          <span className="font-extrabold text-natural-olive text-sm">
                            {(b.paymentAmount || 0).toLocaleString("fr-FR")} DA
                            {b.paymentMethod && <span className="text-[10px] text-natural-muted font-normal"> ({b.paymentMethod})</span>}
                          </span>
                        </div>
                      </div>

                      {/* Display AI Custom responses attached if any */}
                      {b.aiCustomization && (
                        <div className="bg-natural-bg/50 rounded-2xl p-4 border border-natural-border text-xs text-natural-muted">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-natural-olive mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-natural-olive" />
                            <span>Votre Guide de voyage sur-mesure (Généré par IA) :</span>
                          </div>
                          <p className="line-clamp-3 overflow-hidden text-natural-muted italic whitespace-normal text-[11px] leading-relaxed">
                            {b.aiCustomization.replace(/[#*]/g, "").slice(0, 180)}...
                          </p>
                          <button
                            onClick={() => { setTicketToPrint(b); }}
                            className="text-[10px] text-natural-olive font-bold hover:underline mt-1.5 block"
                          >
                            Consulter l'itinéraire complet & imprimer le carnet →
                          </button>
                        </div>
                      )}

                      {/* Bottom actions inside booking panel */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        {/* Printable voucher action */}
                        <button
                          onClick={() => setTicketToPrint(b)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-natural-muted hover:text-natural-olive cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-natural-olive" />
                          <span>Imprimer le Bon de Voyage (Voucher)</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {/* Payment triggers */}
                          {remainsToPay > 0 && b.status !== "Annulé" && (
                            <>
                              {b.paymentStatus === "Non payé" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPayment(b, "deposit")}
                                  className="h-8 px-3 text-xs bg-natural-card text-natural-main border border-natural-border rounded-lg font-bold hover:bg-natural-bg transition-colors cursor-pointer"
                                >
                                  Payer l'acompte (100 000 DA)
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenPayment(b, "total")}
                                className="h-8 px-3 text-xs bg-natural-warm hover:bg-natural-warm-hover text-white rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Régler le Solde ({remainsToPay.toLocaleString("fr-FR")} DA)</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* POPUP SIMULATE      {/* POPUP SIMULATED PORTAL CARD DEPOSIT PAYMENT */}
      {payingBooking && (
        <div className="fixed inset-0 z-50 bg-[#2c2a26]/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-natural-card rounded-3xl w-full max-w-md p-6 border border-natural-border shadow-md space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-natural-main">Passerelle de Paiement Sécurisé</h3>
                <p className="text-[11px] text-natural-muted mt-1">Séjours DZ • Validation instantanée</p>
              </div>
              <button
                onClick={() => setPayingBooking(null)}
                className="text-natural-muted hover:text-natural-main border border-natural-border w-7 h-7 flex items-center justify-center rounded-lg bg-natural-bg/50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {paymentDone ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-natural-olive/20 text-natural-olive mx-auto flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-md font-bold text-natural-main">Paiement validé !</h4>
                <p className="text-xs text-natural-muted leading-relaxed">
                  {selectedPaymentMethod === "card" && (
                    <>
                      Votre paiement en ligne sécurisé par carte CIB/Dahabia de <span className="font-extrabold text-natural-main">{paymentAmount.toLocaleString("fr-FR")} DA</span> a été autorisé en ligne.
                    </>
                  )}
                  {selectedPaymentMethod === "cash" && (
                    <>
                      Votre dépôt d'espèces (Cash) de <span className="font-extrabold text-natural-main">{paymentAmount.toLocaleString("fr-FR")} DA</span> en agence a été enregistré avec succès.
                    </>
                  )}
                  {selectedPaymentMethod === "virement" && (
                    <>
                      Votre reçu / bordereau de versement en cash / CCP de <span className="font-extrabold text-natural-main">{paymentAmount.toLocaleString("fr-FR")} DA</span> a été transmis et validé instantanément.
                    </>
                  )}
                  <br />
                  <span className="block mt-2 font-semibold text-natural-olive">Votre dossier a été mis à jour immédiatement.</span>
                </p>
              </div>
            ) : (
              <form onSubmit={handleProcessPaymentSubmit} className="space-y-4">
                {paymentError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-955 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-natural-bg/60 border border-natural-border text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-natural-muted font-medium">Dossier de voyage :</span>
                    <span className="font-bold text-natural-main">{payingBooking.packageTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-natural-muted font-medium">Montant à régler :</span>
                    <span className="font-black text-natural-olive text-sm">{paymentAmount.toLocaleString("fr-FR")} DA</span>
                  </div>
                </div>

                {/* Mode de règlement tab header */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-natural-muted uppercase tracking-wider">Mode de règlement</label>
                  <div className="grid grid-cols-3 gap-1 bg-natural-bg/60 p-1 rounded-xl border border-natural-border">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("card")}
                      className={`py-1.5 text-[9px] sm:text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        selectedPaymentMethod === "card"
                          ? "bg-white text-natural-olive shadow-xs"
                          : "text-natural-muted hover:text-natural-main"
                      }`}
                    >
                      CIB / Dahabia
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("cash")}
                      className={`py-1.5 text-[9px] sm:text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        selectedPaymentMethod === "cash"
                          ? "bg-white text-natural-olive shadow-xs"
                          : "text-natural-muted hover:text-natural-main"
                      }`}
                    >
                      En espèces (Cash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod("virement")}
                      className={`py-1.5 text-[9px] sm:text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        selectedPaymentMethod === "virement"
                          ? "bg-white text-natural-olive shadow-xs"
                          : "text-natural-muted hover:text-natural-main"
                      }`}
                    >
                      CCP / Virement
                    </button>
                  </div>
                </div>

                {/* Conditional forms */}
                {selectedPaymentMethod === "card" && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 p-2 rounded-lg border border-natural-border text-[11px] font-semibold bg-natural-bg/40 text-natural-muted">
                        <ShieldCheck className="w-4 h-4 text-natural-olive" />
                        <span>Paiement en ligne sécurisé par Carte CIB / Dahabia</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-natural-muted uppercase tracking-wider mb-1">Numéro de carte</label>
                      <input
                        type="text"
                        className="w-full text-xs p-2.5 rounded-lg border border-natural-border focus:outline-hidden bg-white text-natural-main"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-natural-muted uppercase tracking-wider mb-1">Expiration</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          className="w-full text-xs p-2.5 rounded-lg border border-natural-border text-center focus:outline-hidden bg-white text-natural-main"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-natural-muted uppercase tracking-wider mb-1">Cryptogramme CVC</label>
                        <input
                          type="password"
                          placeholder="123"
                          className="w-full text-xs p-2.5 rounded-lg border border-natural-border text-center focus:outline-hidden bg-white text-natural-main"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedPaymentMethod === "cash" && (
                  <div className="p-3 bg-natural-bg/40 rounded-2xl border border-natural-border space-y-2 text-xs">
                    <p className="text-natural-main font-semibold text-[11px]">Paiement en espèces (Cash) en agence :</p>
                    <p className="text-natural-muted leading-relaxed text-[10px]">
                      Veuillez vous présenter à notre agence principale <strong>Séjours DZ</strong> à Alger pour régler le montant de votre voyage en espèces.
                    </p>
                    <div className="p-2 border border-dashed border-natural-border rounded-xl bg-white text-[10px] text-natural-muted">
                      📍 <strong>Adresse :</strong> Boulevard Didouche Mourad, Alger-Centre<br />
                      📞 <strong>Tél :</strong> +213 (0) 21 55 55 55
                    </div>
                    <p className="text-[10px] text-natural-olive italic pt-1">
                      * Pour simuler l'enregistrement immédiat de ce versement en espèces, cliquez sur le bouton ci-dessous.
                    </p>
                  </div>
                )}

                {selectedPaymentMethod === "virement" && (
                  <div className="space-y-3">
                    <div className="p-3 bg-natural-bg/40 rounded-2xl border border-natural-border space-y-2 text-xs">
                      <p className="text-natural-main font-semibold text-[11px]">Virement / Versement par Compte CCP ou Banque :</p>
                      <p className="text-[10px] text-natural-muted">
                        Veuillez effectuer le versement de l'acompte ou du solde sur nos comptes officiels :
                      </p>
                      <div className="space-y-1.5 text-[10px]">
                        <div className="p-1.5 bg-white rounded-lg border border-natural-border">
                          <span className="font-bold block text-[9px] text-natural-muted uppercase">COMPTE CCP ALGERIE POSTE :</span>
                          CCP : <strong className="font-mono text-natural-olive">001799999 / Clé 99</strong>
                        </div>
                        <div className="p-1.5 bg-white rounded-lg border border-natural-border">
                          <span className="font-bold block text-[9px] text-natural-muted uppercase font-serif">BANQUE NATIONALE D'ALGERIE (BNA) :</span>
                          RIB : <strong className="font-mono text-natural-olive">001 00890 0300000000 82</strong>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-natural-muted uppercase tracking-wider mb-1">
                        Numéro de Bordereau / Référence du versement
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: CCP-98213829-DZ"
                        required
                        className="w-full text-xs p-2.5 rounded-lg border border-natural-border focus:outline-hidden bg-white text-natural-main"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-11 bg-natural-olive hover:bg-natural-olive-hover text-white font-extrabold text-xs rounded-xl shadow-xs transition-all uppercase tracking-wider cursor-pointer"
                >
                  {selectedPaymentMethod === "card" && `Valider le paiement simulé de ${paymentAmount.toLocaleString("fr-FR")} DA`}
                  {selectedPaymentMethod === "cash" && `Confirmer le dépôt Cash de ${paymentAmount.toLocaleString("fr-FR")} DA`}
                  {selectedPaymentMethod === "virement" && `Valider le bordereau de ${paymentAmount.toLocaleString("fr-FR")} DA`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TICKET / BON DE VOYAGE PRINT PREVIEW MODAL */}
      {ticketToPrint && (
        <div className="fixed inset-0 z-50 bg-[#2c2a26]/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 border border-natural-border shadow-lg space-y-6 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-natural-border">
              <div>
                <h3 className="font-serif text-lg font-bold text-natural-main">Votre Voucher & Carnet de Voyage</h3>
                <p className="text-xs text-natural-muted">Séjours DZ • Document officiel</p>
              </div>
              <button
                onClick={() => setTicketToPrint(null)}
                className="text-natural-muted hover:text-natural-main border border-natural-border w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer bg-natural-bg/50"
              >
                ✕
              </button>
            </div>

            {/* Print Content Card area */}
            <div className="p-6 border-2 border-dashed border-natural-border rounded-3xl space-y-6 bg-natural-bg/30" id="printable-voucher-area">
              {/* Header inside voucher */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-serif text-md font-bold text-natural-olive">HORIZON VOYAGES</h4>
                  <p className="text-[10px] text-natural-muted">Licence Tourisme IM07504289 • info@horizonvoyages.fr</p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-natural-muted block">Dossier de Réservation :</span>
                  <span className="font-mono font-bold text-natural-main bg-white border border-natural-border px-2 py-0.5 rounded-md text-[11px] shadow-2xs">{ticketToPrint.id}</span>
                </div>
              </div>

              {/* Status checklist and Info ticket layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-natural-border text-xs">
                <div>
                  <span className="text-natural-muted block mb-0.5">Offre commerciale :</span>
                  <span className="font-serif font-bold text-natural-main text-sm block mb-2">{ticketToPrint.packageTitle}</span>
                  <span className="text-natural-muted block mb-0.5">Titulaire du dossier :</span>
                  <span className="font-semibold text-natural-main">{ticketToPrint.clientName}</span>
                </div>

                <div className="sm:border-l sm:border-natural-border sm:pl-4 space-y-1">
                  <div>
                    <span className="text-natural-muted block">Statut du dossier :</span>
                    <span className="font-bold text-natural-olive uppercase text-[11px]">{ticketToPrint.status}</span>
                  </div>
                  <div>
                    <span className="text-natural-muted block">Solde financier :</span>
                    <span className="font-bold text-natural-main uppercase text-[11px]">{ticketToPrint.paymentStatus}</span>
                  </div>
                  <div>
                    <span className="text-natural-muted block">Date d'édition :</span>
                    <span className="text-natural-muted font-medium">{new Date().toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              </div>

              {/* Traveler List inside printable voucher */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-natural-muted block">Voyageurs Inscrits</span>
                <div className="bg-white p-4 rounded-xl border border-natural-border space-y-1">
                  {ticketToPrint.passengers?.map((pass, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs font-semibold text-natural-main">
                      <span className="text-natural-olive font-bold">✓</span>
                      <span>M./Mme {pass} (Siège Vol & Logement Inclus)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special instructions in voucher */}
              {ticketToPrint.specialRequests && (
                <div className="space-y-1.5 text-xs text-natural-muted">
                  <span className="text-xs font-bold uppercase tracking-wider text-natural-muted block">Demandes Spéciales Attachées</span>
                  <div className="bg-white p-3 rounded-xl border border-natural-border italic font-medium">
                    "{ticketToPrint.specialRequests}"
                  </div>
                </div>
              )}

              {/* Printable Complete AI Personalized Guide lines */}
              {ticketToPrint.aiCustomization && (
                <div className="space-y-2 border-t border-natural-border pt-4 text-xs">
                  <span className="font-bold text-natural-olive flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-natural-olive" />
                    <span>Carnet Personnalisé Évasion (Adaptation IA)</span>
                  </span>
                  <div className="bg-white p-4 rounded-2xl border border-natural-border space-y-2 font-medium text-[11px] text-natural-muted max-h-48 overflow-y-auto leading-relaxed">
                    {ticketToPrint.aiCustomization.split("\n").map((line, idx) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith("###")) {
                        return <h5 key={idx} className="font-serif font-bold text-natural-main mt-3 first:mt-0">{trimmed.replace("###", "")}</h5>;
                      }
                      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
                        return <li key={idx} className="ml-3 list-disc my-0.5">{trimmed.slice(1).trim()}</li>;
                      }
                      return <p key={idx}>{trimmed}</p>;
                    })}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-center text-natural-muted/65 italic">
                Présentez ce bon de confirmation imprimé ou numérique lors de votre enregistrement à l'aéroport et d'arrivée à l'hôtel d'Évasion.
              </p>
            </div>

            {/* Print trigger actions */}
            <div className="flex items-center justify-end gap-3 text-xs font-bold pt-4 border-t border-natural-border">
              <button
                onClick={() => setTicketToPrint(null)}
                className="h-10 px-4 rounded-xl text-natural-muted hover:bg-natural-bg cursor-pointer font-semibold"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="h-10 px-5 bg-natural-olive text-white hover:bg-natural-olive-hover rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer / Sauvegarder en PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
