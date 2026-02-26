'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ==============================================================================
// i18n - Systeme de traduction global Mastershop
// 
// Usage dans n'importe quelle page/composant :
//   const { t, lang } = useI18n();
//   <p>{t('nav.products')}</p>
//
// La langue est detectee automatiquement via navigator.language
// FR pour tous les pays francophones africains + France, Belgique, etc.
// EN pour le reste (USA, Canada anglophone, UK, Allemagne, etc.)
// ==============================================================================

export type Lang = 'fr' | 'en';

// -- Dictionnaire complet -----------------------------------------------------
const translations = {
  fr: {
    // Navigation
    'nav.dashboard':    'Tableau de bord',
    'nav.products':     'Produits',
    'nav.orders':       'Commandes',
    'nav.subscription': 'Abonnement',
    'nav.settings':     'Parametres',
    'nav.myShop':       'Voir ma boutique',
    'nav.logout':       'Deconnexion',

    // Actions communes
    'action.save':      'Sauvegarder',
    'action.cancel':    'Annuler',
    'action.delete':    'Supprimer',
    'action.edit':      'Modifier',
    'action.add':       'Ajouter',
    'action.search':    'Rechercher...',
    'action.loading':   'Chargement...',
    'action.confirm':   'Confirmer',
    'action.close':     'Fermer',
    'action.back':      'Retour',
    'action.new':       'Nouveau',
    'action.upload':    'Upload...',

    // Produits
    'products.title':        'Produits',
    'products.new':          'Nouveau produit',
    'products.edit':         'Modifier le produit',
    'products.name':         'Nom du produit',
    'products.description':  'Description',
    'products.specs':        'Caracteristiques',
    'products.category':     'Categorie',
    'products.brand':        'Marque',
    'products.sku':          'SKU (code article)',
    'products.barcode':      'Code-barres (EAN/UPC)',
    'products.costPrice':    'Prix d\'achat',
    'products.sellingPrice': 'Prix de vente',
    'products.stock':        'Stock',
    'products.minStock':     'Stock min. alerte',
    'products.active':       'Actif (visible)',
    'products.featured':     ' Mis en avant',
    'products.margin':       'Marge',
    'products.allCats':      'Toutes categories',
    'products.none':         'Aucun produit trouve',
    'products.limit':        'Limite de produits atteinte',
    'products.photo':        'Photo du produit',
    'products.photoHint':    ' Gemini + GPT-4o remplissent les champs automatiquement',
    'products.crop.hint':    ' Glissez pour repositionner',
    'products.crop.confirm': 'Confirmer le cadrage',
    'products.photo.delete': ' Supprimer',
    'products.photo.recrop': ' Recadrer',
    'products.photo.import': 'Importer & cadrer',
    'products.photo.camera': ' Photo + IA',
    'products.camera.flip':  'Flip',
    'products.camera.hint':  'Centrez le produit dans le cadre',
    'products.ai.analyzing': 'IA analyse - les champs se remplissent...',
    'products.confirm.crop': 'Confirmez d\'abord le cadrage',

    // Studio Photo IA
    'studio.title':       'Studio Photo IA',
    'studio.subtitle':    'Optimisez pour vendre plus',
    'studio.preview':     'Apercu temps reel',
    'studio.original':    'Original',
    'studio.result':      ' Resultat',
    'studio.credits':     'credit',
    'studio.credits_pl':  'credits',
    'studio.apply':       'Appliquer',
    'studio.applying':    'Optimisation...',
    'studio.reset':       'Reinitialiser',
    'studio.bgWhite':     'Fond blanc pur',
    'studio.bgWhiteSub':  'Ideal pour e-commerce',
    'studio.brightness':  'Luminosite',
    'studio.contrast':    'Contraste',
    'studio.saturation':  'Saturation',
    'studio.sharpness':   'Nettete',
    'studio.warmth':      'Chaleur',
    'studio.settings':    'Reglages',
    'studio.aiScore':     'Analyse IA de votre photo',
    'studio.aiApply':     ' Appliquer les suggestions IA',
    'studio.noCredits':   'Credits epuises',
    'studio.noCredSub':   'Les reglages manuels restent disponibles',
    'studio.recharge':    'Recharger ',
    'studio.applied':     'Studio IA applique',
    'studio.saveInfo':    'Photo sauvegardee en 10241024px',
    'studio.lowCredits':  'Studio Photo IA - {n} credit restant',
    'studio.lowCreds_pl': 'Studio Photo IA - {n} credits restants',
    'studio.packInfo':    'Pack 50 photos = 1 000 FCFA  Pack 200 = 3 000 FCFA',

    // Credits / Paiement
    'credits.title':      'Recharger Studio IA',
    'credits.current':    'Credits actuels',
    'credits.inAfrica':   ' En Afrique',
    'credits.diaspora':   ' En diaspora',
    'credits.africaPay':  ' Paiement Mobile Money (Wave, Orange, MTN...)',
    'credits.diasporaPay':' Paiement en EUR disponible (Stripe carte bancaire)',
    'credits.choosePack': 'Choisir un pack',
    'credits.perPhoto':   '/photo',
    'credits.chooseMethod':'Methode de paiement',
    'credits.stripe':     'Carte bancaire via Stripe',
    'credits.stripeSub':  'Visa  Mastercard  CB  Apple Pay  Google Pay',
    'credits.stripeNote': 'Paiement securise  Credits actives sous 2h',
    'credits.stripeHint': 'Apres paiement, envoie une capture Stripe sur WhatsApp pour activer tes credits plus vite.',
    'credits.wire':       'Virement SEPA / bancaire',
    'credits.wireSub':    'Europe  1-2 jours ouvres',
    'credits.wireHide':   'Masquer',
    'credits.wireShow':   'IBAN ',
    'credits.wireConfirm':'Confirmer sur WhatsApp apres virement',
    'credits.whatsapp':   'Contacter sur WhatsApp',
    'credits.waSub':      'Wise, Western Union, autre methode - on s\'adapte',
    'credits.pay':        'Payer',
    'credits.activated':  ' Credits actives sous 2h maximum',
    'credits.popular':    ' POPULAIRE',

    // Orders
    'orders.title':   'Commandes',
    'orders.none':    'Aucune commande',
    'orders.new':     'Nouvelle commande',
    'orders.total':   'Total',
    'orders.status':  'Statut',
    'orders.date':    'Date',
    'orders.customer':'Client',

    // Dashboard
    'dashboard.sales':    'Ventes du jour',
    'dashboard.revenue':  'Chiffre d\'affaires',
    'dashboard.profit':   'Benefices',
    'dashboard.stock':    'Alertes stock',

    // Auth
    'auth.login':     'Connexion',
    'auth.email':     'Email',
    'auth.password':  'Mot de passe',
    'auth.signin':    'Se connecter',
    'auth.register':  'Creer un compte',
    'auth.forgot':    'Mot de passe oublie ?',

    // Errors
    'error.general':  'Une erreur s\'est produite',
    'error.notFound': 'Introuvable',
  },

  en: {
    // Navigation
    'nav.dashboard':    'Dashboard',
    'nav.products':     'Products',
    'nav.orders':       'Orders',
    'nav.subscription': 'Subscription',
    'nav.settings':     'Settings',
    'nav.myShop':       'View my shop',
    'nav.logout':       'Sign out',

    // Actions
    'action.save':      'Save',
    'action.cancel':    'Cancel',
    'action.delete':    'Delete',
    'action.edit':      'Edit',
    'action.add':       'Add',
    'action.search':    'Search...',
    'action.loading':   'Loading...',
    'action.confirm':   'Confirm',
    'action.close':     'Close',
    'action.back':      'Back',
    'action.new':       'New',
    'action.upload':    'Uploading...',

    // Products
    'products.title':        'Products',
    'products.new':          'New product',
    'products.edit':         'Edit product',
    'products.name':         'Product name',
    'products.description':  'Description',
    'products.specs':        'Specifications',
    'products.category':     'Category',
    'products.brand':        'Brand',
    'products.sku':          'SKU (item code)',
    'products.barcode':      'Barcode (EAN/UPC)',
    'products.costPrice':    'Cost price',
    'products.sellingPrice': 'Selling price',
    'products.stock':        'Stock',
    'products.minStock':     'Min. stock alert',
    'products.active':       'Active (visible)',
    'products.featured':     ' Featured',
    'products.margin':       'Margin',
    'products.allCats':      'All categories',
    'products.none':         'No products found',
    'products.limit':        'Product limit reached',
    'products.photo':        'Product photo',
    'products.photoHint':    ' Gemini + GPT-4o fill fields automatically',
    'products.crop.hint':    ' Drag to reposition',
    'products.crop.confirm': 'Confirm crop',
    'products.photo.delete': ' Delete',
    'products.photo.recrop': ' Recrop',
    'products.photo.import': 'Import & crop',
    'products.photo.camera': ' Photo + AI',
    'products.camera.flip':  'Flip',
    'products.camera.hint':  'Center the product in frame',
    'products.ai.analyzing': 'AI analyzing - fields filling automatically...',
    'products.confirm.crop': 'Confirm crop first',

    // Studio Photo IA
    'studio.title':       'AI Photo Studio',
    'studio.subtitle':    'Optimize to sell more',
    'studio.preview':     'Live preview',
    'studio.original':    'Original',
    'studio.result':      ' Result',
    'studio.credits':     'credit',
    'studio.credits_pl':  'credits',
    'studio.apply':       'Apply',
    'studio.applying':    'Optimizing...',
    'studio.reset':       'Reset all',
    'studio.bgWhite':     'Pure white background',
    'studio.bgWhiteSub':  'Ideal for e-commerce',
    'studio.brightness':  'Brightness',
    'studio.contrast':    'Contrast',
    'studio.saturation':  'Saturation',
    'studio.sharpness':   'Sharpness',
    'studio.warmth':      'Warmth',
    'studio.settings':    'Adjustments',
    'studio.aiScore':     'AI analysis of your photo',
    'studio.aiApply':     ' Apply AI suggestions',
    'studio.noCredits':   'No credits left',
    'studio.noCredSub':   'Manual adjustments still available',
    'studio.recharge':    'Buy credits ',
    'studio.applied':     'AI Studio applied',
    'studio.saveInfo':    'Photo saved at 10241024px',
    'studio.lowCredits':  'AI Photo Studio - {n} credit left',
    'studio.lowCreds_pl': 'AI Photo Studio - {n} credits left',
    'studio.packInfo':    '50 photos pack = 1,000 FCFA  200 pack = 3,000 FCFA',

    // Credits / Payment
    'credits.title':      'Buy Studio Credits',
    'credits.current':    'Current credits',
    'credits.inAfrica':   ' I\'m in Africa',
    'credits.diaspora':   ' I\'m in diaspora',
    'credits.africaPay':  ' Mobile Money payment (Wave, Orange, MTN...)',
    'credits.diasporaPay':' EUR payment available (Stripe card)',
    'credits.choosePack': 'Choose a pack',
    'credits.perPhoto':   '/photo',
    'credits.chooseMethod':'Payment method',
    'credits.stripe':     'Credit/debit card via Stripe',
    'credits.stripeSub':  'Visa  Mastercard  Apple Pay  Google Pay',
    'credits.stripeNote': 'Secure payment  Credits activated within 2h',
    'credits.stripeHint': 'After payment, send a Stripe screenshot on WhatsApp to activate your credits faster.',
    'credits.wire':       'Bank transfer (SEPA)',
    'credits.wireSub':    'Europe  1-2 business days',
    'credits.wireHide':   'Hide',
    'credits.wireShow':   'IBAN ',
    'credits.wireConfirm':'Confirm transfer on WhatsApp',
    'credits.whatsapp':   'Contact on WhatsApp',
    'credits.waSub':      'Wise, Western Union, other - we adapt',
    'credits.pay':        'Pay',
    'credits.activated':  ' Credits activated within 2h max',
    'credits.popular':    ' POPULAR',

    // Orders
    'orders.title':   'Orders',
    'orders.none':    'No orders',
    'orders.new':     'New order',
    'orders.total':   'Total',
    'orders.status':  'Status',
    'orders.date':    'Date',
    'orders.customer':'Customer',

    // Dashboard
    'dashboard.sales':    'Today\'s sales',
    'dashboard.revenue':  'Revenue',
    'dashboard.profit':   'Profit',
    'dashboard.stock':    'Stock alerts',

    // Auth
    'auth.login':     'Sign in',
    'auth.email':     'Email',
    'auth.password':  'Password',
    'auth.signin':    'Sign in',
    'auth.register':  'Create account',
    'auth.forgot':    'Forgot password?',

    // Errors
    'error.general':  'An error occurred',
    'error.notFound': 'Not found',
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;

// -- Pays francophones (navigateur) ------------------------------------------
const FRENCH_LOCALES = ['fr', 'fr-fr', 'fr-be', 'fr-ch', 'fr-ca', 'fr-sn', 'fr-ci', 'fr-cm', 'fr-ml', 'fr-bf', 'fr-gn', 'fr-tg', 'fr-bj', 'fr-ne', 'fr-cd', 'fr-cg', 'fr-ga', 'fr-mg'];

function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'fr';
  const lang = navigator.language?.toLowerCase() || '';
  return FRENCH_LOCALES.some(l => lang.startsWith(l.split('-')[0]) && (l === lang.split('-')[0] || lang.startsWith(l))) ? 'fr' : lang.startsWith('fr') ? 'fr' : 'en';
}

// -- Context ------------------------------------------------------------------
interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'fr',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr');

  useEffect(() => {
    setLang(detectLang());
  }, []);

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    const dict = translations[lang] as Record<string, string>;
    let str = dict[key] ?? (translations.fr as Record<string, string>)[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}