import React from "react";
import { Award, HeartHandshake, ShieldCheck, Globe, Star } from "lucide-react";
import { Language } from "../translations";

interface AboutProps {
  lang: Language;
}

export default function About({ lang }: AboutProps) {
  const isRtl = lang === "ar";

  const text = {
    fr: {
      aboutTitle: "À propos de Séjours DZ",
      aboutSubtitle: "Votre passerelle vers des évasions inoubliables en Algérie et partout dans le monde.",
      introParagraph: "Séjours DZ (sous l'égide de l'agence officielle Évasion Voyages S.A.S., agréée par l'État sous le numéro de Licence 1245/2026) est le leader de l'organisation et de la réservation de voyages sur-mesure en Algérie. Nous combinons l'expertise de guides locaux certifiés, le confort d'hébergements triés sur le volet et l'intelligence de notre conseiller IA Gemini pour façonner des expériences de vacances uniques, mémorables et totalement sécurisées.",
      ourVision: "Notre Vision & Nos Valeurs",
      ourVisionDesc: "Chez Séjours DZ, nous croyons que voyager ne consiste pas seulement à visiter de nouveaux endroits, mais à s'immerger profondément dans des cultures différentes, à goûter à des saveurs locales authentiques et à créer des souvenirs précieux. Nous nous engageons à promouvoir un tourisme responsable et de haute qualité qui soutient les communautés locales algériennes tout en garantissant des prestations haut de gamme à nos voyageurs.",
      whyUsTitle: "Pourquoi nous faire confiance ?",
      why1Title: "Agrément d'État Officiel",
      why1Desc: "Une agence de voyage certifiée et agréée offrant des garanties de voyage complètes.",
      why2Title: "Paiement Sécurisé & Flexible",
      why2Desc: "Réglez en ligne par carte CIB/Dahabia, par virement CCP ou directement en espèces dans notre agence.",
      why3Title: "Conseiller Intelligent IA",
      why3Desc: "Personnalisez vos itinéraires, repas et activités grâce à notre intégration intelligente Gemini.",
      teamTitle: "Notre Équipe d'Experts",
      teamDesc: "Constituée de professionnels du tourisme algérien passionnés, notre équipe est constamment à la recherche de nouvelles pépites et d'expériences exclusives pour embellir vos séjours."
    },
    en: {
      aboutTitle: "About Séjours DZ",
      aboutSubtitle: "Your premium gateway to unforgettable getaways in Algeria and worldwide.",
      introParagraph: "Séjours DZ (operated by the official licensed travel agency Évasion Voyages S.A.S., licensed under N° 1245/2026) is the leading digital vacation booking platform in Algeria. We combine the expertise of certified local guides, premium handpicked accommodations, and our bespoke Gemini AI travel assistant to craft unique, hassle-free, and secure holiday memories.",
      ourVision: "Our Vision & Our Values",
      ourVisionDesc: "At Séjours DZ, we believe that traveling is not just about visiting new locations, but deeply immersing yourself in unique cultures, savoring authentic local flavors, and creating lifetime memories. We are dedicated to promoting responsible and high-quality tourism that supports Algerian local communities while ensuring world-class service standards for our travelers.",
      whyUsTitle: "Why Choose Our Agency?",
      why1Title: "Official State License",
      why1Desc: "A fully licensed, approved, and regulated agency ensuring high customer insurance guarantees.",
      why2Title: "Safe & Multi-Channel Payments",
      why2Desc: "Settle your bookings using local CIB/Dahabia bank cards, direct CCP postal transfer, or cash desk.",
      why3Title: "Smart Generative AI Assistant",
      why3Desc: "Instantly adapt your daily dining options, physical tempo, and sightseeing guides with Gemini.",
      teamTitle: "Our Travel Experts Team",
      teamDesc: "Composed of deeply passionate Algerian travel professionals, our team continuously explores hidden gems and exclusive adventures to elevate your vacation experience."
    },
    ar: {
      aboutTitle: "حول وكالة Séjours DZ",
      aboutSubtitle: "بوابتكم السياحية المثالية لتجارب عطلات لا تُنسى في الجزائر ومختلف أنحاء العالم.",
      introParagraph: "تعتبر وكالة Séjours DZ (التابعة للوكالة السياحية الرسمية المعتمدة من طرف الدولة Évasion Voyages S.A.S. بموجب رخصة رقم 1245/2026) المنصة الرائدة في تنظيم وحجز الرحلات السياحية الشاملة في الجزائر. نجمع بين مهارات المرشدين المحليين المعتمدين، وأرقى الفنادق المنتقاة بعناية، وتكنولوجيا مستشار الذكاء الاصطناعي Gemini لتصميم رحلات فريدة، ممتعة، وبأعلى معايير الأمان المالي والجسدي.",
      ourVision: "رؤيتنا وقيمنا الأساسية",
      ourVisionDesc: "نحن في Séjours DZ نؤمن بأن السفر ليس مجرد زيارة أماكن جديدة، بل هو اندماج عميق في الثقافات المتنوعة، وتذوق النكهات المحلية الأصيلة، وصناعة ذكريات تدوم مدى الحياة. نحن ملتزمون بتعزيز السياحة المسؤولة وذات الجودة العالية التي تدعم المجتمعات المحلية الجزائرية مع ضمان خدمات راقية وممتازة لجميع مسافرينا.",
      whyUsTitle: "لماذا يختار المسافرون وكالتنا ؟",
      why1Title: "ترخيص رسمي معتمد",
      why1Desc: "وكالة سياحية معتمدة بالكامل من وزارة السياحة تقدم ضمانات مالي وتغطية سفر شاملة.",
      why2Title: "دفع آمن ومتعدد القنوات",
      why2Desc: "ادفع قيمة حجزك بمرونة تامة ببطاقتك البنكية CIB/الذهبية، حوالة CCP، أو نقداً بفرع الوكالة.",
      why3Title: "مستشار ذكي فوري بالذكاء الاصطناعي",
      why3Desc: "قم بتخصيص الوجبات الغذائية، وتيرة المشي، والأنشطة المناسبة لعائلتك بالذكاء الاصطناعي التوليدي.",
      teamTitle: "فريق خبراء السفر لدينا",
      teamDesc: "يتكون فريقنا من محترفي السياحة الجزائريين الشغوفين، والذين يبحثون باستمرار عن أفضل الوجهات والأنشطة الحصرية لجعلك تستمتع برحلتك بأفضل شكل ممكن."
    }
  };

  const t = text[lang] || text.fr;

  return (
    <div id="about-section-container" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Hero Banner Banner */}
      <div className="bg-gradient-to-br from-[#1a2b49] to-[#0f1a30] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-slate-800 shadow-lg">
        <div className="absolute right-0 top-0 w-96 h-96 bg-natural-olive/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-natural-warm/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-natural-olive bg-natural-olive/10 px-3.5 py-1.5 rounded-full border border-natural-olive/20">
            <Award className="w-4 h-4 shrink-0" />
            {lang === "ar" ? "وكالة سياحية معتمدة" : "Agence de Tourisme Agréée"}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-black leading-tight text-white">
            {t.aboutTitle}
          </h1>
          <p className="text-sm sm:text-lg text-slate-300 font-medium leading-relaxed">
            {t.aboutSubtitle}
          </p>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main story info */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-natural-border space-y-6">
          <div className="space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-natural-main flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-natural-olive" />
              <span>{t.ourVision}</span>
            </h2>
            <p className="text-xs sm:text-sm text-natural-muted leading-relaxed">
              {t.introParagraph}
            </p>
            <p className="text-xs sm:text-sm text-natural-muted leading-relaxed">
              {t.ourVisionDesc}
            </p>
          </div>

          <div className="pt-6 border-t border-natural-border">
            <h3 className="font-serif text-md sm:text-lg font-bold text-natural-main mb-4">{t.whyUsTitle}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-natural-bg/50 border border-natural-border space-y-2">
                <ShieldCheck className="w-6 h-6 text-natural-olive shrink-0" />
                <h4 className="text-xs font-bold text-natural-main">{t.why1Title}</h4>
                <p className="text-[10px] text-natural-muted leading-relaxed">{t.why1Desc}</p>
              </div>
              <div className="p-4 rounded-2xl bg-natural-bg/50 border border-natural-border space-y-2">
                <Award className="w-6 h-6 text-natural-olive shrink-0" />
                <h4 className="text-xs font-bold text-natural-main">{t.why2Title}</h4>
                <p className="text-[10px] text-natural-muted leading-relaxed">{t.why2Desc}</p>
              </div>
              <div className="p-4 rounded-2xl bg-natural-bg/50 border border-natural-border space-y-2">
                <Globe className="w-6 h-6 text-natural-olive shrink-0" />
                <h4 className="text-xs font-bold text-natural-main">{t.why3Title}</h4>
                <p className="text-[10px] text-natural-muted leading-relaxed">{t.why3Desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Side Banner Team Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-natural-card p-6 sm:p-8 rounded-3xl border border-natural-border space-y-4">
            <div className="w-10 h-10 bg-natural-olive/10 rounded-full flex items-center justify-center text-natural-olive">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-natural-main">
              {t.teamTitle}
            </h3>
            <p className="text-xs text-natural-muted leading-relaxed">
              {t.teamDesc}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white overflow-hidden text-center text-xs font-bold flex items-center justify-center text-slate-600 shadow-xs">A</div>
              <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white overflow-hidden text-center text-xs font-bold flex items-center justify-center text-slate-600 shadow-xs -ml-2">K</div>
              <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white overflow-hidden text-center text-xs font-bold flex items-center justify-center text-slate-600 shadow-xs -ml-2">M</div>
              <span className="text-[10px] font-bold text-natural-muted ml-2">
                {lang === "ar" ? "+15 وكيل مبيعات مرخص" : "+15 Conseillers agréés"}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
