export type Language = "fr" | "en" | "ar";

export interface AppTranslations {
  brandTitle: string;
  brandSubtitle: string;
  tabOffers: string;
  tabClient: string;
  tabAbout: string;
  tabContact: string;
  tabAdmin: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  searchDestinationPlaceholder: string;
  searchDestinationLabel: string;
  searchDateLabel: string;
  searchBudgetLabel: string;
  searchButton: string;
  clearFilters: string;
  browseCategories: string;
  promoBadge: string;
  freeCancellation: string;
  instantConfirmation: string;
  spotsLeft: string;
  fullyBooked: string;
  startingFrom: string;
  viewOffer: string;
  days: string;
  departure: string;
  reviewsCount: string;
  backToOffers: string;
  inclusionsTitle: string;
  exclusionsTitle: string;
  programTitle: string;
  dayWord: string;
  travelerReviewsTitle: string;
  aiAdvisorTitle: string;
  aiAdvisorSubtitle: string;
  aiAdvisorPlaceholder: string;
  aiInterestsLabel: string;
  aiInterestGourmet: string;
  aiInterestHistory: string;
  aiInterestExcursions: string;
  aiInterestPhotos: string;
  aiInterestRelax: string;
  aiGenerateButton: string;
  aiGeneratingStatus: string;
  verifyAvailability: string;
  primaryContactTitle: string;
  fullNameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  travelersCountLabel: string;
  travelerLabel: string;
  specialRequestsLabel: string;
  submitBooking: string;
  errorPrimaryFields: string;
  errorAllPassengers: string;
  noFailsTitle: string;
  noFailsContent1: string;
  noFailsContent2: string;
  noFailsContent3: string;
  adminRequired: string;
  bookingsEmpty: string;
  statsTitle: string;
  statsBookings: string;
  statsRevenue: string;
  statsActive: string;
  statsPending: string;
  searchBookingsPlaceholder: string;
  totalPaid: string;
  depositPaid: string;
  unpaid: string;
  bookingConfirmed: string;
  bookingPending: string;
  bookingCancelled: string;
  detailsLabel: string;
  cancelBookingButton: string;
  confirmBookingButton: string;
  paymentTitle: string;
  paymentOnlineOption: string;
  paymentCashOption: string;
  paymentBankOption: string;
  paymentAmountToPay: string;
  paymentCardInputNumber: string;
  paymentCardInputHolder: string;
  paymentCardSubmit: string;
  paymentCashSubmit: string;
  paymentBankSubmit: string;
  paymentSuccessHeader: string;
  paymentSuccessBodyCard: string;
  paymentSuccessBodyCash: string;
  paymentSuccessBodyBank: string;
  paymentFolderUpdated: string;
  paymentWaitingConfirmation: string;
  orderSummaryTitle: string;
  orderTotal: string;
  ticketPrintButton: string;
  ticketDownloadInvoice: string;
  checkInStatusHeader: string;
  checkInStatusVerified: string;
  checkInStatusWarning: string;
  clientAreaIntro: string;
  clientAreaEmpty: string;
  clientAreaWelcome: string;
  agentControlPanel: string;
  agentNewPackageBtn: string;
  agentEditTitle: string;
  agentFormPackageTitle: string;
  agentFormDesc: string;
  agentFormDest: string;
  agentFormDuration: string;
  agentFormPrice: string;
  agentFormPromo: string;
  agentFormImage: string;
  agentFormMaxSpots: string;
  agentFormCategory: string;
  agentFormStatus: string;
  agentFormInclusions: string;
  agentFormExclusions: string;
  agentFormSave: string;
  agentFormCancel: string;
  agentLogsTitle: string;
}

export const translations: Record<Language, AppTranslations> = {
  fr: {
    brandTitle: "Séjours DZ",
    brandSubtitle: "Évasion B2C",
    tabOffers: "Nos Offres",
    tabClient: "Mon Espace Client",
    tabAbout: "À propos",
    tabContact: "Contact",
    tabAdmin: "Espace Agent",
    heroBadge: "✨ AGENCE OFFICIELLE AGRÉÉE SÉJOURS DZ",
    heroTitle: "Trouvez des activités et voyages inoubliables",
    heroSubtitle: "Explorez notre sélection de packages tout inclus pour vos vacances de rêve et réservez instantanément en quelques clics.",
    searchDestinationLabel: "Où allez-vous ?",
    searchDestinationPlaceholder: "Ex: Istanbul, Sahara, Taghit...",
    searchDateLabel: "Quand (Dès le) ?",
    searchBudgetLabel: "Budget max par pers:",
    searchButton: "Chercher",
    clearFilters: "Effacer les filtres",
    browseCategories: "Parcourir par catégories d'expériences",
    promoBadge: "PROMO LIMITÉE",
    freeCancellation: "Annulation gratuite",
    instantConfirmation: "Confirmation immédiate",
    spotsLeft: "Plus que {num} places !",
    fullyBooked: "Complet",
    startingFrom: "À partir de",
    viewOffer: "Voir l'offre",
    days: "Jours",
    departure: "Départ :",
    reviewsCount: "avis",
    backToOffers: "Retour aux offres",
    inclusionsTitle: "Inclus dans le séjour",
    exclusionsTitle: "Non inclus / Suppléments",
    programTitle: "Programme du séjour",
    dayWord: "Jour",
    travelerReviewsTitle: "Avis voyageurs",
    aiAdvisorTitle: "Conseiller IA Évasion",
    aiAdvisorSubtitle: "Personnalisez les repas, le rythme journalier, ou recevez des suggestions locales selon votre profil grâce à notre IA intégrée sous Gemini.",
    aiAdvisorPlaceholder: "Exprimez vos besoins (ex: cuisine sans gluten, avec enfants en bas âge, rythme de marche modéré...)",
    aiInterestsLabel: "Sélectionnez vos centres d'intérêts :",
    aiInterestGourmet: "🍳 Gourmet / Gastronomie",
    aiInterestHistory: "🏛️ Histoire & Musées",
    aiInterestExcursions: "🐪 Excursions Physiques",
    aiInterestPhotos: "📸 Photos & Sights",
    aiInterestRelax: "🏊 Détente & Piscine",
    aiGenerateButton: "Générer mes suggestions sur-mesure",
    aiGeneratingStatus: "Génération de votre itinéraire de rêve par l'IA...",
    verifyAvailability: "Vérifier la disponibilité",
    primaryContactTitle: "Coordonnées du Responsable de Dossier :",
    fullNameLabel: "Nom & Prénom",
    emailLabel: "Adresse Email",
    phoneLabel: "Numéro de téléphone (Algérie de préférence)",
    travelersCountLabel: "Nombre de voyageurs :",
    travelerLabel: "Voyageur",
    specialRequestsLabel: "Demandes particulières / Notes pour l'hôtel :",
    submitBooking: "Soumettre la réservation",
    errorPrimaryFields: "Veuillez saisir les coordonnées principales du titulaire.",
    errorAllPassengers: "Veuillez saisir le nom complet de tous les voyageurs.",
    noFailsTitle: "Pas de frais de dossier",
    noFailsContent1: "Annulation gratuite disponible",
    noFailsContent2: "Pas de redevance additionnelle",
    noFailsContent3: "Assistance francophone / locale",
    adminRequired: "Accès administration sécurisé",
    bookingsEmpty: "Aucune réservation pour le moment.",
    statsTitle: "Indicateurs d'Activité de l'Agence",
    statsBookings: "Dossiers Réservés",
    statsRevenue: "Chiffre d'Affaires cumulé",
    statsActive: "Offres en Ligne",
    statsPending: "En attente de paiement",
    searchBookingsPlaceholder: "Rechercher par nom de client ou package...",
    totalPaid: "Payé",
    depositPaid: "Acompte payé",
    unpaid: "Non payé",
    bookingConfirmed: "Confirmé",
    bookingPending: "En attente",
    bookingCancelled: "Annulé",
    detailsLabel: "Détails",
    cancelBookingButton: "Annuler cette réservation",
    confirmBookingButton: "Valider le paiement en agence",
    paymentTitle: "Régler mon versement en toute sécurité",
    paymentOnlineOption: "Carte CIB / Dahabia",
    paymentCashOption: "Dépôt d'espèces (Cash)",
    paymentBankOption: "Virement / Bordereau CCP",
    paymentAmountToPay: "Montant à verser :",
    paymentCardInputNumber: "Numéro de carte CIB ou Dahabia (16 chiffres)",
    paymentCardInputHolder: "Nom du titulaire de la carte",
    paymentCardSubmit: "Autoriser le paiement par carte",
    paymentCashSubmit: "Enregistrer mon dépôt Cash en agence",
    paymentBankSubmit: "Valider mon virement instantané",
    paymentSuccessHeader: "Paiement validé !",
    paymentSuccessBodyCard: "Votre paiement en ligne sécurisé par carte CIB/Dahabia de {amount} DA a été autorisé en ligne.",
    paymentSuccessBodyCash: "Votre dépôt d'espèces (Cash) de {amount} DA en agence a été enregistré avec succès.",
    paymentSuccessBodyBank: "Votre reçu / bordereau de versement en cash / CCP de {amount} DA a été transmis et validé instantanément.",
    paymentFolderUpdated: "Votre dossier a été mis à jour immédiatement.",
    paymentWaitingConfirmation: "Notre service comptable valide la conformité du bordereau.",
    orderSummaryTitle: "Résumé de la Commande",
    orderTotal: "Montant Total",
    ticketPrintButton: "Imprimer mon reçu de paiement",
    ticketDownloadInvoice: "Facture certifiée PDF",
    checkInStatusHeader: "Statut d'Enregistrement / Vérification",
    checkInStatusVerified: "Votre dossier est à jour et votre place est sécurisée de manière définitive. Bon voyage !",
    checkInStatusWarning: "Votre dossier nécessite la validation finale d'un versement avant le départ.",
    clientAreaIntro: "Consultez, réglez et imprimez vos pièces de séjours Séjours DZ.",
    clientAreaEmpty: "Saisissez votre adresse email pour afficher vos dossiers d'évasions réservés en agence.",
    clientAreaWelcome: "Bienvenue sur votre espace client personnalisé.",
    agentControlPanel: "Panel d'administration Évasion Voyages",
    agentNewPackageBtn: "Créer un nouveau Séjour",
    agentEditTitle: "Éditer l'offre de voyage",
    agentFormPackageTitle: "Titre de l'offre (Français)",
    agentFormDesc: "Description détaillée du séjour",
    agentFormDest: "Destination (Ville / Pays)",
    agentFormDuration: "Durée (en jours)",
    agentFormPrice: "Tarif standard (DA)",
    agentFormPromo: "Tarif Promo spécial (DA, optionnel)",
    agentFormImage: "URL de l'image de couverture",
    agentFormMaxSpots: "Nombre de places max autorisées",
    agentFormCategory: "Catégorie principale",
    agentFormStatus: "Statut de publication",
    agentFormInclusions: "Éléments inclus (un par ligne)",
    agentFormExclusions: "Éléments exclus (un par ligne)",
    agentFormSave: "Enregistrer les modifications",
    agentFormCancel: "Annuler l'édition",
    agentLogsTitle: "Flux d'activité de l'agence en direct",
  },
  en: {
    brandTitle: "Séjours DZ",
    brandSubtitle: "B2C Escape",
    tabOffers: "Our Offers",
    tabClient: "My Bookings",
    tabAbout: "About Us",
    tabContact: "Contact Us",
    tabAdmin: "Agent Space",
    heroBadge: "✨ OFFICIAL APPROVED AGENCY SÉJOURS DZ",
    heroTitle: "Find unforgettable experiences and travels",
    heroSubtitle: "Explore our curated selection of all-inclusive packages for your dream holiday and book instantly in just a few clicks.",
    searchDestinationLabel: "Where are you going?",
    searchDestinationPlaceholder: "e.g. Istanbul, Sahara Desert, Taghit...",
    searchDateLabel: "When (From)?",
    searchBudgetLabel: "Max budget per person:",
    searchButton: "Search",
    clearFilters: "Clear filters",
    browseCategories: "Browse by experience categories",
    promoBadge: "LIMITED SPECIAL",
    freeCancellation: "Free cancellation",
    instantConfirmation: "Instant confirmation",
    spotsLeft: "Only {num} spots left!",
    fullyBooked: "Fully Booked",
    startingFrom: "Starting from",
    viewOffer: "View offer",
    days: "Days",
    departure: "Departure:",
    reviewsCount: "reviews",
    backToOffers: "Back to offers",
    inclusionsTitle: "Included in the package",
    exclusionsTitle: "Not included / Extras",
    programTitle: "Detailed Itinerary",
    dayWord: "Day",
    travelerReviewsTitle: "Traveler reviews",
    aiAdvisorTitle: "AI Escape Advisor",
    aiAdvisorSubtitle: "Customize meals, daily pacing, or receive authentic recommendations specific to your profile via our Gemini-powered smart assistant.",
    aiAdvisorPlaceholder: "Explain your specific needs (e.g., gluten-free diet, traveling with children, moderate walking pace...)",
    aiInterestsLabel: "Select your main holiday interests:",
    aiInterestGourmet: "🍳 Gourmet / Culinary tours",
    aiInterestHistory: "🏛️ History & Landmarks",
    aiInterestExcursions: "🐪 Adventural Excursions",
    aiInterestPhotos: "📸 Photogenic Landscapes",
    aiInterestRelax: "🏊 Leisure & Poolside",
    aiGenerateButton: "Generate tailored suggestions",
    aiGeneratingStatus: "Generating your dream itinerary via Advanced AI...",
    verifyAvailability: "Verify availability",
    primaryContactTitle: "Primary Booking Contact Information:",
    fullNameLabel: "Full Name",
    emailLabel: "Email Address",
    phoneLabel: "Phone Number (Algeria preferred)",
    travelersCountLabel: "Number of travelers:",
    travelerLabel: "Traveler",
    specialRequestsLabel: "Special Needs / Hotel Remarks (Optional):",
    submitBooking: "Deliver booking request",
    errorPrimaryFields: "Please input the full details of the primary folder manager.",
    errorAllPassengers: "Please specify the full names of all traveling guests.",
    noFailsTitle: "No service fees",
    noFailsContent1: "Free cancellation available",
    noFailsContent2: "Zero additional hidden fees",
    noFailsContent3: "Multilingual local assistance",
    adminRequired: "Secure Administrator Access",
    bookingsEmpty: "No current folders configured.",
    statsTitle: "Agency Core Performance Indicators",
    statsBookings: "Registered Bookings",
    statsRevenue: "Aggregated Gross Revenue",
    statsActive: "Active Packages Online",
    statsPending: "Awaiting Receipt Verification",
    searchBookingsPlaceholder: "Search by passenger name or package title...",
    totalPaid: "Paid in full",
    depositPaid: "Deposit paid",
    unpaid: "Unpaid",
    bookingConfirmed: "Confirmed",
    bookingPending: "Pending",
    bookingCancelled: "Cancelled",
    detailsLabel: "Details",
    cancelBookingButton: "Cancel this folder booking",
    confirmBookingButton: "Confirm agency cash versement",
    paymentTitle: "Settle your booking versement securely",
    paymentOnlineOption: "CIB / Dahabia Cards",
    paymentCashOption: "Cash payment at agency Desk",
    paymentBankOption: "CCP Transfer / Bank slip",
    paymentAmountToPay: "Amount to transfer:",
    paymentCardInputNumber: "CIB or Dahabia Card Number (16-digits)",
    paymentCardInputHolder: "Cardholder full name",
    paymentCardSubmit: "Authorize safe card transaction",
    paymentCashSubmit: "Register cash payment at local desk",
    paymentBankSubmit: "Validate slip transfer instantly",
    paymentSuccessHeader: "Payment approved!",
    paymentSuccessBodyCard: "Your secure online transaction via CIB/Dahabia card of {amount} DA was successfully approved.",
    paymentSuccessBodyCash: "Your cash deposit of {amount} DA at our local agency desk was recorded successfully.",
    paymentSuccessBodyBank: "Your CCP transfer / bank slip scan of {amount} DA was uploaded and verified instantly.",
    paymentFolderUpdated: "Your travel folder was updated instantly.",
    paymentWaitingConfirmation: "Our accounting team is reviewing your uploaded CCP document.",
    orderSummaryTitle: "Booking Order Summary",
    orderTotal: "Aggregated sum due",
    ticketPrintButton: "Print safe payment receipt",
    ticketDownloadInvoice: "Certified invoice PDF",
    checkInStatusHeader: "Booking Check-in & Status verification",
    checkInStatusVerified: "Your booking is verified and spots are permanently secured. Have a fantastic trip!",
    checkInStatusWarning: "This travel folder requires final payment validation before the flight schedule departure.",
    clientAreaIntro: "Consolidate, pay, and print your booking invoices in one dashboard.",
    clientAreaEmpty: "Submit your email address to instantly load all booked custom travels.",
    clientAreaWelcome: "Welcome to your customized client dashboard.",
    agentControlPanel: "Évasion Voyages Administrator Console",
    agentNewPackageBtn: "Create New Package",
    agentEditTitle: "Edit Tour Offer",
    agentFormPackageTitle: "Offer Title (French)",
    agentFormDesc: "Detailed Description of stay",
    agentFormDest: "Destination (City / Country)",
    agentFormDuration: "Duration (in Days)",
    agentFormPrice: "Standard Price (DA)",
    agentFormPromo: "Promo Price (DA, optional)",
    agentFormImage: "Tour cover image URL",
    agentFormMaxSpots: "Maximum spots authorized",
    agentFormCategory: "Principal category",
    agentFormStatus: "Visibility on homepage",
    agentFormInclusions: "Inclusions (one item per line)",
    agentFormExclusions: "Exclusions (one item per line)",
    agentFormSave: "Commit package modifications",
    agentFormCancel: "Discard edits",
    agentLogsTitle: "Live agency performance stream logs",
  },
  ar: {
    brandTitle: "سياحة دي-زاد",
    brandSubtitle: "بوابة الحجز الفوري",
    tabOffers: "عروضنا",
    tabClient: "فضاء الزبائن",
    tabAbout: "من نحن",
    tabContact: "اتصل بنا",
    tabAdmin: "فضاء الوكيل",
    heroBadge: "✨ وكالة Séjours DZ السياحية المعتمدة رسمياً",
    heroTitle: "اكتشف أنشطة ورحلات سياحية لا تُنسى",
    heroSubtitle: "استكشف عروضنا المتكاملة والشاملة لعطلتك المثالية واحجز فوراً ببضع نقرات.",
    searchDestinationLabel: "إلى أين أنت ذاهب ؟",
    searchDestinationPlaceholder: "مثال: إسطنبول، الصحراء الكبرى، تاغيت...",
    searchDateLabel: "التاريخ (ابتداءً من) ؟",
    searchBudgetLabel: "الميزانية القصوى للشخص الواحد :",
    searchButton: "بحث",
    clearFilters: "إلغاء التصفية",
    browseCategories: "تصفح حسب فئات التجارب والأنشطة",
    promoBadge: "عرض محدود",
    freeCancellation: "إلغاء مجاني",
    instantConfirmation: "تأكيد فوري للحجز",
    spotsLeft: "متبقي {num} مقاعد فقط !",
    fullyBooked: "مكتمل بالكامل",
    startingFrom: "ابتداءً من",
    viewOffer: "عرض التفاصيل",
    days: "أيام",
    departure: "الانطلاق :",
    reviewsCount: "تقييم",
    backToOffers: "العودة إلى العروض",
    inclusionsTitle: "الخدمات المشمولة في البرنامج",
    exclusionsTitle: "الخدمات غير المشمولة / إضافية",
    programTitle: "برنامج الرحلة المفصل",
    dayWord: "اليوم",
    travelerReviewsTitle: "تقييمات المسافرين",
    aiAdvisorTitle: "مستشار الذكاء الاصطناعي",
    aiAdvisorSubtitle: "خصص وجبات الطعام، وتيرة الرحلة، أو احصل على نصائح محلية تناسب احتياجاتك بفضل الذكاء الاصطناعي المدعوم بـ Gemini.",
    aiAdvisorPlaceholder: "اكتب متطلباتك الخاصة (مثال: وجبات خالية من الغلوتين، أطفال صغار، ميزانية اقتصادية، وتيرة مشي مريحة ومقاومة للتعب...)",
    aiInterestsLabel: "اختر مجالات اهتمامك المفضلة للرحلة :",
    aiInterestGourmet: "🍳 تذوق الأطعمة والمطاعم المحلية",
    aiInterestHistory: "🏛️ زيارة المتاحف والآثار التاريخية",
    aiInterestExcursions: "🐪 الجولات الاستكشافية والأنشطة الرياضية",
    aiInterestPhotos: "📸 التقاط صور ومناظر طبيعية ساحرة",
    aiInterestRelax: "🏊 الاستجمام والسباحة والاسترخاء",
    aiGenerateButton: "صمم برنامجي المخصص بالمستشار الذكي",
    aiGeneratingStatus: "جاري إنتاج وتصميم واقتراح برنامجك المخصص...",
    verifyAvailability: "التحقق من توفر الأماكن",
    primaryContactTitle: "معلومات المسافر الرئيسي صاحب الطلب :",
    fullNameLabel: "الاسم واللقب الكامل",
    emailLabel: "عنوان البريد الإلكتروني",
    phoneLabel: "رقم الهاتف (يفضل جزائري أو واتسساب)",
    travelersCountLabel: "إجمالي عدد المسافرين :",
    travelerLabel: "المسافر",
    specialRequestsLabel: "طلبات خاصة أو ملاحظات إضافية للفندق :",
    submitBooking: "إرسال طلب الحجز بشكل آمن",
    errorPrimaryFields: "يرجى تعبئة بيانات الاتصال والاسم الكامل للمسافر الرئيسي.",
    errorAllPassengers: "يرجى تعبئة الاسم الكامل لجميع المسافرين المرافقين.",
    noFailsTitle: "حجز بدون رسوم إضافية",
    noFailsContent1: "إمكانية إلغاء الحجز مجاناً",
    noFailsContent2: "رسوم ميزانية معلنة وشفافة بالكامل",
    noFailsContent3: "مرافقة وإرشاد محلي وعربي دائم",
    adminRequired: "منطقة تسجيل خاصة بالوكلاء والمشرفين",
    bookingsEmpty: "لم يتم العثور على أي حجوزات مسجلة.",
    statsTitle: "مؤشرات أداء مبيعات الوكالة",
    statsBookings: "الحجوزات الإجمالية",
    statsRevenue: "إجمالي حجم المبيعات",
    statsActive: "الباقات النشطة حالياً",
    statsPending: "طلبات في انتظار الدفع والتدقيق",
    searchBookingsPlaceholder: "البحث باسم الزبون أو باقة الرحلة...",
    totalPaid: "تم الدفع بالكامل",
    depositPaid: "تم سداد العربون",
    unpaid: "غير مدفوع",
    bookingConfirmed: "مؤكد وموثق",
    bookingPending: "قيد المراجعة",
    bookingCancelled: "ملغي",
    detailsLabel: "التفاصيل",
    cancelBookingButton: "إلغاء هذا الحجز بالكامل",
    confirmBookingButton: "تأكيد الدفع نقداً بالوكالة",
    paymentTitle: "سداد قيمة الحجز بأمان وسرعة",
    paymentOnlineOption: "الدفع ببطاقة CIB أو الذهبية",
    paymentCashOption: "الدفع نقداً بنقاط الوكالة",
    paymentBankOption: "الدفع عبرCCP أو حساب البنكي للوكالة",
    paymentAmountToPay: "المبلغ الإجمالي المطلوب سداده :",
    paymentCardInputNumber: "رقم البطاقة البنكية CIB أو الذهبية (16 رقماً)",
    paymentCardInputHolder: "الاسم الكامل لمالك البطاقة البنكية",
    paymentCardSubmit: "تفويض وقبول عملية السحب الآمنة",
    paymentCashSubmit: "تسجيل الدفع نقداً واستخراج الوصل",
    paymentBankSubmit: "تأكيد واستلام وصل التحويل CCP بنجاح",
    paymentSuccessHeader: "تم التحقق وسداد المبلغ بنجاح !",
    paymentSuccessBodyCard: "تم تفويض وتأكيد سحب مبلغ {amount} دج بأمان عن طريق بطاقة CIB/الذهبية الخاصة بك.",
    paymentSuccessBodyCash: "تم تسجيل إيداعك النقدي البالغ {amount} دج في الوكالة، وتم تفعيل ملف حجزك فوراً.",
    paymentSuccessBodyBank: "تم تحميل وتأكيد استلام مستند تحويل CCP بمبلغ {amount} دج بنجاح وجاري التحقق المالي.",
    paymentFolderUpdated: "تم تحديث وتفعيل الحجز وتأمين المقاعد فوراً.",
    paymentWaitingConfirmation: "يقوم قسم الحسابات بالوكالة بالتحقق ومطابقة ملف الحجز.",
    orderSummaryTitle: "ملخص فاتورة الحجز والإقامة",
    orderTotal: "القيمة الإجمالية للحجز",
    ticketPrintButton: "طباعة وصل الدفع السياحي",
    ticketDownloadInvoice: "تحميل الفاتورة الإلكترونية المعتمدة PDF",
    checkInStatusHeader: "تفاصيل التحقق ووثيقة السفر",
    checkInStatusVerified: "ملف حجزك مكتمل ومؤكد بالكامل وتم تأمين مقاعدك لجميع وجهاتك بنجاح. رحلة سعيدة وموفقة !",
    checkInStatusWarning: "يتطلب حجزك تسوية سداد المبلغ الإجمالي مع أحد وكلائنا قبل موعد الإقلاع.",
    clientAreaIntro: "استعرض، سدد واطبع وصولات دفع وفواتير رحلاتك في منصة موحدة.",
    clientAreaEmpty: "أدخل بريدك الإلكتروني لعرض ومتابعة رحلاتك المحجوزة بالوكالة.",
    clientAreaWelcome: "مرحباً بك في فضاء الخدمات الشخصي والمحمي.",
    agentControlPanel: "لوحة التحكم وإدارة رحلات Séjours DZ",
    agentNewPackageBtn: "إنشاء باقة رحلة جديدة",
    agentEditTitle: "تعديل باقة الرحلة الحالية",
    agentFormPackageTitle: "عنوان العرض (باللغة الفرنسية)",
    agentFormDesc: "الوصف التفصيلي والبرنامج الإرشادي للرحلة",
    agentFormDest: "الوجهة (المدينة / الدولة)",
    agentFormDuration: "مدة بقاء الرحلة (بالأيام)",
    agentFormPrice: "السعر الأساسي للشخص الواحد (دج)",
    agentFormPromo: "السعر الترويجي الخاص (دج، اختياري)",
    agentFormImage: "رابط الصورة التعريفية للرحلة (Cover Image URL)",
    agentFormMaxSpots: "الحد الأقصى لعدد المقاعد المتاحة",
    agentFormCategory: "التصنيف الرئيسي للباقة",
    agentFormStatus: "حالة عرض الباقة للزبائن",
    agentFormInclusions: "الخدمات المشمولة بالباقة (سطر واحد لكل ميزة)",
    agentFormExclusions: "الخدمات الإضافية / الموانع (سطر واحد لكل ميزة)",
    agentFormSave: "حفظ وتعديل مواصفات الرحلة",
    agentFormCancel: "إلغاء التعديل والتراجع",
    agentLogsTitle: "سجل العمليات والطلبات الواردة مباشرة للوكالة",
  },
};
