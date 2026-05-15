# MasterShopPro Project Guide

> **Last updated:** 2026-05-15 — Premium redesign shipped + Product flow engineering proposals

## Product Vision

MasterShopPro must become the simplest, clearest and most reassuring way for an African merchant to organize WhatsApp sales.

Core promise:

`Tu prends une photo. La brochure est prête. Tu partages. Le client commande.`

Primary flow (2026-05-15, validé) :

`Photo → Fiche IA → Brochure → Partage WhatsApp → Commande suivie → Boutique en ligne`

Secondary flow (ordre de valeur) :

`Message WhatsApp → Client → Commande → Statut → Suivi`

Extended vision (2026–2027):

`Tous vos canaux (WhatsApp, TikTok, Instagram) → une seule boîte de commandes → Mobile Money → Livraison`

## Product Rules

- Improve before removing.
- Simplify without reducing value.
- Keep the merchant's existing selling habits intact.
- Prioritize incoming-message value before any outbound automation.
- Always preserve human validation on sensitive actions.
- Mobile-first is not optional.

## UX Rules

- One primary action per screen.
- Important information must be visible in a few seconds.
- Every page must feel understandable by a non-technical merchant.
- Do not overload forms, popups or detail views.
- Keep the path from message to order obvious.
- Use short, practical language. Avoid startup jargon.

## Design Rules

- Premium but warm, never cold.
- Restore useful visuals and interactions before replacing them.
- Rich visual hierarchy is allowed when it improves comprehension.
- Reuse strong existing assets before generating new ones.
- Keep consistent spacing, radii, hover states and transitions across the app.
- Marketing pages can be richer; work surfaces must stay clear and fast.

## Safety Rules

- No automatic WhatsApp sending by default.
- AI may suggest, never send alone.
- Show cost or window risks before future outbound actions.
- Keep secrets server-side only.
- Avoid logic that could send hidden paid traffic.

## Deployment Rules

- Do not break Vercel production.
- Keep the web app coherent with the Android app and Play Store listing.
- Any visual refactor must still feel legitimate for a business app on Google Play.

## Refactor Principle

When something feels too simple, ask:

1. Did we remove useful context?
2. Did we weaken trust?
3. Did we flatten the experience?
4. Did we lose feedback or visual guidance?

If yes, restore or replace it with something better.

---

# Market Intelligence (as of 2026-04-30)

This section captures verified market realities that must inform every product decision.

## Cameroon & Francophone Africa — Ground Truth

- **Market size:** Cameroon e-commerce valued at ~811M EUR in 2025, growing at +18% YoY.
- **WhatsApp dominance:** WhatsApp + TikTok are becoming the primary transaction surfaces, replacing generic e-commerce websites for most local merchants.
- **Mobile Money is the default payment rail:** MTN MoMo + Orange Money account for 70%+ of online payments. Stripe/PayPal are largely irrelevant for the target audience. Any feature that does not speak Mobile Money is half-built.
- **Social Logistics is emerging:** WhatsApp is becoming the real-time coordination layer between merchants, delivery riders, and customers — a new paradigm called "Social Logistics".
- **TikTok Shop is exploding:** TikTok GMV reached $64B in 2025 (+94% YoY). African merchants are already selling on TikTok Live. Orders are received by DM and managed manually. This is MasterShopPro's next capture surface.
- **Voice messages are commerce:** African merchants and customers frequently use WhatsApp voice notes to place and confirm orders. AI must eventually parse audio, not just text.
- **Connectivity is improving but still constrained:** Mobile-first is non-negotiable. Heavy pages, large assets, and complex onboarding flows will kill retention in 2G/3G areas.

## WhatsApp API — The Onboarding Friction Problem

The current approach (direct Meta Cloud API + manual Embedded Signup) is the biggest churn risk. Research confirms:

- Direct Meta Embedded Signup requires Business Verification (3–15 days), App Review, and technical steps most merchants cannot complete alone.
- **BSP (Business Solution Provider) route is the correct fix.** Providers like WATI ($49/mo), 360dialog ($49/mo + $0.005/msg), and Wassenger handle Meta compliance on behalf of merchants. Merchants connect in minutes, not days.
- **QR-code-based providers** (e.g. Waslo) allow sub-2-minute onboarding with zero Meta verification — ideal for a freemium entry tier, though not officially sanctioned by Meta.
- Per-message pricing (effective July 2025): Service messages (replies within 24h window) are free. Marketing template messages cost ~$0.025 in most African markets. At low volume, cost is negligible.

**Strategic conclusion:** For the STARTER plan, route merchants through a BSP (WATI or 360dialog) rather than DIY Cloud API. This removes the #1 onboarding blocker and converts WhatsApp setup from a 15-day technical project to a 5-minute task.

## Competitive Landscape

- **No dominant African-first WhatsApp order management tool exists** in francophone Africa as of 2026. The field is open.
- Global competitors (Tidio, WATI, Gallabox) are not localized for XAF currency, MTN MoMo, or French-Cameroonian merchant language patterns.
- **First-mover advantage is real and shrinking** — act on Mobile Money integration and simplified onboarding before a funded competitor does.

## Priority Features Ranked by Market Pull (2026)

| Rank | Feature | Why now |
|------|---------|---------|
| 1 | MTN MoMo + Orange Money payment links | 70%+ of payments — merchants lose sales without this |
| 2 | BSP-based WhatsApp onboarding (5 min setup) | Current flow bleeds new users before they see value |
| 3 | AI order detection in French + local slang | Keyword heuristics miss too many real orders |
| 4 | Voice message order parsing | Widespread usage, zero tools address it |
| 5 | TikTok/Instagram DM order capture | Next channel wave arriving now |
| 6 | WhatsApp delivery coordination (Social Logistics) | Emerging behavior, early mover wins |
| 7 | Multi-agent / family staff access | Merchants use family to help manage volume |
| 8 | Offline-tolerant sync | Connectivity gaps cause data loss and merchant frustration |

---

# Technical Reality (as of 2026-04-30)

This section is the ground truth about the WhatsApp integration. Read before touching anything WhatsApp-related.

## Current WhatsApp architecture — what already exists

### Server-side pipeline (LIVE, working with Meta test number)

- **Webhook route** : `app/api/whatsapp/webhook/route.ts`
  - `GET` handler verifies Meta webhook using `WHATSAPP_VERIFY_TOKEN` (value currently: `william`)
  - `POST` handler checks Firebase Admin is ready, then calls `processIncomingWhatsAppWebhook(body)`
  - NO signature verification (`x-hub-signature-256`) yet — this is a gap
- **Ingestion pipeline** : `lib/server/whatsapp-processing.ts`
  - `processIncomingWhatsAppWebhook(rawPayload)` orchestrates the full flow
  - Detects merchant by `phone_number_id` lookup in `merchant_whatsapp_accounts`
  - Saves every payload raw into `raw_webhook_events` for debug/replay
  - For each message: `extractOrCreateCustomer` → `analyzeIncomingMessage` → `upsertThread` → `createDraftOrderIfNeeded` → `saveIncomingMessage`
  - Auto-creates a draft Order with `workflowStatus: 'pending_review'` and `source: 'whatsapp_incoming'` when confidence ≥ 0.72 AND `suggestedAction === 'create_draft_order'`
- **AI analysis** : `lib/whatsapp-analysis.ts` — keyword-based heuristics (not Gemini/OpenAI-powered) categorizing messages as `new_order_request`, `product_question`, `payment_proof`, etc.
- **Message normalization** : `lib/whatsapp-normalize.ts` — converts Meta payload shape to `NormalizedIncomingMessage`
- **Outbound safety evaluator** : `lib/whatsapp-outbound-safety.ts` — enforces 24h window, rate limit (max 3 per 30s), requires `userTriggered`, blocks `automaticOutgoingEnabled`
- **Text-analysis API** : `app/api/whatsapp/analyze-text/route.ts` — standalone AI analysis endpoint used by the UI for manual captures
- **Firebase Admin** : `lib/server/firebase-admin.ts` — lazy init from `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` (NOT a monolithic JSON)

### Client-side

- **Admin WhatsApp page** : `app/(admin)/admin/whatsapp/page.tsx`
  - Manual self-declaration form — merchant types phone number + Meta email
  - Buttons: "Sauvegarder ce numero", "Ouvrir Meta pour connecter", "J'ai lance la connexion", "Meta dit que ce numero est deja utilise" (→ `migration_required`), "Mon numero est bien connecte"
  - Links to hardcoded Meta App dashboard URL (App ID `2156393638456818`)
  - NO real Embedded Signup yet — the UI tracks state but does not actually talk to Meta Graph API
- **Command center** : `components/orders/WhatsAppCommandCenter.tsx` — inbox UI for threads + messages
- **Firestore client helpers** : `lib/merchant-firestore.ts` — `getMerchantWhatsappAccounts`, `upsertMerchantWhatsappAccount`, `getWhatsappThreads`, `getWhatsappMessages`, etc.

### Firestore collections in use

- `shops/{shopId}` — the merchant's boutique (ownerId, slug, whatsapp display number, currency, plan, templates)
- `merchants/{merchantId}` — merchant entity (often `merchantId === shopId` in current code)
- `subscriptions/{id}` — plan state per merchant
- `merchant_whatsapp_accounts/{id}` — one document per WABA/phone_number linked to a merchant
- `customers/{id}` — id pattern `${merchantId}__${phone}` (deterministic)
- `whatsapp_threads/{id}` — id pattern `${merchantId}__${customerId}`
- `whatsapp_messages/{id}` — id pattern `${merchantId}__${waMessageId}` (idempotent)
- `raw_webhook_events/{id}` — auto-generated, for replay/debug
- `internal_notes/{id}` — agent notes on a thread/order/customer
- `orders/{id}` — extended order model with `amountPaid`, `balanceDue`, `paymentStatus`, `workflowStatus`, `source: 'whatsapp_incoming'`, `linkedThreadId`
- `products`, `categories`, `admins` — unchanged
- Legacy: `stripe_payments`, `pending_credits` (studio photo IA), `traffic_events`, `demo_events`, `api_logs`

### Plans and feature flags — `lib/types.ts`

- Plans: `FREE` (8 orders/mo, 0 WhatsApp), `STARTER` (3000 XAF, 1 WhatsApp), `STANDARD` (5000 XAF, popular, auto draft orders), `PRO` (10000 XAF, 3 WhatsApp, multi-staff)
- Each plan has `featureFlags` map — `incomingWhatsappInbox`, `orderIntentDetection`, `draftOrders`, `controlledOutboundReady`, etc.
- Use `hasPlanFeature(planId, 'orderIntentDetection')` to gate features

### Environment variables — naming convention

`.env.local` is populated. Authoritative names:

- `WHATSAPP_VERIFY_TOKEN` (libre, doit matcher côté Meta webhook config)
- `WHATSAPP_APP_ID`, `WHATSAPP_APP_SECRET`
- `WHATSAPP_ACCESS_TOKEN` — system user token Meta (long-lived)
- `WHATSAPP_PHONE_NUMBER_ID` — numéro de test Meta connecté
- `WHATSAPP_BUSINESS_ACCOUNT_ID` — WABA Meta du compte
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Admin SDK (PEM with `\n` escaped)
- `GEMINI_API_KEY`, `OPENAI_API_KEY` — AI
- `NEXT_PUBLIC_APP_URL` — prod URL

**Do not introduce `META_*` aliases.** All WhatsApp env vars use the `WHATSAPP_` prefix.

## What's missing / what's broken

1. **No real Embedded Signup flow** — the `admin/whatsapp` page is a manual state tracker, not an actual Meta OAuth handshake. Commerçants cannot self-onboard their existing numbers without manual Meta Business Manager intervention.
2. **No webhook signature verification** — `x-hub-signature-256` is ignored. Anyone who guesses the URL could post payloads. Must add before production.
3. **No outbound send route** — `sendWhatsApp()` in `lib/whatsapp.ts` only opens `wa.me` links client-side. No server-side Cloud API send.
4. **No token-per-merchant storage** — `merchant_whatsapp_accounts` does not store encrypted access tokens. Currently all traffic uses the single `WHATSAPP_ACCESS_TOKEN` (shop-wide). Cannot scale to multiple independent merchant WABAs.
5. **Merchant ID vs Shop ID confusion** — `merchant_whatsapp_accounts.merchantId` is used, but the rest of the app (shops, orders legacy path) uses `shopId`. No explicit `merchants` creation path in current code. De facto `merchantId === shopId`.
6. **Firestore rules are too permissive** — `merchant_whatsapp_accounts` and `whatsapp_messages` allow read/write for any authenticated user (not scoped to `merchantId === request.auth.uid`).
7. **AI analysis is keyword-based, not LLM** — works OK for French baseline but brittle. `analyze-text` route is in place to swap for Gemini later.
8. **No coexistence-specific UX** — the migration state exists (`setupStep: 'migration_required'`) but no guide shows the merchant what to actually do.

## Known Meta facts (verified 2026)

- **Coexistence is GA** : commerçant keeps his WhatsApp Business App + connects to Cloud API in parallel. History syncs between both apps. See [Meta docs](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users/).
- **Embedded Signup is web-only** — not compatible with in-app WebView, must open external browser on mobile.
- **14-day window** between Embedded Signup callback and `POST /{phone_number_id}/register`.
- **Hard migration path** (delete account → re-register) loses chat history. Coexistence is the preferred option.
- MasterShopPro must be a **Tech Provider** (not BSP) so Meta bills merchants directly.
- Meta Business Verification of the MasterShopPro entity is a prerequisite for App Review. Timeline: 3–15 business days.

## Git worktree pollution to clean up

On `2026-04-19`, an earlier agent created files in the worktree `.claude/worktrees/vigorous-chebyshev-176c7b/` that duplicate or conflict with what already exists in `main`:

- `lib/whatsapp-cloud.ts` — uses `META_APP_ID` etc. (wrong naming)
- `lib/whatsapp-accounts.ts` — duplicates `merchant-firestore.ts`
- `lib/whatsapp-crypto.ts` — not yet needed
- `lib/firebase-admin.ts` — duplicates `lib/server/firebase-admin.ts`
- `app/api/whatsapp/oauth/exchange/route.ts` — useful skeleton, but uses wrong env var names
- `app/api/whatsapp/send/route.ts` — useful skeleton, but uses wrong env var names
- `app/api/whatsapp/webhook/route.ts` — overwrites / conflicts with existing webhook
- `.env.whatsapp.example` — duplicates `.env.example`
- `firestore.rules` — conflicts with main rules
- `lib/types.ts` — added a `WhatsAppAccount` type that duplicates `MerchantWhatsappAccount`
- `package.json` — added `firebase-admin` (it's actually already installed in main)

These must be discarded or rewritten to use the existing conventions before any merge.

## How to evolve the WhatsApp integration from here

### Option A — BSP Route (RECOMMENDED for go-to-market speed)

Instead of building a full DIY Embedded Signup, integrate a BSP (Business Solution Provider) as the connection layer. This is the fastest path to zero-friction merchant onboarding.

**Recommended BSP: WATI or 360dialog**

1. Merchant clicks "Connecter WhatsApp" → redirected to WATI/360dialog OAuth flow.
2. Merchant connects their WhatsApp Business number in 5 minutes (BSP handles Meta verification).
3. BSP issues a webhook endpoint + credentials back to MasterShopPro via callback.
4. Store BSP credentials (not raw Meta tokens) in `merchant_whatsapp_accounts`.
5. All incoming webhooks from BSP are normalized through existing `processIncomingWhatsAppWebhook`.
6. Outbound messages go through BSP REST API (not direct Cloud API).

**Pricing impact:** 360dialog charges $49/mo per WABA + $0.005/message on top of Meta rates. Build this into STANDARD/PRO plan pricing.

### Option B — Direct Cloud API (for PRO/scale)

This remains the right approach for PRO merchants who want direct control. Follow the original 7-step plan:

1. Add a real Meta JS SDK init + `FB.login` with `config_id` (to be created in Meta Business Manager with "Allow WhatsApp Business app users" enabled → coexistence).
2. Capture the postMessage `WA_EMBEDDED_SIGNUP` event on the client, POST `{ code, waba_id, phone_number_id }` to a new server route.
3. Server route: exchange code → token (store encrypted per-merchant), subscribe WABA to app, register phone number with generated PIN.
4. Update `merchant_whatsapp_accounts` document with real `wabaId`, `phoneNumberId`, `businessAccountId`, `status: 'connected'`, `setupStep: 'connected'`.
5. On error classification → set `setupStep: 'migration_required'` and display the guided coexistence/migration UI.
6. Add `x-hub-signature-256` verification to webhook.
7. Build a proper outbound send API route that uses per-merchant token (fallback to env token for legacy numbers).

Do not touch the existing processing pipeline — it already works. Extend it.

---

# Design System (appliqué 2026-05-15)

## Tokens premium (globals.css + tailwind.config.ts)

```
--wa:           #1FB955  (vert WA premium, -8% saturation vs #25D366)
--wa-dark:      #0E5D32
--wa-soft:      #E6F8EE
--ink:          #0B1220  (bleu nuit chaud, remplace noir pur)
--ink-2:        #1F2A44
--orange:       #FF6A2C  (action / chaleur)
--sky:          #3F7BDC  (trust / business)
--app-bg:       #FBF7EF  (crème chaude — fond global)
--app-paper:    #F6F2EA
```

## Classes CSS clés

- `.premium-card` — carte blanche, hover translateY(-4px) + shadow-hi + border-glow wa
- `.premium-tilt` / `.premium-tilt-inner` — effet 3D léger perspective 1200px
- `.premium-zoom` — zoom image 1.04x au hover
- `.display-serif` — Instrument Serif italic, usage ponctuel sur les headlines "wow"
- `.btn-primary` — vert WA avec shimmer au hover
- `.btn-orange` — orange #FF6A2C
- `.btn-dark` — ink #0B1220
- `.pulse-dot` — indicateur live animé vert
- `.premium-chip` / `.premium-chip-wa` / `.premium-chip-orange` — badges premium
- `.float-soft` / `.float-soft-slow` — animation flottante décorative
- `.premium-mesh` — fond mesh radial-gradient hero
- `.ambient-panel` — panel blanc translucide backdrop-blur
- `.status-pill-live` / `.status-pill-hidden` — pills statut produit
- `prefers-reduced-motion` — coupe toutes les animations

## Règles d'usage design

- `display-serif` : headlines uniquement (h1 hero, prix display, titres "wow"). Jamais en corps de texte.
- Fond global : `var(--app-bg)` (#FBF7EF crème), pas blanc pur
- Hero admin sombre : `background: #0B1220` avec mesh radial-gradient
- Cartes produit : `premium-card premium-tilt overflow-hidden`
- Prix : `display-serif text-[28px]` ou plus grand
- CTAs primaires : `btn-primary` (WA) sur actions principales, `btn-orange` pour IA/photo pro
- Sidebar active : `background: linear-gradient(135deg,#1FB955,#0E5D32)`

## Pages redessinées (2026-05-15, sur main)

| Page | Changement principal |
|---|---|
| `app/globals.css` + `tailwind.config.ts` | Foundation complète (tokens, classes, animations) |
| `app/page.tsx` | Landing simplifiée : Hero → 3 features (Brochure IA / Commandes / Boutique) → CTA final |
| `app/(admin)/admin/layout.tsx` | Sidebar WA-accented, header blur, bottom nav wa-dark |
| `app/(admin)/admin/dashboard/page.tsx` | Hero sombre #0B1220 + KPI strip 4 cellules |
| `app/(admin)/admin/products/page.tsx` | Hero sombre + stats strip + premium-card grid |
| `app/(admin)/admin/subscription/page.tsx` | premium-card plans, STARTER "Le plus populaire" display-serif prix |
| `app/(auth)/login/page.tsx` | Panneau branding dark mesh + display-serif |
| `app/(auth)/register/page.tsx` | Header dark mesh + progress bar wa |
| `app/[shop]/page.tsx` | Hero gradient sombre, filter strip sticky, trust footer 4 colonnes |

---

# Product Flow Engineering — Propositions validées (2026-05-15)

Ces propositions ont été validées avec William. À implémenter par ordre de priorité.

## P1 — Smart Category Chips (IA + presets) [PRIORITÉ ABSOLUE]

**Problème** : la catégorie obligatoire bloque le flow de création produit.

**Solution** :
1. L'IA analyse la photo → suggère 1 catégorie automatiquement
2. 8 chips pré-remplis pour marchés africains : `Vêtements` `Cosmétiques` `Alimentaire` `Électronique` `Maison` `Artisanat` `Accessoires` `Autre`
3. 1 tap = catégorie assignée, zéro frappe clavier
4. Catégorie devient optionnelle → fallback `Autre` si skippée

**Fichier** : `app/(admin)/admin/products/page.tsx` — remplacer le `<select>` catégorie dans le modal produit

## P2 — Pop-up "Que faire ?" post-save produit [PRIORITÉ ABSOLUE]

**Déclencheur** : après `handleSave` réussi, au lieu de fermer le modal immédiatement

**Bottom sheet avec 4 actions** :
```
✅  Produit enregistré ! — [Nom produit] · [Prix]
─────────────────────────────────────────
✨  Générer la brochure (3 variantes)
💬  Partager sur WhatsApp
🌐  Voir dans la boutique
📋  Copier le lien produit
```

**Fichier** : `app/(admin)/admin/products/page.tsx` — ajouter state `showPostSave` + composant `PostSaveSheet`

## P3 — 3 variantes de brochure [DIFFÉRENCIATEUR FORT]

Après Studio Photo, proposer 3 templates rendus live (canvas ou CSS) :

| Template | Format | Usage |
|---|---|---|
| **Fiche Pro** | Portrait · fond blanc | DM WhatsApp |
| **Story** | Carré · image bg + overlay prix | Story WA / Instagram |
| **Catalogue** | Paysage · image gauche + détails droite | Groupe WA / impression |

**Fichier** : `app/api/product-brochure/route.ts` + nouveau composant `BrocureVariantPicker`

## P4 — Boutique publique toujours visible [VISIBILITÉ]

**Floating Share Bar** dans l'admin (au-dessus de la bottom nav mobile) :
- Aperçu miniature boutique
- Bouton "Copier le lien" (1 tap)
- Bouton "Partager sur WhatsApp"
- QR code tap-to-download

**Fichier** : `app/(admin)/admin/layout.tsx` — ajouter `<ShopShareBar />` au-dessus de `<nav className="bottom-nav">`

## P5 — Mode Quick Sell [FLOW EXPRESS]

Flow alternatif pour commerçante pressée :
```
📸 Photo → 🤖 IA remplit tout → 👀 Confirmation rapide → ⚡ Bottom sheet "Que faire ?"
```
Pas de long formulaire. 30 secondes du début à la brochure partagée.

**À créer** : bouton "Quick Sell" dans le header de `/admin/products`, flow dédié en bottom sheet progressif

---

## Next Features to Build (in order)

### 1. Mobile Money Payment Links (URGENT)
- Integrate MTN MoMo Collection API and Orange Money Web Payment API.
- When a merchant confirms an order, generate a payment link (MTN MoMo or Orange Money) sendable via WhatsApp.
- Track payment status via webhook → auto-update `orders.paymentStatus`.
- Reference: `https://momo.mtn.com/api/` and `https://developer.orange.com/apis/om-webpay`
- Store credentials per merchant in Firestore (`merchant_payment_accounts`).
- Currency: XAF native throughout.

### 2. Improved AI Order Detection
- Replace keyword heuristics in `lib/whatsapp-analysis.ts` with a Gemini call.
- Prompt must understand Cameroonian French, pidgin, and common local slang (e.g. "je veux prendre", "on m'avait dit", "c'est combien pour").
- Fall back to heuristics if Gemini quota exceeded.
- Target: confidence ≥ 0.85 for order intent, reducing missed orders.

### 3. Voice Message Parsing (MEDIUM TERM)
- WhatsApp Cloud API delivers audio messages as media URLs.
- Transcribe using Gemini audio API or Whisper.
- Feed transcript into existing `analyzeIncomingMessage` pipeline.
- This is a significant retention differentiator — no competitor does this for African markets.

### 4. TikTok/Instagram DM Capture (MEDIUM TERM)
- Build a lightweight "capture inbox" where merchants can manually paste DM content or screenshots.
- AI extracts order intent and creates draft order.
- Long-term: explore TikTok for Business API when available in Cameroon.
