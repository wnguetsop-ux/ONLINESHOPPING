# MasterShopPro / shopmaster-v2

## 1. Vue d'ensemble
Plateforme e-commerce **ciblée Cameroun** (devise XAF), avec une porte « Envoyer à ma famille » pour la diaspora camerounaise en Europe.
Stack : **Next.js 14.2** (App Router) + **Firebase 10** (Auth, Firestore, Storage) + **Gemini AI** + **Capacitor 8** (Android) + **Tailwind**.
Modèle multi-tenant : 1 boutique = 1 slug d'URL (`/[shop]`).
3 rôles : **client** (anonyme), **admin** (propriétaire boutique, PIN 8h), **superadmin** (plateforme).

**Positionnement v3 (mai 2026) :** *« L'app de vente des commerçants camerounais — boutique, partage WhatsApp, encaissement, et une porte d'entrée pour la diaspora qui veut acheter pour sa famille. »* L'IA est une **feature** (Studio IA pour fiches produit), pas le produit. Fondateur basé en Italie : tout est exécutable à distance.

## 2. Architecture (App Router)
- `app/(auth)/` — login, register propriétaires
- `app/(admin)/admin/` — dashboard propriétaire (products, orders, clients, whatsapp, settings, stats, subscription)
- `app/(demo)/demo/` — mode démo
- `app/[shop]/` — vitrine publique (page, cart, checkout)
- `app/superadmin/` — supervision plateforme
- `app/api/` — routes serveur : `analyze-product`, `improve-message`, `photo-studio`, `proxy-image`, `stripe-webhook`
- `lib/` — `firebase.ts`, `firestore.ts`, `gemini.ts`, `whatsapp.ts`, `ai-messages.ts`, `analytics.ts`, `insights.ts`, `pin.ts`, `types.ts`

**À venir (v3 — voir [PLAN_V3.md](PLAN_V3.md)) :**
- `app/p/[id]/` — page produit virale partageable (Phase 1)
- `app/(admin)/admin/studio/` — Studio IA 4 écrans (Phase 2)
- `app/envoyer/` — module diaspora « Envoyer à ma famille » (Phase 3)

## 3. Entités principales
Voir [lib/types.ts](lib/types.ts) : `Shop`, `Admin`, `Product`, `Category`, `Order`, `CommLog`.
Plans d'abonnement : **FREE** / **STARTER** / **PRO**.

## 4. Intégrations clés
- **Firebase** : Auth email/password, Firestore (collections shops/products/orders/…), Storage (`shops/{shopId}/products/`)
- **Gemini** (`@google/generative-ai`, modèle `gemini-1.5-flash`) : analyse photo produit, amélioration messages, insights
- **WhatsApp** : Phase 1 active = liens `wa.me` (envoi manuel depuis le WhatsApp perso du commerçant). Phase 2 (API Meta Cloud + collection `merchant_whatsapp_accounts`) **présente dans le code mais dormante** — pas de promesse marketing dessus, on garde l'optionalité pour un futur pivot
- **Stripe** : `app/api/stripe-webhook` conservé pour le futur module diaspora (paiements EUR par la diaspora européenne)
- **Capacitor** : packaging Android (`com.mastershoppro.app`), `webDir: 'out'`
- **Sécurité PIN** : SHA-256, session 8h en localStorage (voir [lib/pin.ts](lib/pin.ts))

## 5. Commandes
- `npm run dev` — dev server
- `npm run build` — build prod
- `npm start` — start prod
- `./deploy.ps1` — clean `.next/` → build → push main → deploy Vercel (`vercel --prod`)

## 6. Conventions
- **Langue** : français partout (UI, messages, commits, commentaires)
- **TypeScript** strict ; le build ignore actuellement les erreurs TS (à savoir avant tout refactor)
- Composants `PascalCase`, hooks `useX`, constantes `UPPER_SNAKE_CASE`, routes kebab-case
- Emojis OK dans les messages utilisateur / templates WhatsApp (👋 🔥 ✅ 💰), **pas** dans le code source
- Pas de lib de charts npm — Chart.js est chargé via CDN dans le dashboard

## 7. Règles de collaboration
- Répondre en **français** par défaut
- Préserver la séparation des rôles (admin / superadmin / client) lors des modifs
- Ne jamais committer `my-release-key.jks`, ni clés Firebase/Gemini, ni `.env*`
- Tester les changements UI réellement (storefront + admin) — pas seulement le build
- Toute nouvelle collection Firestore doit avoir une règle dans [firestore.rules](firestore.rules)
- Le déploiement passe par **Vercel** (pas Firebase Hosting), même si Firebase est utilisé pour les data
- **Ne pas supprimer le câblage WhatsApp Phase 2 ni `merchant_whatsapp_accounts`** — option dormante volontaire (décision 2026-05-01)
- **Avancer par petites phases** (cf. [PLAN_V3.md](PLAN_V3.md)) — pas de gros refactor monolithique

## 8. Docs liées
- [PLAN_V3.md](PLAN_V3.md) — plan d'évolution v3 (positionnement, phases, fichiers à créer/modifier)
- [GUIDE_AMELIORATIONS.md](GUIDE_AMELIORATIONS.md) — historique des features (filtres, charts, PWA safe-area, Play Store)
