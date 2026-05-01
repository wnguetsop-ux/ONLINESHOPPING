# MasterShopPro v3 — Studio IA Vendeur

> **Statut :** plan d'évolution validé le 2026-04-30
> **Décisions cadres :** (1) coupe nette de l'API WhatsApp Business, (2) `[shop]` conservé + nouveau format viral `/p/[id]`, (3) IA incluse dans les plans (pas de crédits séparés).

---

## 1. Nouveau positionnement

**MasterShopPro = Studio IA pour vendeurs africains.**

Promesse en une phrase : *« Photographie tes produits avec ton téléphone — l'IA fait le reste : photo pro, vidéo, fiche, message WhatsApp, lien à partager. »*

Cible : commerçant·e individuel·le au Cameroun et en Afrique francophone, vend sur WhatsApp / Instagram / TikTok / Facebook, peu de littératie digitale, smartphone Android, paie en MoMo.

Différenciateur : aucun concurrent local ne combine **génération photo + vidéo + texte FR/EN/pidgin + partage social en 1 flux**.

---

## 2. Parcours commerçant — 4 écrans

1. **Écran 1 — Photo** : ouverture caméra, le commerçant prend 1 à 5 photos du produit (multi-angles).
2. **Écran 2 — Génération IA (30s)** : Gemini analyse → renvoie titre, description FR, description EN/pidgin, prix suggéré (benchmark catégorie), photo fond blanc, photo lifestyle, mini-vidéo verticale 9:16. Le commerçant édite si besoin.
3. **Écran 3 — Publication** : 1 clic → produit publié dans sa boutique `[shop]/`, lien viral `/p/[id]` généré.
4. **Écran 4 — Partage** : boutons « Envoyer sur WhatsApp », « TikTok », « Instagram », « Copier le message ». Le message intègre le lien `/p/[id]` et un texte rédigé par l'IA (call-to-action, emojis, prix). Tout part du WhatsApp / Instagram **personnel** du commerçant via `wa.me` / liens `intent://`.

---

## 3. Architecture

### Fichiers à créer

| Fichier | Rôle |
|---|---|
| `app/(admin)/admin/studio/page.tsx` | Nouveau parcours studio IA (les 4 écrans) |
| `app/(admin)/admin/studio/components/CameraCapture.tsx` | Capture multi-photo |
| `app/(admin)/admin/studio/components/AIPreview.tsx` | Aperçu + édition des sorties IA |
| `app/(admin)/admin/studio/components/SharePanel.tsx` | Boutons partage WhatsApp/TikTok/IG/copier |
| `app/p/[id]/page.tsx` | Page produit virale (mobile-first, lien partageable) |
| `app/p/[id]/opengraph-image.tsx` | OG image dynamique pour aperçu social |
| `app/api/generate-listing/route.ts` | Endpoint qui orchestre Gemini : titre + descriptions + prix + photo lifestyle |
| `app/api/generate-video/route.ts` | Endpoint vidéo verticale (provider à choisir : Veo / Runway / Sora — voir §6) |
| `lib/share.ts` | Helpers `wa.me`, deep-links Instagram/TikTok, presse-papier |

### Fichiers à modifier

| Fichier | Modification |
|---|---|
| `app/(admin)/admin/layout.tsx` | Mettre « Studio IA » en entrée principale du menu (avant Produits) |
| `app/(admin)/admin/page.tsx` (dashboard) | Ajouter widget « Compteur générations IA du mois » + CTA Studio |
| `app/[shop]/page.tsx` | Garder, mais lier chaque produit à son `/p/[id]` pour partage rapide |
| `lib/types.ts` | Ajouter sur `Product` : `aiGenerated: boolean`, `aiAssets: { whiteBg?, lifestyle?, video? }`, `viralSlug: string` |
| `lib/firestore.ts` | Helpers de lecture/écriture des nouveaux champs + compteur `aiGenerationsThisMonth` sur `Shop` |
| `lib/whatsapp.ts` | Garder uniquement Phase 1 (`wa.me`). Supprimer toute mention Phase 2 / API Meta |
| `lib/gemini.ts` | Ajouter `generateListing()` qui produit le bundle complet (titre+desc+prix+prompt image) |
| `firestore.rules` | Règle pour `viralSlug` (lecture publique), incrémentation atomique du compteur IA |
| `CLAUDE.md` | Section 4 mise à jour (retirer Phase 2 WhatsApp), ajouter "Studio IA" et endpoints `generate-listing`/`generate-video` |
| `GUIDE_AMELIORATIONS.md` | Marquer la section WhatsApp Phase 2 comme dépréciée, ajouter section Studio IA |

### Fichiers à supprimer

**Aucun (révision 2026-05-01).** Décision : on **ne supprime rien**. On préserve l'optionalité.
- L'option API WhatsApp Phase 2 reste dans `lib/whatsapp.ts` et `merchant_whatsapp_accounts` comme **dormant** (pas mise en avant marketing, pas développée, mais le câblage reste).
- `stripe-webhook` reste : potentiellement utile pour le module diaspora (paiements EUR via Stripe, voir Phase 3 ci-dessous).

### Plans (inchangés sur la structure, contenu mis à jour)

| Plan | Produits | Commandes/mois | **Générations IA / mois** | Vidéo IA |
|---|---|---|---|---|
| FREE | 20 | 20 | 10 | 0 |
| STARTER | 50 | 100 | 100 | 10 |
| PRO | illimité | illimité | 1000 | 100 |

Compteur visible sur le dashboard ; quand ≥ 80% → toast « Passez au plan supérieur ».

---

## 4. Mobile money & livraison (préparation, hors v3)

Pour ne pas perdre l'élan, on **prépare** mais ne **livre pas** dans v3 :
- Schéma `Order.paymentProvider: 'mtn_momo' | 'orange_money' | 'cash'` ajouté dès maintenant.
- Stub `lib/payments.ts` avec interface unifiée (à brancher sur Campay ou Vuma au sprint suivant).
- Pas d'intégration livreur (Bee/Yango) en v3 — réservé v3.1.

---

## 5. Phases d'exécution

| Sprint | Livrable | Durée estimée |
|---|---|---|
| **S1 — Coupe** | Suppression `merchant_whatsapp_accounts`, `stripe-webhook` (si validé), nettoyage `lib/whatsapp.ts`, mise à jour `CLAUDE.md` + `GUIDE_AMELIORATIONS.md` | 0.5 jour |
| **S2 — Page virale** | `app/p/[id]/page.tsx` + OG image + lien depuis `[shop]` | 1 jour |
| **S3 — Backend IA** | `app/api/generate-listing` (Gemini bundle) + extension `lib/gemini.ts` + champs `Product.aiAssets` | 1.5 jours |
| **S4 — Studio UI** | `app/(admin)/admin/studio/` 4 écrans, intégration capture + preview + edit | 2 jours |
| **S5 — Partage** | `lib/share.ts` + `SharePanel`, copie messages, deep-links | 1 jour |
| **S6 — Vidéo IA** | Choix provider, intégration `generate-video`, gating par plan | 1.5 jours |
| **S7 — Compteurs & plans** | Champ `Shop.aiGenerationsThisMonth`, garde-fou serveur, UI compteur, upsell | 1 jour |
| **S8 — Polish & test terrain** | Test sur 3 vrais commerçants, ajustements | 1 jour |

Total ≈ **9 à 10 jours** pour un dev solo.

---

## 6. Décisions techniques à trancher avant S6

1. **Provider vidéo IA** : Google Veo (cohérent avec stack Gemini), Runway, Sora API ? → benchmark coût + qualité avant S6.
2. **Génération photo lifestyle** : Gemini 1.5 Flash supporte la génération d'image ? Sinon Imagen 3 / Flux. → POC en S3.
3. **Langues locales** : commencer FR + EN seulement en v3, pidgin/ewondo en v3.1 (qualité Gemini à valider).
4. **Hébergement vidéo** : Firebase Storage suffit pour MVP (limite ~10 Mo/clip).

---

## 7. Mise à jour CLAUDE.md (résumé)

- §1 : ajouter ligne « Positionnement v3 : Studio IA pour vendeurs africains ».
- §2 : ajouter `app/(admin)/admin/studio/`, `app/p/[id]/`.
- §4 : retirer « Phase 2 = Meta API ». Remplacer par : *« WhatsApp uniquement via liens wa.me — pas d'API Business. »*
- §4 : ajouter Studio IA (Gemini : analyse + génération bundle complet titre/desc/photo/vidéo).
- §7 : ajouter règle « ne jamais réintroduire l'API WhatsApp Business — décision stratégique du 2026-04-30 ».

---

## 8. Vérification (fin v3)

1. Un commerçant sans compte ouvre `/register`, crée sa boutique en < 2 min.
2. Il ouvre Studio IA, photographie un produit, reçoit le bundle IA en < 30s.
3. Il publie, copie le lien `/p/[id]`, l'ouvre dans son navigateur — la fiche s'affiche, OG image correcte sur aperçu WhatsApp.
4. Il clique « Envoyer sur WhatsApp » → son WhatsApp perso s'ouvre avec le message + lien pré-remplis.
5. Sa boutique `[shop]/` montre le produit avec les nouveaux assets.
6. Le compteur IA s'incrémente sur le dashboard.
7. Aucune trace de `merchant_whatsapp_accounts`, `stripe-webhook`, ou Phase 2 dans le code.
8. `npm run build` passe sans erreur, `./deploy.ps1` déploie sans alerte.

---

## 9. Hors-scope v3 (pour plus tard)

- Agent vocal IA en langues locales (Pivot B)
- Intégration livreurs Bee/Yango (Pivot D)
- Encaissement MoMo automatisé via Campay (préparé mais pas livré)
- Agentic-ready storefront (flux produit machine-readable pour ChatGPT/Google) — à reprendre quand le marché bouge
