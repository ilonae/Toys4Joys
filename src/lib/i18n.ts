export type Locale = 'de' | 'en' | 'es'

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'de', label: 'DE', flag: '🇩🇪' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
]

export interface Translations {
  // Navigation
  nav: {
    shop: string; about: string; cart: string; profile: string
    login: string; register: string; logout: string; admin: string
    wishlist: string; orders: string; settings: string
  }
  // Footer
  footer: {
    about: string; shipping: string; withdrawal: string
    privacy: string; terms: string; imprint: string
    tagline: string; adult: string
  }
  // Age gate
  ageGate: {
    heading: string; sub: string; confirm: string; deny: string
    legal: string; termsLink: string; privacyLink: string
  }
  // Cookie
  cookie: {
    text: string; privacyLink: string; accept: string; necessary: string
  }
  // Product card / detail
  product: {
    addToCart: string; soldOut: string; wishlist: string; inStock: string
    onlyLeft: string; descTab: string; detailsTab: string; reviewsTab: string
    material: string; level: string; category: string; brand: string; sub: string
    shipping: string; noDescription: string; relatedTitle: string
    reviews: string; noReviews: string; basedOn: string; rating: string
  }
  // Cart
  cart: {
    title: string; empty: string; emptyHint: string; continueShopping: string
    subtotal: string; shipping: string; total: string; tax: string
    checkout: string; freeFrom: string; freeShipping: string; toFreeShipping: string
    germany: string; europe: string; international: string
  }
  // Checkout
  checkout: {
    title: string; addressStep: string; paymentStep: string
    firstName: string; lastName: string; email: string; phone: string
    street: string; zip: string; city: string; country: string
    continueToPayment: string; changeAddress: string; payNow: string
    processing: string; secure: string
    successTitle: string; successText: string; confirmation: string
    backToShop: string; shippingTo: string; orderSummary: string
    taxIncluded: string; backToCart: string; loadingPayment: string
  }
  // Profile
  profile: {
    title: string; overview: string; ordersTab: string; wishlistTab: string; settingsTab: string
    orders: string; wishlistItems: string; returns: string
    deliveryAddress: string; editAddress: string; addAddress: string
    personalData: string; saveButton: string; saving: string; saved: string; reset: string
    emailHint: string; deleteAccount: string; deleteWarning: string; deleteConfirm: string
    deleting: string; noOrders: string; noOrdersHint: string; shopNow: string
    emptyWishlist: string; emptyWishlistHint: string; discover: string
    orderNumber: string; trackingNumber: string; trackHint: string; deliveryTo: string
    status: { pending: string; paid: string; shipped: string; delivered: string; cancelled: string }
  }
  // Static pages
  static: {
    aboutTitle: string; shippingTitle: string; privacyTitle: string
    termsTitle: string; imprintTitle: string; withdrawalTitle: string
    legalOnly: string
  }
  // Landing
  landing: {
    heroCta: string; featuredTitle: string; categoryTitle: string; allProducts: string
    heroTag: string; heroLine1: string; heroLine2: string; heroLine3: string
    heroBody: string; heroCtaSecondary: string
    story1Tag: string; story1Heading: string; story1Body: string
    story2Tag: string; story2Heading: string; story2Body: string
    story3Tag: string; story3Heading: string; story3Body: string
    stat1Label: string; stat2Label: string; stat3Label: string
    sortimentTag: string; featuredTag: string
    shippingTag: string; shippingHeading: string; shippingBody: string; shippingCta: string
  }
  // Shop
  shop: {
    title: string; filters: string; sort: string; noResults: string
    sortNewest: string; sortPriceAsc: string; sortPriceDesc: string; sortRating: string
    priceRange: string; subcategories: string; levels: string; all: string
  }
  // General
  general: {
    loading: string; error: string; backToHome: string; reload: string
    unexpectedError: string; contactUs: string
  }
  // Auth modal
  auth: {
    accountHeader: string; loginTab: string; registerTab: string; trackTab: string
    emailPlaceholder: string; passwordPlaceholder: string; passwordMin: string
    confirmPasswordLabel: string; firstNamePlaceholder: string; lastNamePlaceholder: string
    rememberMe: string; forgotPassword: string
    ageConfirm: string; termsAcceptPre: string; termsAcceptMid: string
    createAccountBtn: string; signInBtn: string
    confirmationSent: string; confirmationText1: string; confirmationText2: string; checkSpam: string
    trackHint: string; trackOrderIdLabel: string; trackOrderIdPlaceholder: string
    trackEmailLabel: string; trackBtn: string; orderStatusLabel: string; orderAmountLabel: string
    orderIdLabel: string; newSearch: string
    statusSucceeded: string; statusProcessing: string; statusPaymentPending: string
    statusConfirmationPending: string; statusCancelled: string
    errRequired: string; errInvalidEmail: string; errPasswordShort: string
    errPasswordMismatch: string; errAgeRequired: string; errTermsRequired: string
    errAllFields: string; errOrderIdRequired: string; errServerUnreachable: string
  }
}

// ── German ────────────────────────────────────────────────────────────────────
const de: Translations = {
  nav: {
    shop: 'Shop', about: 'Über Uns', cart: 'Warenkorb', profile: 'Mein Konto',
    login: 'Anmelden', register: 'Registrieren', logout: 'Abmelden', admin: 'Admin / CMS',
    wishlist: 'Wunschliste', orders: 'Bestellungen', settings: 'Einstellungen',
  },
  footer: {
    about: 'Über Uns', shipping: 'Versand & Rückgabe', withdrawal: 'Widerruf',
    privacy: 'Datenschutz', terms: 'AGB', imprint: 'Impressum',
    tagline: 'Premium Kink · Berlin', adult: '18+ · Nur für Erwachsene',
  },
  ageGate: {
    heading: 'Bist du 18 Jahre oder älter?',
    sub: 'Dieser Shop richtet sich ausschließlich an Erwachsene ab 18 Jahren. Bitte bestätige dein Alter, um fortzufahren.',
    confirm: 'JA, ICH BIN 18+', deny: 'NEIN, VERLASSEN',
    legal: 'Mit dem Fortfahren bestätigst du, dass du die',
    termsLink: 'AGB', privacyLink: 'Datenschutzerklärung',
  },
  cookie: {
    text: 'Wir verwenden Cookies und ähnliche Technologien für sichere Zahlungen und eine bessere Nutzererfahrung. Weitere Informationen in unserer',
    privacyLink: 'Datenschutzerklärung', accept: 'ALLE AKZEPTIEREN', necessary: 'NUR NOTWENDIGE',
  },
  product: {
    addToCart: 'IN DEN WARENKORB', soldOut: 'AUSVERKAUFT', wishlist: 'Wunschliste',
    inStock: 'Auf Lager', onlyLeft: 'Nur noch', descTab: 'Beschreibung',
    detailsTab: 'Details', reviewsTab: 'Bewertungen', material: 'Material',
    level: 'Erfahrungslevel', category: 'Kategorie', brand: 'Marke', sub: 'Unterkategorie',
    shipping: 'Versand innerhalb 24h · Kostenlos ab €49 · Diskrete Verpackung · 30 Tage Rückgabe',
    noDescription: 'Keine Beschreibung vorhanden.', relatedTitle: 'Das könnte dir auch gefallen',
    reviews: 'Bewertungen', noReviews: 'Noch keine Bewertungen.', basedOn: 'Basierend auf',
    rating: 'Bewertung',
  },
  cart: {
    title: 'Warenkorb', empty: 'Dein Warenkorb ist leer',
    emptyHint: 'Entdecke unser Sortiment und finde etwas, das dir gefällt.',
    continueShopping: 'WEITER EINKAUFEN', subtotal: 'Zwischensumme',
    shipping: 'Versand', total: 'Gesamt', tax: 'inkl. 19% MwSt.',
    checkout: 'ZUR KASSE', freeFrom: 'Ab hier kostenlos',
    freeShipping: 'KOSTENLOSER VERSAND INKLUSIVE',
    toFreeShipping: 'bis zum kostenlosen Versand',
    germany: 'Deutschland', europe: 'Europa', international: 'International',
  },
  checkout: {
    title: 'Kasse', addressStep: 'Lieferadresse', paymentStep: 'Zahlung',
    firstName: 'Vorname', lastName: 'Nachname', email: 'E-Mail', phone: 'Telefon',
    street: 'Straße & Hausnummer', zip: 'PLZ', city: 'Stadt', country: 'Land',
    continueToPayment: 'WEITER ZUR ZAHLUNG →', changeAddress: '← ADRESSE ÄNDERN',
    payNow: 'JETZT BEZAHLEN', processing: 'VERARBEITUNG...',
    secure: 'SSL-gesichert · Powered by Stripe · Diskrete Abrechnung',
    successTitle: 'ZAHLUNG ERFOLGREICH', successText: 'Vielen Dank für deine Bestellung!',
    confirmation: 'Eine Bestätigung wurde an', backToShop: 'ZURÜCK ZUM SHOP',
    shippingTo: 'Lieferung an', orderSummary: 'Bestellübersicht',
    taxIncluded: 'inkl. 19% MwSt.', backToCart: '← ZURÜCK ZUM WARENKORB',
    loadingPayment: 'LADE ZAHLUNGSFORMULAR…',
  },
  profile: {
    title: 'Mein Konto', overview: 'Übersicht', ordersTab: 'Bestellungen',
    wishlistTab: 'Wunschliste', settingsTab: 'Einstellungen',
    orders: 'Bestellungen', wishlistItems: 'Wunschliste', returns: 'Tage Rückgabe',
    deliveryAddress: 'LIEFERADRESSE', editAddress: 'ADRESSE BEARBEITEN →',
    addAddress: 'ADRESSE HINZUFÜGEN →', personalData: 'PERSÖNLICHE DATEN',
    saveButton: 'SPEICHERN', saving: 'SPEICHERN…', saved: '✓ Gespeichert', reset: 'ZURÜCKSETZEN',
    emailHint: 'E-Mail-Änderung via Support: hallo@toys4joys.de',
    deleteAccount: 'KONTO LÖSCHEN',
    deleteWarning: 'Alle deine persönlichen Daten werden gelöscht (DSGVO Art. 17). Bestellhistorie bleibt aus steuerrechtlichen Gründen anonymisiert erhalten.',
    deleteConfirm: 'Wirklich löschen? Klicke erneut zur Bestätigung.',
    deleting: 'WIRD GELÖSCHT…', noOrders: 'Noch keine Bestellungen',
    noOrdersHint: 'Sobald du eine Bestellung aufgibst, erscheint sie hier.',
    shopNow: 'JETZT SHOPPEN', emptyWishlist: 'Wunschliste ist leer',
    emptyWishlistHint: 'Speichere Produkte, die du im Auge behalten möchtest.',
    discover: 'SORTIMENT ENTDECKEN', orderNumber: 'BESTELLUNG #',
    trackingNumber: 'SENDUNGSNUMMER', trackHint: 'Klicke zum Verfolgen deines Pakets.',
    deliveryTo: 'LIEFERUNG AN',
    status: { pending: 'Ausstehend', paid: 'Bezahlt', shipped: 'Versendet', delivered: 'Geliefert', cancelled: 'Storniert' },
  },
  static: {
    aboutTitle: 'Über Uns', shippingTitle: 'Versand & Rückgabe', privacyTitle: 'Datenschutz',
    termsTitle: 'AGB', imprintTitle: 'Impressum', withdrawalTitle: 'Widerruf',
    legalOnly: 'Diese Seite ist aus rechtlichen Gründen nur auf Deutsch verfügbar.',
  },
  landing: {
    heroCta: 'SORTIMENT ENTDECKEN', featuredTitle: 'AUSGEWÄHLTE PRODUKTE',
    categoryTitle: 'KATEGORIEN', allProducts: 'ALLE PRODUKTE',
    heroTag: 'Berlin · Premium Kink',
    heroLine1: 'Alles.', heroLine2: 'Ohne', heroLine3: 'Kompromisse.',
    heroBody: 'BDSM. Vibratoren. Latex. Elektrostimulation. Wir führen das Beste — kuratiert von Menschen, die leben was sie verkaufen. Premium Kink aus Berlin.',
    heroCtaSecondary: 'BDSM KOLLEKTION',
    story1Tag: 'Manifesto',
    story1Heading: 'Keine Entschuldigungen.',
    story1Body: 'Wir verkaufen keine Fantasien. Wir verkaufen Werkzeuge für Menschen, die genau wissen, was sie wollen. Jedes Produkt in unserem Sortiment ist mit Absicht hier — ausgewählt, getestet, respektiert.',
    story2Tag: 'Handwerk',
    story2Heading: 'Berlin macht es anders.',
    story2Body: 'Wir wählen jedes Produkt persönlich aus — in Berlin. Vollleder. Edelstahl. Medizinisches Silikon. Kein Hersteller kommt ins Sortiment, der unsere Standards nicht erfüllt. Das ist kein Algorithmus — das ist Absicht.',
    story3Tag: 'Community',
    story3Heading: 'Für alle. Ohne Ausnahme.',
    story3Body: 'Queer. Het. Non-binary. Dom. Sub. Switch. Neugierig. Wir bauen keine Schubladen. Wir bauen einen Raum. Diskret verpackt. Keine Moralisierung. Keine Limits außer deinen eigenen.',
    stat1Label: 'Kategorien',
    stat2Label: 'Diskrete Lieferung',
    stat3Label: 'Kuratiert & Gelebt',
    sortimentTag: 'Sortiment',
    featuredTag: 'Ausgewählte Produkte',
    shippingTag: 'Versand',
    shippingHeading: 'Versand innerhalb von 24h. Kostenlos ab €49.',
    shippingBody: 'Diskret verpackt. Kein Absender auf der Box. Schnelle Lieferung europaweit. 30 Tage Rückgabe ohne Fragen.',
    shippingCta: 'JETZT SHOPPEN',
  },
  shop: {
    title: 'Shop', filters: 'Filter', sort: 'Sortierung', noResults: 'Keine Produkte gefunden.',
    sortNewest: 'Neueste', sortPriceAsc: 'Preis aufsteigend', sortPriceDesc: 'Preis absteigend',
    sortRating: 'Bewertung', priceRange: 'Preisbereich', subcategories: 'Unterkategorien',
    levels: 'Erfahrungslevel', all: 'Alle',
  },
  general: {
    loading: 'Laden…', error: 'Fehler', backToHome: 'ZUR STARTSEITE', reload: 'SEITE NEU LADEN',
    unexpectedError: 'UNERWARTETER FEHLER',
    contactUs: 'Etwas ist schiefgelaufen. Bitte lade die Seite neu oder kontaktiere uns unter',
  },
  auth: {
    accountHeader: 'KONTO', loginTab: 'ANMELDEN', registerTab: 'REGISTRIEREN', trackTab: 'BESTELLUNG',
    emailPlaceholder: 'deine@email.de', passwordPlaceholder: '••••••••', passwordMin: 'Mindestens 8 Zeichen',
    confirmPasswordLabel: 'Passwort wiederholen',
    firstNamePlaceholder: 'Max', lastNamePlaceholder: 'Mustermann',
    rememberMe: 'Angemeldet bleiben', forgotPassword: 'Passwort vergessen?',
    ageConfirm: 'Ich bin 18 Jahre oder älter',
    termsAcceptPre: 'Ich akzeptiere die', termsAcceptMid: 'und',
    createAccountBtn: 'KONTO ERSTELLEN', signInBtn: 'ANMELDEN',
    confirmationSent: 'BESTÄTIGUNGSMAIL GESENDET',
    confirmationText1: 'Wir haben eine Bestätigungs-E-Mail an',
    confirmationText2: 'gesendet. Bitte klick auf den Link darin, um dein Konto zu aktivieren.',
    checkSpam: 'Keine E-Mail erhalten? Schau in deinen Spam-Ordner oder wende dich an unseren Support.',
    trackHint: 'Gib deine Bestell-ID ein — sie steht in deiner Bestätigungs-E-Mail.',
    trackOrderIdLabel: 'Bestell-ID', trackOrderIdPlaceholder: 'pi_3Nxxx...',
    trackEmailLabel: 'E-Mail (optional)', trackBtn: 'BESTELLUNG VERFOLGEN',
    orderStatusLabel: 'BESTELLSTATUS', orderAmountLabel: 'Betrag',
    orderIdLabel: 'Bestell-ID', newSearch: '← Neue Suche',
    statusSucceeded: 'Bezahlt ✓', statusProcessing: 'In Bearbeitung',
    statusPaymentPending: 'Zahlung ausstehend', statusConfirmationPending: 'Bestätigung ausstehend',
    statusCancelled: 'Storniert',
    errRequired: 'Pflichtfeld', errInvalidEmail: 'Ungültige E-Mail',
    errPasswordShort: 'Mindestens 8 Zeichen', errPasswordMismatch: 'Passwörter stimmen nicht überein',
    errAgeRequired: 'Du musst 18+ sein', errTermsRequired: 'Bitte AGB akzeptieren',
    errAllFields: 'Bitte alle Felder ausfüllen.',
    errOrderIdRequired: 'Bitte Bestellnummer eingeben.',
    errServerUnreachable: 'Server nicht erreichbar. Bitte später erneut versuchen.',
  },
}

// ── English ───────────────────────────────────────────────────────────────────
const en: Translations = {
  nav: {
    shop: 'Shop', about: 'About', cart: 'Cart', profile: 'My Account',
    login: 'Sign In', register: 'Register', logout: 'Sign Out', admin: 'Admin / CMS',
    wishlist: 'Wishlist', orders: 'Orders', settings: 'Settings',
  },
  footer: {
    about: 'About Us', shipping: 'Shipping & Returns', withdrawal: 'Cancellation',
    privacy: 'Privacy Policy', terms: 'Terms & Conditions', imprint: 'Legal Notice',
    tagline: 'Premium Kink · Berlin', adult: '18+ · Adults Only',
  },
  ageGate: {
    heading: 'Are you 18 years or older?',
    sub: 'This shop is exclusively for adults aged 18 and over. Please confirm your age to continue.',
    confirm: 'YES, I AM 18+', deny: 'NO, LEAVE',
    legal: 'By continuing you confirm that you accept the',
    termsLink: 'Terms & Conditions', privacyLink: 'Privacy Policy',
  },
  cookie: {
    text: 'We use cookies and similar technologies for secure payments and a better experience. More information in our',
    privacyLink: 'Privacy Policy', accept: 'ACCEPT ALL', necessary: 'NECESSARY ONLY',
  },
  product: {
    addToCart: 'ADD TO CART', soldOut: 'SOLD OUT', wishlist: 'Wishlist',
    inStock: 'In Stock', onlyLeft: 'Only', descTab: 'Description',
    detailsTab: 'Details', reviewsTab: 'Reviews', material: 'Material',
    level: 'Experience Level', category: 'Category', brand: 'Brand', sub: 'Subcategory',
    shipping: 'Ships within 24h · Free from €49 · Discreet packaging · 30-day returns',
    noDescription: 'No description available.', relatedTitle: 'You might also like',
    reviews: 'Reviews', noReviews: 'No reviews yet.', basedOn: 'Based on',
    rating: 'Rating',
  },
  cart: {
    title: 'Cart', empty: 'Your cart is empty',
    emptyHint: 'Explore our collection and find something you love.',
    continueShopping: 'CONTINUE SHOPPING', subtotal: 'Subtotal',
    shipping: 'Shipping', total: 'Total', tax: 'incl. 19% VAT',
    checkout: 'CHECKOUT', freeFrom: 'Free from here',
    freeShipping: 'FREE SHIPPING INCLUDED',
    toFreeShipping: 'until free shipping',
    germany: 'Germany', europe: 'Europe', international: 'International',
  },
  checkout: {
    title: 'Checkout', addressStep: 'Shipping Address', paymentStep: 'Payment',
    firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone',
    street: 'Street & House Number', zip: 'ZIP Code', city: 'City', country: 'Country',
    continueToPayment: 'CONTINUE TO PAYMENT →', changeAddress: '← CHANGE ADDRESS',
    payNow: 'PAY NOW', processing: 'PROCESSING...',
    secure: 'SSL secured · Powered by Stripe · Discreet billing',
    successTitle: 'PAYMENT SUCCESSFUL', successText: 'Thank you for your order!',
    confirmation: 'A confirmation has been sent to', backToShop: 'BACK TO SHOP',
    shippingTo: 'Shipping to', orderSummary: 'Order Summary',
    taxIncluded: 'incl. 19% VAT', backToCart: '← BACK TO CART',
    loadingPayment: 'LOADING PAYMENT FORM…',
  },
  profile: {
    title: 'My Account', overview: 'Overview', ordersTab: 'Orders',
    wishlistTab: 'Wishlist', settingsTab: 'Settings',
    orders: 'Orders', wishlistItems: 'Wishlist', returns: 'Days Return',
    deliveryAddress: 'DELIVERY ADDRESS', editAddress: 'EDIT ADDRESS →',
    addAddress: 'ADD ADDRESS →', personalData: 'PERSONAL DETAILS',
    saveButton: 'SAVE', saving: 'SAVING…', saved: '✓ Saved', reset: 'RESET',
    emailHint: 'To change your email contact: hallo@toys4joys.de',
    deleteAccount: 'DELETE ACCOUNT',
    deleteWarning: 'All your personal data will be deleted (GDPR Art. 17). Order history remains anonymised for tax purposes.',
    deleteConfirm: 'Really delete? Click again to confirm.',
    deleting: 'DELETING…', noOrders: 'No orders yet',
    noOrdersHint: 'Once you place an order, it will appear here.',
    shopNow: 'SHOP NOW', emptyWishlist: 'Wishlist is empty',
    emptyWishlistHint: 'Save products you want to keep an eye on.',
    discover: 'DISCOVER COLLECTION', orderNumber: 'ORDER #',
    trackingNumber: 'TRACKING NUMBER', trackHint: 'Click to track your package.',
    deliveryTo: 'DELIVERY TO',
    status: { pending: 'Pending', paid: 'Paid', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' },
  },
  static: {
    aboutTitle: 'About Us', shippingTitle: 'Shipping & Returns', privacyTitle: 'Privacy Policy',
    termsTitle: 'Terms & Conditions', imprintTitle: 'Legal Notice', withdrawalTitle: 'Cancellation',
    legalOnly: 'This page is only available in German for legal reasons.',
  },
  landing: {
    heroCta: 'DISCOVER COLLECTION', featuredTitle: 'FEATURED PRODUCTS',
    categoryTitle: 'CATEGORIES', allProducts: 'ALL PRODUCTS',
    heroTag: 'Berlin · Premium Kink',
    heroLine1: 'Everything.', heroLine2: 'No', heroLine3: 'Compromises.',
    heroBody: 'BDSM. Vibrators. Latex. Electrostimulation. We carry the best — curated by people who live what they sell. Premium kink from Berlin.',
    heroCtaSecondary: 'BDSM COLLECTION',
    story1Tag: 'Manifesto',
    story1Heading: 'No apologies.',
    story1Body: 'We don\'t sell fantasies. We sell tools for people who know exactly what they want. Every product in our range is here on purpose — selected, tested, respected.',
    story2Tag: 'Craftsmanship',
    story2Heading: 'Berlin does it differently.',
    story2Body: 'We hand-pick every product — in Berlin. Full-grain leather. Stainless steel. Medical-grade silicone. No manufacturer makes our range unless they meet our standards. It\'s not an algorithm — it\'s intention.',
    story3Tag: 'Community',
    story3Heading: 'For everyone. No exceptions.',
    story3Body: 'Queer. Hetero. Non-binary. Dom. Sub. Switch. Curious. We don\'t build boxes. We build a space. Discreet packaging. No moralising. No limits except your own.',
    stat1Label: 'Categories',
    stat2Label: 'Discreet Delivery',
    stat3Label: 'Curated & Lived',
    sortimentTag: 'Collection',
    featuredTag: 'Featured Products',
    shippingTag: 'Shipping',
    shippingHeading: 'Ships within 24h. Free from €49.',
    shippingBody: 'Discreetly packaged. No sender on the box. Fast delivery across Europe. 30-day returns, no questions asked.',
    shippingCta: 'SHOP NOW',
  },
  shop: {
    title: 'Shop', filters: 'Filters', sort: 'Sort', noResults: 'No products found.',
    sortNewest: 'Newest', sortPriceAsc: 'Price: Low to High', sortPriceDesc: 'Price: High to Low',
    sortRating: 'Rating', priceRange: 'Price Range', subcategories: 'Subcategories',
    levels: 'Experience Level', all: 'All',
  },
  general: {
    loading: 'Loading…', error: 'Error', backToHome: 'BACK TO HOME', reload: 'RELOAD PAGE',
    unexpectedError: 'UNEXPECTED ERROR',
    contactUs: 'Something went wrong. Please reload the page or contact us at',
  },
  auth: {
    accountHeader: 'ACCOUNT', loginTab: 'SIGN IN', registerTab: 'REGISTER', trackTab: 'TRACK ORDER',
    emailPlaceholder: 'your@email.com', passwordPlaceholder: '••••••••', passwordMin: 'At least 8 characters',
    confirmPasswordLabel: 'Confirm password',
    firstNamePlaceholder: 'Anna', lastNamePlaceholder: 'Smith',
    rememberMe: 'Stay signed in', forgotPassword: 'Forgot password?',
    ageConfirm: 'I am 18 years or older',
    termsAcceptPre: 'I accept the', termsAcceptMid: 'and',
    createAccountBtn: 'CREATE ACCOUNT', signInBtn: 'SIGN IN',
    confirmationSent: 'CONFIRMATION EMAIL SENT',
    confirmationText1: 'We sent a confirmation email to',
    confirmationText2: 'Please click the link inside to activate your account.',
    checkSpam: 'No email received? Check your spam folder or contact our support.',
    trackHint: 'Enter your order ID — it\'s in your confirmation email.',
    trackOrderIdLabel: 'Order ID', trackOrderIdPlaceholder: 'pi_3Nxxx...',
    trackEmailLabel: 'Email (optional)', trackBtn: 'TRACK ORDER',
    orderStatusLabel: 'ORDER STATUS', orderAmountLabel: 'Amount',
    orderIdLabel: 'Order ID', newSearch: '← New search',
    statusSucceeded: 'Paid ✓', statusProcessing: 'Processing',
    statusPaymentPending: 'Payment pending', statusConfirmationPending: 'Awaiting confirmation',
    statusCancelled: 'Cancelled',
    errRequired: 'Required', errInvalidEmail: 'Invalid email',
    errPasswordShort: 'At least 8 characters', errPasswordMismatch: 'Passwords don\'t match',
    errAgeRequired: 'You must be 18+', errTermsRequired: 'Please accept the Terms',
    errAllFields: 'Please fill in all fields.',
    errOrderIdRequired: 'Please enter an order ID.',
    errServerUnreachable: 'Server unreachable. Please try again later.',
  },
}

// ── Spanish ───────────────────────────────────────────────────────────────────
const es: Translations = {
  nav: {
    shop: 'Tienda', about: 'Sobre Nosotros', cart: 'Carrito', profile: 'Mi Cuenta',
    login: 'Iniciar Sesión', register: 'Registrarse', logout: 'Cerrar Sesión', admin: 'Admin / CMS',
    wishlist: 'Lista de Deseos', orders: 'Pedidos', settings: 'Configuración',
  },
  footer: {
    about: 'Sobre Nosotros', shipping: 'Envío y Devoluciones', withdrawal: 'Cancelación',
    privacy: 'Política de Privacidad', terms: 'Condiciones', imprint: 'Aviso Legal',
    tagline: 'Premium Kink · Berlín', adult: '18+ · Solo para adultos',
  },
  ageGate: {
    heading: '¿Tienes 18 años o más?',
    sub: 'Esta tienda es exclusivamente para adultos mayores de 18 años. Por favor confirma tu edad para continuar.',
    confirm: 'SÍ, TENGO 18+', deny: 'NO, SALIR',
    legal: 'Al continuar confirmas que aceptas los',
    termsLink: 'Términos y Condiciones', privacyLink: 'Política de Privacidad',
  },
  cookie: {
    text: 'Usamos cookies y tecnologías similares para pagos seguros y una mejor experiencia. Más información en nuestra',
    privacyLink: 'Política de Privacidad', accept: 'ACEPTAR TODO', necessary: 'SOLO NECESARIAS',
  },
  product: {
    addToCart: 'AÑADIR AL CARRITO', soldOut: 'AGOTADO', wishlist: 'Lista de deseos',
    inStock: 'En stock', onlyLeft: 'Solo quedan', descTab: 'Descripción',
    detailsTab: 'Detalles', reviewsTab: 'Reseñas', material: 'Material',
    level: 'Nivel de Experiencia', category: 'Categoría', brand: 'Marca', sub: 'Subcategoría',
    shipping: 'Envío en 24h · Gratis desde €49 · Embalaje discreto · 30 días de devolución',
    noDescription: 'Sin descripción disponible.', relatedTitle: 'También te puede gustar',
    reviews: 'Reseñas', noReviews: 'Aún no hay reseñas.', basedOn: 'Basado en',
    rating: 'Valoración',
  },
  cart: {
    title: 'Carrito', empty: 'Tu carrito está vacío',
    emptyHint: 'Explora nuestra colección y encuentra algo que te encante.',
    continueShopping: 'SEGUIR COMPRANDO', subtotal: 'Subtotal',
    shipping: 'Envío', total: 'Total', tax: 'incl. 19% IVA',
    checkout: 'FINALIZAR PEDIDO', freeFrom: 'Gratis a partir de aquí',
    freeShipping: 'ENVÍO GRATUITO INCLUIDO',
    toFreeShipping: 'hasta envío gratuito',
    germany: 'Alemania', europe: 'Europa', international: 'Internacional',
  },
  checkout: {
    title: 'Finalizar Pedido', addressStep: 'Dirección de Envío', paymentStep: 'Pago',
    firstName: 'Nombre', lastName: 'Apellido', email: 'Email', phone: 'Teléfono',
    street: 'Calle y Número', zip: 'Código Postal', city: 'Ciudad', country: 'País',
    continueToPayment: 'CONTINUAR AL PAGO →', changeAddress: '← CAMBIAR DIRECCIÓN',
    payNow: 'PAGAR AHORA', processing: 'PROCESANDO...',
    secure: 'SSL seguro · Powered by Stripe · Facturación discreta',
    successTitle: 'PAGO EXITOSO', successText: '¡Gracias por tu pedido!',
    confirmation: 'Se ha enviado una confirmación a', backToShop: 'VOLVER A LA TIENDA',
    shippingTo: 'Enviar a', orderSummary: 'Resumen del Pedido',
    taxIncluded: 'incl. 19% IVA', backToCart: '← VOLVER AL CARRITO',
    loadingPayment: 'CARGANDO FORMULARIO DE PAGO…',
  },
  profile: {
    title: 'Mi Cuenta', overview: 'Resumen', ordersTab: 'Pedidos',
    wishlistTab: 'Lista de Deseos', settingsTab: 'Configuración',
    orders: 'Pedidos', wishlistItems: 'Lista de Deseos', returns: 'Días Devolución',
    deliveryAddress: 'DIRECCIÓN DE ENTREGA', editAddress: 'EDITAR DIRECCIÓN →',
    addAddress: 'AÑADIR DIRECCIÓN →', personalData: 'DATOS PERSONALES',
    saveButton: 'GUARDAR', saving: 'GUARDANDO…', saved: '✓ Guardado', reset: 'RESTABLECER',
    emailHint: 'Para cambiar tu email contacta: hallo@toys4joys.de',
    deleteAccount: 'ELIMINAR CUENTA',
    deleteWarning: 'Todos tus datos personales serán eliminados (RGPD Art. 17). El historial de pedidos permanece anonimizado por razones fiscales.',
    deleteConfirm: '¿Realmente eliminar? Haz clic de nuevo para confirmar.',
    deleting: 'ELIMINANDO…', noOrders: 'Aún no hay pedidos',
    noOrdersHint: 'Una vez que realices un pedido, aparecerá aquí.',
    shopNow: 'COMPRAR AHORA', emptyWishlist: 'Lista de deseos vacía',
    emptyWishlistHint: 'Guarda los productos que quieras seguir de cerca.',
    discover: 'DESCUBRIR COLECCIÓN', orderNumber: 'PEDIDO #',
    trackingNumber: 'NÚMERO DE SEGUIMIENTO', trackHint: 'Haz clic para rastrear tu paquete.',
    deliveryTo: 'ENTREGA A',
    status: { pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' },
  },
  static: {
    aboutTitle: 'Sobre Nosotros', shippingTitle: 'Envío y Devoluciones', privacyTitle: 'Política de Privacidad',
    termsTitle: 'Condiciones', imprintTitle: 'Aviso Legal', withdrawalTitle: 'Cancelación',
    legalOnly: 'Esta página solo está disponible en alemán por razones legales.',
  },
  landing: {
    heroCta: 'DESCUBRIR COLECCIÓN', featuredTitle: 'PRODUCTOS DESTACADOS',
    categoryTitle: 'CATEGORÍAS', allProducts: 'TODOS LOS PRODUCTOS',
    heroTag: 'Berlín · Premium Kink',
    heroLine1: 'Todo.', heroLine2: 'Sin', heroLine3: 'Compromisos.',
    heroBody: 'BDSM. Vibradores. Látex. Electroestimulación. Llevamos lo mejor — curado por personas que viven lo que venden. Premium Kink desde Berlín.',
    heroCtaSecondary: 'COLECCIÓN BDSM',
    story1Tag: 'Manifiesto',
    story1Heading: 'Sin excusas.',
    story1Body: 'No vendemos fantasías. Vendemos herramientas para personas que saben exactamente lo que quieren. Cada producto está aquí con intención — seleccionado, probado, respetado.',
    story2Tag: 'Artesanía',
    story2Heading: 'Berlín lo hace diferente.',
    story2Body: 'Elegimos cada producto personalmente — en Berlín. Cuero genuino. Acero inoxidable. Silicona de grado médico. Ningún fabricante entra en el catálogo sin cumplir nuestros estándares. No es un algoritmo — es intención.',
    story3Tag: 'Comunidad',
    story3Heading: 'Para todos. Sin excepciones.',
    story3Body: 'Queer. Hetero. No binario. Dom. Sub. Switch. Curioso. No creamos cajas. Creamos un espacio. Embalaje discreto. Sin moralinas. Sin límites más allá de los tuyos.',
    stat1Label: 'Categorías',
    stat2Label: 'Entrega Discreta',
    stat3Label: 'Curado y Vivido',
    sortimentTag: 'Colección',
    featuredTag: 'Productos Destacados',
    shippingTag: 'Envío',
    shippingHeading: 'Envío en 24h. Gratis desde €49.',
    shippingBody: 'Embalaje discreto. Sin remitente en la caja. Entrega rápida en toda Europa. Devolución en 30 días sin preguntas.',
    shippingCta: 'COMPRAR AHORA',
  },
  shop: {
    title: 'Tienda', filters: 'Filtros', sort: 'Ordenar', noResults: 'No se encontraron productos.',
    sortNewest: 'Más nuevos', sortPriceAsc: 'Precio: menor a mayor', sortPriceDesc: 'Precio: mayor a menor',
    sortRating: 'Valoración', priceRange: 'Rango de Precio', subcategories: 'Subcategorías',
    levels: 'Nivel de Experiencia', all: 'Todos',
  },
  general: {
    loading: 'Cargando…', error: 'Error', backToHome: 'VOLVER AL INICIO', reload: 'RECARGAR PÁGINA',
    unexpectedError: 'ERROR INESPERADO',
    contactUs: 'Algo salió mal. Por favor recarga la página o contáctanos en',
  },
  auth: {
    accountHeader: 'CUENTA', loginTab: 'INICIAR SESIÓN', registerTab: 'REGISTRARSE', trackTab: 'PEDIDO',
    emailPlaceholder: 'tu@email.com', passwordPlaceholder: '••••••••', passwordMin: 'Al menos 8 caracteres',
    confirmPasswordLabel: 'Confirmar contraseña',
    firstNamePlaceholder: 'Ana', lastNamePlaceholder: 'García',
    rememberMe: 'Mantener sesión iniciada', forgotPassword: '¿Olvidaste tu contraseña?',
    ageConfirm: 'Tengo 18 años o más',
    termsAcceptPre: 'Acepto los', termsAcceptMid: 'y la',
    createAccountBtn: 'CREAR CUENTA', signInBtn: 'INICIAR SESIÓN',
    confirmationSent: 'EMAIL DE CONFIRMACIÓN ENVIADO',
    confirmationText1: 'Enviamos un email de confirmación a',
    confirmationText2: 'Por favor haz clic en el enlace para activar tu cuenta.',
    checkSpam: '¿No recibiste el email? Revisa la carpeta de spam o contacta a soporte.',
    trackHint: 'Ingresa tu ID de pedido — está en tu email de confirmación.',
    trackOrderIdLabel: 'ID de Pedido', trackOrderIdPlaceholder: 'pi_3Nxxx...',
    trackEmailLabel: 'Email (opcional)', trackBtn: 'RASTREAR PEDIDO',
    orderStatusLabel: 'ESTADO DEL PEDIDO', orderAmountLabel: 'Importe',
    orderIdLabel: 'ID de Pedido', newSearch: '← Nueva búsqueda',
    statusSucceeded: 'Pagado ✓', statusProcessing: 'Procesando',
    statusPaymentPending: 'Pago pendiente', statusConfirmationPending: 'Confirmación pendiente',
    statusCancelled: 'Cancelado',
    errRequired: 'Obligatorio', errInvalidEmail: 'Email inválido',
    errPasswordShort: 'Al menos 8 caracteres', errPasswordMismatch: 'Las contraseñas no coinciden',
    errAgeRequired: 'Debes tener 18+', errTermsRequired: 'Por favor acepta los términos',
    errAllFields: 'Por favor completa todos los campos.',
    errOrderIdRequired: 'Por favor ingresa un ID de pedido.',
    errServerUnreachable: 'Servidor no disponible. Inténtalo más tarde.',
  },
}

export const translations: Record<Locale, Translations> = { de, en, es }
