import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageSquare, Map, Award } from "lucide-react";
import { Language } from "../translations";

interface ContactProps {
  lang: Language;
}

export default function Contact({ lang }: ContactProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isRtl = lang === "ar";

  const text = {
    fr: {
      contactTitle: "Contactez notre Agence",
      contactSubtitle: "Une question ? Un projet de voyage sur-mesure ? Nos conseillers sont à votre écoute.",
      addressLabel: "Adresse de l'agence physique",
      addressValue: "Rue Abdelkrim Hamza, Lot B1 RDC, Dely Ibrahim, 16042 Alger, Algérie",
      phoneLabel: "Lignes téléphoniques",
      emailLabel: "Adresses e-mail",
      hoursLabel: "Heures d'ouverture",
      hoursValue: "Du Samedi au Jeudi : 09:00 - 18:00 (Vendredi : Fermé)",
      hoursSub: "Assistance client téléphonique 24h/24 pour les voyageurs en cours de séjour.",
      
      formTitle: "Envoyer un message en direct",
      formName: "Nom complet",
      formEmail: "Adresse email",
      formPhone: "Numéro de téléphone",
      formSubject: "Sujet du message",
      formMessage: "Votre message",
      formSubmit: "Envoyer le message",
      formSending: "Envoi en cours...",
      formSuccessTitle: "Message envoyé avec succès !",
      formSuccessDesc: "Merci pour votre intérêt. Un conseiller voyages de l'agence Séjours DZ vous contactera par téléphone ou par e-mail dans un délai de 2 à 4 heures.",
      formReset: "Envoyer un autre message",
      
      mapTitle: "Nous situer à Dely Ibrahim",
      mapDesc: "Retrouvez-nous à notre agence de Dely Ibrahim pour finaliser votre dossier ou concevoir votre voyage sur-mesure."
    },
    en: {
      contactTitle: "Get in Touch with Us",
      contactSubtitle: "Have questions? Need a tailored group package? Our travel advisors are online.",
      addressLabel: "Physical Headquarters",
      addressValue: "Abdelkrim Hamza Street, Lot B1 G.F., Dely Ibrahim, 16042 Algiers, Algeria",
      phoneLabel: "Telephone Hotlines",
      emailLabel: "Corporate Emails",
      hoursLabel: "Working Hours",
      hoursValue: "Saturday to Thursday: 09:00 AM - 06:00 PM (Friday: Closed)",
      hoursSub: "24/7 priority emergency telephone hotline for ongoing travelers in active destinations.",
      
      formTitle: "Send a Direct Message",
      formName: "Full Name",
      formEmail: "Email Address",
      formPhone: "Phone Number",
      formSubject: "Inquiry Subject",
      formMessage: "Your Message",
      formSubmit: "Send Inquiry",
      formSending: "Sending...",
      formSuccessTitle: "Message sent successfully!",
      formSuccessDesc: "Thank you for your interest. A dedicated travel representative from Séjours DZ will contact you by phone or email within 2 to 4 hours.",
      formReset: "Send another message",
      
      mapTitle: "Locate us in Dely Ibrahim",
      mapDesc: "Visit our office in Dely Ibrahim to finalize your bookings or design your tailored journey."
    },
    ar: {
      contactTitle: "اتصل بوكالتنا السياحية",
      contactSubtitle: "لديك استفسار ؟ ترغب في رحلة مخصصة لشركتك أو عائلتك ؟ مستشارونا في الخدمة.",
      addressLabel: "العنوان الفعلي لمقر الوكالة",
      addressValue: "شارع عبد الكريم حمزة، تجزئة B1 الطابق الأرضي، دالي إبراهيم، 16042 الجزائر",
      phoneLabel: "الخطوط الهاتفية المباشرة",
      emailLabel: "عناوين البريد الإلكتروني",
      hoursLabel: "أوقات العمل الرسمية",
      hoursValue: "من السبت إلى الخميس: 09:00 صباحاً - 06:00 مساءً (الجمعة: مغلق)",
      hoursSub: "مرافقة وإرشاد هاتفي طوارئ متوفر 24 ساعة طيلة أيام الأسبوع لجميع مسافرينا قيد الرحلات.",
      
      formTitle: "إرسال رسالة مباشرة للمبيعات",
      formName: "الاسم واللقب الكامل",
      formEmail: "البريد الإلكتروني",
      formPhone: "رقم الهاتف",
      formSubject: "موضوع الرسالة",
      formMessage: "نص الرسالة أو الاستفسار",
      formSubmit: "إرسال الاستفسار الآن",
      formSending: "جاري الإرسال...",
      formSuccessTitle: "تم إرسال رسالتك بنجاح !",
      formSuccessDesc: "شكراً لاهتمامك بوكالتنا. سيقوم أحد مستشاري السفر لدينا بالاتصال بك هاتفياً أو عبر البريد الإلكتروني في غضون ساعتين إلى 4 ساعات كأقصى تقدير.",
      formReset: "إرسال رسالة أخرى",
      
      mapTitle: "موقعنا في دالي إبراهيم",
      mapDesc: "تفضلوا بزيارة مكتبنا في دالي إبراهيم لتأكيد حجوزاتكم أو تصميم برنامج سفركم المخصص."
    }
  };

  const t = text[lang] || text.fr;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSubmitted(true);
    }, 1000);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: ""
    });
    setSubmitted(false);
  };

  return (
    <div id="contact-section-container" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Header and coordinates block */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-black text-natural-main">
          {t.contactTitle}
        </h1>
        <p className="text-xs sm:text-sm text-natural-muted">
          {t.contactSubtitle}
        </p>
      </div>

      {/* Grid: Coordinates & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Info list on the left (col-span-5) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-natural-border space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="font-serif text-xl font-bold text-natural-main">
              {lang === "ar" ? "معلومات الاتصال" : "Informations de Contact"}
            </h2>

            <div className="space-y-5">
              {/* Address */}
              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-natural-olive/10 text-natural-olive rounded-xl mt-0.5 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-natural-muted/70 block">{t.addressLabel}</span>
                  <span className="text-xs font-semibold text-natural-main block">{t.addressValue}</span>
                </div>
              </div>

              {/* Phones */}
              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-natural-olive/10 text-natural-olive rounded-xl mt-0.5 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-natural-muted/70 block">{t.phoneLabel}</span>
                  <div className="flex flex-col gap-1.5">
                    <a href="tel:+21321658890" className="text-xs font-bold text-[#0071eb] hover:underline block" dir="ltr">
                      +213 (0) 21 65 88 90 <span className="text-[9px] font-normal text-natural-muted">(Fixe Alger Center)</span>
                    </a>
                    <a href="tel:+213 550 70 44 66" className="text-xs font-bold text-[#0071eb] hover:underline block" dir="ltr">
                      +213 (0) 550 70 44 66 <span className="text-[9px] font-normal text-natural-muted">(Mobile & WhatsApp)</span>
                    </a>
                    <a href="tel:+213791679939" className="text-xs font-bold text-[#0071eb] hover:underline block" dir="ltr">
                      +213 (0) 791 67 99 39 <span className="text-[9px] font-normal text-natural-muted">(Service Client)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Emails */}
              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-natural-olive/10 text-natural-olive rounded-xl mt-0.5 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-natural-muted/70 block">{t.emailLabel}</span>
                  <div className="flex flex-col gap-1">
                    <a href="mailto:contact@sejours-dz.com" className="text-xs font-bold text-[#0071eb] hover:underline block">
                      contact@sejours-dz.com
                    </a>
                    <a href="mailto:reservations@sejours-dz.com" className="text-xs font-bold text-[#0071eb] hover:underline block">
                      reservations@sejours-dz.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="pt-5 border-t border-natural-border flex items-start gap-3.5 mt-4">
            <div className="p-2 bg-natural-olive/10 text-natural-olive rounded-xl mt-0.5 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-natural-muted/70 block">{t.hoursLabel}</span>
              <span className="text-xs font-bold text-natural-main block">{t.hoursValue}</span>
              <span className="text-[10px] text-natural-muted block leading-tight">{t.hoursSub}</span>
            </div>
          </div>
        </div>

        {/* Message form (col-span-7) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-natural-border flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="font-serif text-xl font-bold text-natural-main flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-natural-olive" />
                <span>{t.formTitle}</span>
              </h2>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-natural-main mb-1">{t.formName} *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Amine Benali"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-natural-border bg-natural-bg/40 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-natural-main mb-1">{t.formEmail} *</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: amine@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-natural-border bg-natural-bg/40 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-natural-main mb-1">{t.formPhone}</label>
                    <input
                      type="tel"
                      placeholder="Ex: +213 550 70 44 66"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-natural-border bg-natural-bg/40 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-natural-main mb-1">{t.formSubject}</label>
                    <input
                      type="text"
                      placeholder="Ex: Demande de voyage de noces"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-natural-border bg-natural-bg/40 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-natural-main mb-1">{t.formMessage} *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Écrivez ici vos questions ou précisez votre projet de séjour personnalisé..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-natural-border bg-natural-bg/40 focus:outline-hidden focus:ring-2 focus:ring-natural-olive/20 focus:border-natural-olive resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full sm:w-auto h-11 bg-natural-olive hover:bg-natural-olive-hover text-white px-6 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t.formSending}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t.formSubmit}</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="py-8 text-center space-y-4 animate-in zoom-in duration-300">
                <div className="mx-auto w-12 h-12 bg-natural-olive/10 text-natural-olive rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-natural-main">{t.formSuccessTitle}</h3>
                <p className="text-xs text-natural-muted leading-relaxed max-w-md mx-auto">
                  {t.formSuccessDesc}
                </p>
                <button
                  onClick={resetForm}
                  className="text-xs font-bold text-[#0071eb] hover:underline cursor-pointer pt-2"
                >
                  {t.formReset}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Vector Interactive Map */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-natural-border space-y-4">
        <div className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-natural-main flex items-center gap-2">
            <Map className="w-5 h-5 text-natural-olive" />
            <span>{t.mapTitle}</span>
          </h2>
          <p className="text-xs text-natural-muted leading-relaxed">{t.mapDesc}</p>
        </div>

        {/* Real Interactive Google Maps Embed */}
        <div className="h-96 w-full rounded-2xl border border-natural-border overflow-hidden mt-4 shadow-xs">
          <iframe
            title="Google Maps - Séjours DZ"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src="https://maps.google.com/maps?q=Rue%20Abdelkrim%20Hamza%20Lot%20B1%20RDC%20Dely%20Ibrahim%2016042%20Alger&t=&z=16&ie=UTF8&iwloc=&output=embed"
          ></iframe>
        </div>
      </div>

    </div>
  );
}
