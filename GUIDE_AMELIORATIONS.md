# 📦 ShopMaster — Guide des Améliorations v2.0

## 🎯 Résumé des modifications

---

## 1. 🛍️ Page Boutique E-commerce (app/[shop]/page.tsx)

### Nouvelles fonctionnalités :
- **Filtres avancés** : Tri par prix ↑↓, nom A-Z, stock élevé
- **Filtre par fourchette de prix** (min / max)
- **Filtre stock dispo seulement**
- **Vue grille ↔ liste** — boutons switch
- **Pills de catégories** sticky avec scroll horizontal
- **Aperçu rapide (Quick View)** — modal avec photo, description, caractéristiques
- **Bouton favori ❤️** — liste de souhaits locale
- **Badges dynamiques** : "⭐ Vedette", "🔥 Derniers 3!", "Épuisé"
- **Bouton +/- quantité** directement sur la carte
- **Barre sticky du panier** (mobile) — visible quand panier non vide
- **Badges de confiance** : Livraison rapide, Paiement sécurisé, Retours faciles
- **Animation** au clic "Ajouter au panier"
- **Défilement horizontal** des catégories sur mobile

---

## 2. 📷 Page Produits Admin (app/(admin)/admin/products/page.tsx)

### Caméra + IA automatique :
- **Bouton "📷 Filmer + IA"** — ouvre la caméra directement
- Utilise `getUserMedia` avec préférence caméra arrière
- **Bouton de capture** (rond, style iOS)
- **Analyse IA automatique** avec Claude API après chaque capture
- Remplissage automatique de : Nom, Description, Caractéristiques, Catégorie, Marque
- **Import photo** depuis la galerie avec analyse IA aussi
- **Upload Firebase Storage** — la photo est uploadée dans `shops/{shopId}/products/`
- Champ "Caractéristiques techniques" (nouveau) — mode monospace
- Indicateur "✨ Généré par IA" sur les champs remplis automatiquement

### Configuration requise :
```
⚠️ Important : L'API Anthropic est appelée depuis le navigateur.
Pour la production, vous devez créer une API route Next.js 
qui proxifie l'appel à l'API Anthropic (sécurité clé API).
```

---

## 3. 📊 Dashboard Admin (app/(admin)/admin/dashboard/page.tsx)

### Graphiques Chart.js :
- **Graphique linéaire** : Évolution CA + Bénéfice sur 7 derniers jours
- **Graphique donut** : Répartition des commandes par statut
- **Graphique en barres** : CA par catégorie de produits

### Chargement dynamique :
Chart.js est chargé depuis CDN (cloudflare) — pas besoin de l'installer.

---

## 4. ✅ Checkout (app/[shop]/checkout/page.tsx)

### Confirmation WhatsApp automatique :
- Après validation, WhatsApp s'ouvre **automatiquement** avec message pré-rempli
- Message inclut : nom client, téléphone, mode livraison, adresse, total
- Écran de succès redesigné avec fond vert, meilleure UX

---

## 5. 📱 PWA & Play Store (globals.css + layout.tsx)

### Safe areas :
```css
/* Padding dynamique pour notch / barre de navigation Android */
padding-top: env(safe-area-inset-top, 0px);
padding-bottom: env(safe-area-inset-bottom, 0px);
```
- Header admin et boutique adaptés au safe area
- Barre panier sticky avec padding safe-area-bottom
- Footer avec safe area bottom

### Performance :
- `overscroll-behavior-y: none` → Évite le bounce iOS
- `-webkit-tap-highlight-color: transparent` → Retire les flashs au tap
- `min-height: 36px` sur tous les boutons → Meilleure cible tactile

---

## 6. 🧭 Navigation Admin ↔ Boutique

**L'admin et la boutique sont sur le même site** mais des URLs différentes :
- Admin : `votredomaine.com/admin/dashboard`
- Boutique : `votredomaine.com/votre-slug`

Dans le sidebar admin, le bouton "Voir ma boutique" ouvre dans un nouvel onglet.

---

## 7. 🔥 Firebase Storage

Firebase Storage est déjà configuré dans `lib/firebase.ts`.
Les photos sont stockées dans : `shops/{shopId}/products/{timestamp}.jpg`

**Règles Firebase Storage à configurer** :
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /shops/{shopId}/products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 8. 🚀 Pour publier sur Play Store

Utiliser **Bubblewrap** ou **PWABuilder** (pwabuilder.com) :

1. Aller sur https://www.pwabuilder.com
2. Entrer l'URL de votre site
3. Générer le fichier APK/AAB
4. Publier sur Google Play

Les safe areas sont déjà gérées. Le manifest.json est configuré.

---

## 9. ⚡ Résolution de la lenteur de navigation

Causes possibles et solutions :
1. **Appels Firestore multiples** → Utiliser `Promise.all()` ✅ (déjà fait)
2. **Images lentes** → Ajouter `loading="lazy"` aux images
3. **Service Worker** → Le SW en cache accélère les visites suivantes
4. **next/image** → Remplacer les `<img>` par `<Image>` de Next.js pour optimisation auto

---

## 10. 📞 WhatsApp configuré : 0039 3299639430

Ce numéro est à entrer dans Paramètres → Boutique → WhatsApp.

---

## ❓ Questions fréquentes

**Q: Comment activer l'IA sur les produits ?**
R: Elle s'active automatiquement quand vous filmez ou uploadez une photo. Elle utilise l'API Claude.

**Q: Les commandes se confirment-elles automatiquement ?**
R: La commande est d'abord en statut "En attente". WhatsApp s'ouvre automatiquement pour que le client confirme. L'admin peut ensuite changer le statut dans "Commandes".

**Q: Dois-je installer Chart.js ?**
R: Non, il est chargé depuis CDN automatiquement.
