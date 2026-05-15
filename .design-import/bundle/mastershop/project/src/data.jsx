// Mock data — francophone African retail context
const MERCHANT = {
  shopName: "Sankofa Atelier",
  ownerName: "Aminata Diop",
  ownerInitials: "AD",
  city: "Dakar",
  currency: "FCFA",
};

const CONVERSATIONS = [
  { id:"c1", name:"Mariama Ba", initials:"MB", phone:"+221 77 412 88 09", channel:"whatsapp", unread:2, last:"Bonjour, le boubou en bazin est-il dispo en taille L ?", time:"il y a 3 min", online:true, avatar:"#f472b6", typing:false },
  { id:"c2", name:"Ousmane Faye", initials:"OF", phone:"+221 76 901 23 45", channel:"instagram", unread:0, last:"Merci beaucoup, je passe demain 🙏", time:"il y a 12 min", online:true, avatar:"#60a5fa", typing:false },
  { id:"c3", name:"Ndeye Coumba", initials:"NC", phone:"+221 78 555 14 02", channel:"whatsapp", unread:5, last:"Vous livrez à Thiès ?", time:"il y a 28 min", online:false, avatar:"#34d399", typing:true },
  { id:"c4", name:"Ibrahima Sow", initials:"IS", phone:"+221 70 200 99 31", channel:"messenger", unread:0, last:"OK reçu, paiement Wave envoyé", time:"il y a 1 h", online:false, avatar:"#fbbf24" },
  { id:"c5", name:"Awa Niang", initials:"AN", phone:"+221 77 880 12 33", channel:"whatsapp", unread:0, last:"Une photo de la robe en jaune SVP", time:"il y a 2 h", online:false, avatar:"#fb7185" },
  { id:"c6", name:"Modou Kane", initials:"MK", phone:"+221 76 612 04 78", channel:"whatsapp", unread:1, last:"Vous avez le sac en cuir marron ?", time:"il y a 4 h", online:true, avatar:"#a78bfa" },
  { id:"c7", name:"Fatou Sarr", initials:"FS", phone:"+221 78 332 67 19", channel:"instagram", unread:0, last:"Parfait, à demain au magasin !", time:"hier", online:false, avatar:"#f59e0b" },
  { id:"c8", name:"Lamine Diallo", initials:"LD", phone:"+221 77 145 20 88", channel:"whatsapp", unread:0, last:"Combien pour l'expédition à Saint-Louis ?", time:"hier", online:false, avatar:"#22d3ee" },
];

const MESSAGES = {
  c1: [
    { from:"them", text:"Bonjour 👋", time:"10:14", date:"Aujourd'hui" },
    { from:"them", text:"Le boubou en bazin riche que j'ai vu sur votre boutique, vous l'avez en taille L ?", time:"10:14" },
    { from:"me", text:"Bonjour Mariama ! Oui le modèle « Linguère » est dispo en L 🌿", time:"10:18" },
    { from:"me", text:"Voici la photo en lumière naturelle :", time:"10:19" },
    { from:"me", type:"image", url:"product-photo", time:"10:19" },
    { from:"them", text:"Magnifique 😍 c'est combien tout compris ?", time:"10:24" },
    { from:"me", text:"45 000 FCFA, livraison Dakar offerte au-dessus de 30 000.", time:"10:25", read:true },
    { from:"them", text:"Bonjour, le boubou en bazin est-il dispo en taille L ?", time:"10:38" },
  ],
  c3: [
    { from:"them", text:"Bonsoir, j'aimerais commander 2 ensembles", time:"19:42", date:"Aujourd'hui" },
    { from:"me", text:"Bonsoir Ndeye, avec plaisir 🙏", time:"19:44", read:true },
    { from:"them", text:"Vous livrez à Thiès ?", time:"19:46" },
  ],
};

const ORDERS = [
  { id:"#MS-2418", customer:"Mariama Ba", initials:"MB", color:"#f472b6", items:3, total:78500, status:"a-preparer", payment:"orange-money", channel:"whatsapp", city:"Dakar", time:"il y a 8 min" },
  { id:"#MS-2417", customer:"Ousmane Faye", initials:"OF", color:"#60a5fa", items:1, total:24000, status:"expediee", payment:"wave", channel:"instagram", city:"Pikine", time:"il y a 32 min" },
  { id:"#MS-2416", customer:"Ndeye Coumba", initials:"NC", color:"#34d399", items:2, total:52000, status:"a-preparer", payment:"momo", channel:"whatsapp", city:"Thiès", time:"il y a 1 h" },
  { id:"#MS-2415", customer:"Ibrahima Sow", initials:"IS", color:"#fbbf24", items:5, total:135000, status:"livree", payment:"wave", channel:"messenger", city:"Dakar", time:"il y a 2 h" },
  { id:"#MS-2414", customer:"Awa Niang", initials:"AN", color:"#fb7185", items:1, total:18500, status:"en-attente", payment:"especes", channel:"whatsapp", city:"Rufisque", time:"il y a 4 h" },
  { id:"#MS-2413", customer:"Modou Kane", initials:"MK", color:"#a78bfa", items:2, total:67000, status:"expediee", payment:"orange-money", channel:"whatsapp", city:"Saint-Louis", time:"il y a 6 h" },
  { id:"#MS-2412", customer:"Fatou Sarr", initials:"FS", color:"#f59e0b", items:4, total:102000, status:"livree", payment:"wave", channel:"instagram", city:"Dakar", time:"hier" },
  { id:"#MS-2411", customer:"Lamine Diallo", initials:"LD", color:"#22d3ee", items:1, total:35500, status:"annulee", payment:"momo", channel:"whatsapp", city:"Saint-Louis", time:"hier" },
];

const STATUS_LABEL = {
  "en-attente": { fr:"En attente", chip:"chip-warn" },
  "a-preparer": { fr:"À préparer", chip:"chip-accent" },
  "expediee": { fr:"Expédiée", chip:"chip-info" },
  "livree": { fr:"Livrée", chip:"chip-success" },
  "annulee": { fr:"Annulée", chip:"chip-danger" },
};

const PAYMENT_LABEL = {
  "orange-money": { fr:"Orange Money", color:"#f97316" },
  "wave": { fr:"Wave", color:"#22d3ee" },
  "momo": { fr:"MTN MoMo", color:"#facc15" },
  "especes": { fr:"Espèces", color:"#a8a8b3" },
  "carte": { fr:"Carte bancaire", color:"#a78bfa" },
};

const PRODUCTS = [
  { id:"p1", name:"Boubou Linguère", category:"Mode femme", price:45000, stock:12, status:"actif", img:"linen", tag:"Bestseller", colors:["#1e40af","#fbbf24","#fb7185"] },
  { id:"p2", name:"Sac en cuir tressé", category:"Maroquinerie", price:32500, stock:5, status:"actif", img:"leather", tag:null, colors:["#78350f","#000000"] },
  { id:"p3", name:"Boucles d'oreilles Baobab", category:"Bijoux", price:9500, stock:42, status:"actif", img:"jewelry", tag:"Nouveau", colors:["#fbbf24","#a78bfa"] },
  { id:"p4", name:"Chemise Wax homme", category:"Mode homme", price:18000, stock:0, status:"rupture", img:"wax", tag:null, colors:["#0ea5e9","#dc2626","#16a34a"] },
  { id:"p5", name:"Ensemble Bazin riche", category:"Mode femme", price:78000, stock:7, status:"actif", img:"bazin", tag:"Premium", colors:["#fcd34d","#f3f4f6","#1e3a8a"] },
  { id:"p6", name:"Tongs en cuir", category:"Chaussures", price:6500, stock:24, status:"actif", img:"sandal", tag:null, colors:["#78350f","#000000","#92400e"] },
  { id:"p7", name:"Foulard en soie", category:"Accessoires", price:14000, stock:18, status:"actif", img:"silk", tag:null, colors:["#fb7185","#fbbf24","#34d399"] },
  { id:"p8", name:"Robe de soirée", category:"Mode femme", price:62000, stock:3, status:"actif", img:"dress", tag:"Édition limitée", colors:["#dc2626","#000000"] },
  { id:"p9", name:"Coussin Mudcloth", category:"Maison", price:12500, stock:15, status:"actif", img:"mudcloth", tag:null, colors:["#fef3c7","#451a03"] },
  { id:"p10", name:"Théière en céramique", category:"Maison", price:22000, stock:8, status:"actif", img:"teapot", tag:null, colors:["#fbbf24","#0c0a09"] },
  { id:"p11", name:"Casquette brodée", category:"Accessoires", price:8000, stock:30, status:"actif", img:"cap", tag:null, colors:["#000000","#dc2626"] },
  { id:"p12", name:"Sandales en raphia", category:"Chaussures", price:11000, stock:12, status:"actif", img:"raffia", tag:null, colors:["#fbbf24","#92400e"] },
];

const CUSTOMERS = [
  { id:"u1", name:"Mariama Ba", initials:"MB", color:"#f472b6", phone:"+221 77 412 88 09", orders:8, spent:312000, lastOrder:"il y a 8 min", tier:"VIP" },
  { id:"u2", name:"Ousmane Faye", initials:"OF", color:"#60a5fa", phone:"+221 76 901 23 45", orders:3, spent:78000, lastOrder:"il y a 32 min", tier:"Régulier" },
  { id:"u3", name:"Ndeye Coumba", initials:"NC", color:"#34d399", phone:"+221 78 555 14 02", orders:5, spent:152000, lastOrder:"il y a 1 h", tier:"Régulier" },
  { id:"u4", name:"Ibrahima Sow", initials:"IS", color:"#fbbf24", phone:"+221 70 200 99 31", orders:12, spent:485000, lastOrder:"il y a 2 h", tier:"VIP" },
  { id:"u5", name:"Awa Niang", initials:"AN", color:"#fb7185", phone:"+221 77 880 12 33", orders:1, spent:18500, lastOrder:"il y a 4 h", tier:"Nouveau" },
  { id:"u6", name:"Modou Kane", initials:"MK", color:"#a78bfa", phone:"+221 76 612 04 78", orders:4, spent:128000, lastOrder:"il y a 6 h", tier:"Régulier" },
  { id:"u7", name:"Fatou Sarr", initials:"FS", color:"#f59e0b", phone:"+221 78 332 67 19", orders:7, spent:240000, lastOrder:"hier", tier:"VIP" },
  { id:"u8", name:"Lamine Diallo", initials:"LD", color:"#22d3ee", phone:"+221 77 145 20 88", orders:2, spent:55000, lastOrder:"hier", tier:"Régulier" },
];

const formatXOF = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

window.MERCHANT = MERCHANT;
window.CONVERSATIONS = CONVERSATIONS;
window.MESSAGES = MESSAGES;
window.ORDERS = ORDERS;
window.STATUS_LABEL = STATUS_LABEL;
window.PAYMENT_LABEL = PAYMENT_LABEL;
window.PRODUCTS = PRODUCTS;
window.CUSTOMERS = CUSTOMERS;
window.formatXOF = formatXOF;
