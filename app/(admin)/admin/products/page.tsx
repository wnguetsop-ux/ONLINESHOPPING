'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit, Trash2, Package, Loader2, X, Star, Camera, Sparkles,
  AlertTriangle, Crown, Image as ImageIcon, StopCircle, ZoomIn, ZoomOut,
  RotateCw, Check, Wand2, Sun, Contrast, Zap, Move, SlidersHorizontal,
  RefreshCw, Eye, Copy, Download, Share2, FileText, MessageCircle, ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, createCategory, checkShopLimits } from '@/lib/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Product, Category, PLANS } from '@/lib/types';
import { formatPrice, calculateMargin, getWhatsAppLink } from '@/lib/utils';

type PhotoMode = 'none' | 'camera' | 'crop' | 'done';

type ProductBrochureCopy = {
  headline: string;
  subheadline: string;
  badge: string;
  bullets: string[];
  cta: string;
  whatsappCaption: string;
  source?: string;
};

interface StudioSettings {
  brightness: number; contrast: number; saturation: number;
  sharpness: number; warmth: number; bgWhite: boolean;
}
const DEFAULT_STUDIO: StudioSettings = { brightness:0, contrast:0, saturation:0, sharpness:0, warmth:0, bgWhite:false };
const FRAME = 300;

function buildFilter(s: StudioSettings): string {
  const bri = 1 + s.brightness/100;
  const con = 1 + s.contrast/100;
  const sat = 1 + s.saturation/100;
  const warm = s.warmth>=0 ? `sepia(${s.warmth/100*0.4})` : `hue-rotate(${Math.abs(s.warmth)*0.8}deg)`;
  return `brightness(${bri}) contrast(${con}) saturate(${sat}) ${warm}`;
}

async function applyStudioToCanvas(imgSrc: string, settings: StudioSettings, size=1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = settings.bgWhite ? '#FFFFFF' : '#f8f8f8';
      ctx.fillRect(0, 0, size, size);
      ctx.filter = buildFilter(settings);
      const scale = Math.min(size/img.width, size/img.height)*0.92;
      const sw = img.width*scale, sh = img.height*scale;
      ctx.drawImage(img, (size-sw)/2, (size-sh)/2, sw, sh);
      ctx.filter = 'none';
      if (settings.sharpness > 0) {
        const imageData = ctx.getImageData(0,0,size,size);
        const d = imageData.data;
        const strength = settings.sharpness/100*0.8;
        const copy = new Uint8ClampedArray(d);
        for (let y=1;y<size-1;y++) for (let x=1;x<size-1;x++) for (let c=0;c<3;c++) {
          const i=(y*size+x)*4+c;
          const lap = -copy[(y-1)*size*4+x*4+c]-copy[y*size*4+(x-1)*4+c]+4*copy[i]-copy[y*size*4+(x+1)*4+c]-copy[(y+1)*size*4+x*4+c];
          d[i]=Math.min(255,Math.max(0,copy[i]+strength*lap));
        }
        ctx.putImageData(imageData,0,0);
      }
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob')), 'image/jpeg', 0.92);
    };
    img.onerror = reject;
    img.src = imgSrc;
  });
}

function StudioSlider({ label, icon: Icon, value, min, max, onChange, color='#16a34a' }: {
  label: string; icon: any; value: number; min: number; max: number; onChange: (v:number)=>void; color?: string;
}) {
  const pct = ((value-min)/(max-min))*100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-gray-500" /><span className="text-xs font-semibold text-gray-600">{label}</span></div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-gray-500 w-8 text-right">{value>0?`+${value}`:value}</span>
          {value!==0&&<button type="button" onClick={()=>onChange(0)} className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center hover:bg-red-100"><X className="w-2.5 h-2.5 text-gray-500"/></button>}
        </div>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{width:`${pct}%`,background:`linear-gradient(to right,${color}88,${color})`}}/>
        </div>
        <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"/>
        <div className="absolute w-4 h-4 rounded-full bg-white shadow-md border-2 pointer-events-none transition-all" style={{left:`calc(${pct}% - 8px)`,borderColor:color}}/>
      </div>
    </div>
  );
}

function defaultBrochure(product: Product, shopName = 'MasterShopPro', currency = 'FCFA', shopSlug = ''): ProductBrochureCopy {
  const price = product.sellingPrice > 0 ? `${product.sellingPrice.toLocaleString('fr-FR')} ${currency}` : 'Prix disponible';
  const shopUrl = shopSlug ? `${typeof window !== 'undefined' ? window.location.origin : 'https://mastershoppro.com'}/${shopSlug}` : '';
  const caption = [
    `🛍️ *${product.name}*`,
    ``,
    `💰 Prix : *${price}*`,
    product.stock > 0 ? `✅ Disponible maintenant` : `⚠️ Stock limité`,
    product.description ? `\n📝 ${product.description}` : '',
    ``,
    shopUrl ? `📦 Voir tous les produits et commander :\n👉 ${shopUrl}` : `📦 Boutique : ${shopName}`,
    ``,
    `💬 Réponds à ce message pour commander !`,
  ].filter(l => l !== null && l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n').trim();

  return {
    headline: `${product.name} pret a commander`,
    subheadline: product.description || `Un produit clair, bien presente, facile a commander chez ${shopName}.`,
    badge: product.stock > 0 ? 'Disponible maintenant' : 'A verifier',
    bullets: ['Prix clair', 'Commande WhatsApp simple', 'Boutique professionnelle'],
    cta: `Commander a ${price}`,
    whatsappCaption: caption,
    source: 'local',
  };
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 4) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((l, idx) => ctx.fillText(l, x, y + idx * lineHeight));
  return y + lines.length * lineHeight;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCanvasPill(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, bg: string, fg = '#ffffff') {
  ctx.font = '800 24px Arial';
  const width = Math.min(420, Math.max(150, ctx.measureText(text).width + 52));
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, width, 48, 24);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.fillText(text, x + 26, y + 31);
  return width;
}

function drawCanvasCard(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, title: string, color = '#0645a8') {
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x, y, width, height, 18);
  ctx.fill();
  ctx.strokeStyle = '#b9d3ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, width, 44, 18);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 21px Arial';
  ctx.fillText(title.toUpperCase().slice(0, 32), x + 22, y + 30);
}

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getSpecRows(product: Product) {
  const rows = (product.specifications || '')
    .split(/\n|;/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [label, ...rest] = row.split(/:|-/);
      return {
        label: (label || 'Detail').trim(),
        value: rest.join(' ').trim() || row,
      };
    });

  return rows.length ? rows.slice(0, 8) : [
    { label: 'Categorie', value: product.category || 'Produit boutique' },
    { label: 'Marque', value: product.brand || 'A confirmer' },
    { label: 'Disponibilite', value: product.stock > 0 ? 'En stock' : 'A confirmer' },
    { label: 'Commande', value: 'WhatsApp / boutique en ligne' },
  ];
}

function getShopWhatsappNumber(shop: { whatsapp?: string; phone?: string } | null | undefined) {
  return (shop?.whatsapp || shop?.phone || '').trim();
}

function getProductStrengths(product: Product, copy?: ProductBrochureCopy | null) {
  const strengths: string[] = [];
  const specs = getSpecRows(product)
    .filter((row) => row.value && !/non renseigne|a confirmer/i.test(row.value))
    .slice(0, 3)
    .map((row) => `${row.label}: ${row.value}`);

  if (product.brand) strengths.push(`Marque: ${product.brand}`);
  if (product.category) strengths.push(`Categorie: ${product.category}`);
  strengths.push(product.stock > 0 ? `Disponible: ${product.stock} en stock` : 'Disponibilite a confirmer');
  strengths.push(...specs);
  if (copy?.bullets?.length) strengths.push(...copy.bullets);

  return Array.from(new Set(strengths.map((item) => item.trim()).filter(Boolean))).slice(0, 5);
}

async function compressDataUrlToDataUrl(src: string, maxSize = 900, quality = 0.76): Promise<string> {
  const img = await loadCanvasImage(src);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

async function compressFileToDataUrl(file: File, maxSize = 760, quality = 0.72): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await loadCanvasImage(source);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return source;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

async function imageUrlToDataUrl(src: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(src);
  if (!res.ok) throw new Error('Image introuvable');
  const blob = await res.blob();
  const mimeType = blob.type || 'image/jpeg';
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return { data, mimeType };
}

const WA_SUPPORT = '393299639430';
const AFRICA_COUNTRIES = new Set(['SN','CI','CM','ML','BF','GN','TG','BJ','NE','CD','CG','GA','MG','MU','TZ','KE','GH','NG','RW','ET','MZ','ZA','AO','ZM','ZW','UG','BI','MW','SO','SD','TD','CF','GW','SL','LR','GM','CV','ST','GQ','DJ','ER','SS','KM','LS','BW','NA','SZ']);
const toEur = (fcfa: number) => (fcfa / 655).toFixed(2);
const STRIPE_LINKS: Record<string, string> = {
  PACK_50:  'https://buy.stripe.com/6oUbITeEl3ia1UM1DmaVa05',
  PACK_200: 'https://buy.stripe.com/dRmdR12VD6um56Y4PyaVa04',
};
const PACKS = [
  { id: 'PACK_50',  name: 'Pack 50 photos',  credits: 50,  price: 1000, pricePerPhoto: 20, popular: false },
  { id: 'PACK_200', name: 'Pack 200 photos', credits: 200, price: 3000, pricePerPhoto: 15, popular: true  },
] as const;
type Pack = typeof PACKS[number];

function CreditsModal({ credits, shopName, shopId, onClose }: { credits: number; shopName: string; shopId: string; onClose: () => void; }) {
  const { t } = useI18n();
  const [zone, setZone] = useState<'africa' | 'diaspora' | null>(null);
  const [detecting, setDetecting] = useState(true);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [showWire, setShowWire] = useState(false);

  useEffect(() => {
    fetch('https://ipapi.co/json/').then(r=>r.json()).then(d=>setZone(AFRICA_COUNTRIES.has(d.country_code||'')?'africa':'diaspora')).catch(()=>setZone(null)).finally(()=>setDetecting(false));
  }, []);

  function sendWhatsApp(pack: Pack, method: string) {
    const isEur = zone==='diaspora';
    const price = isEur?`${toEur(pack.price)}`:`${pack.price.toLocaleString()} FCFA`;
    const payLine = method==='stripe'?'Stripe (carte bancaire) - paiement effectue':method==='wire'?'Virement SEPA':method==='whatsapp'?'A discuter':'Mobile Money (Wave / Orange / MTN)';
    const msg = `Bonjour\n\nJe veux activer le *${pack.name}* pour Studio Photo IA MasterShopPro.\n\nBoutique : ${shopName}\nMontant : ${price}\nPaiement : ${payLine}\n\nMerci d'activer mes *${pack.credits} credits* !`;
    window.open(`https://wa.me/${WA_SUPPORT}?text=${encodeURIComponent(msg)}`,'_blank');
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" style={{maxHeight:'92vh',overflowY:'auto'}}>
        <div className="px-5 py-4 flex items-center justify-between" style={{background:'linear-gradient(135deg,#fff7ed,#fef3c7)'}}>
          <div><p className="text-xl font-extrabold text-gray-900">Recharger Studio IA</p><p className="text-sm text-gray-500 mt-0.5">Credits actuels : <strong className="text-orange-600">{credits}</strong></p></div>
          <div className="flex items-center gap-2">{detecting&&<div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"/>}<button onClick={onClose} className="w-9 h-9 bg-white/60 rounded-full flex items-center justify-center hover:bg-white"><X className="w-4 h-4 text-gray-500"/></button></div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <button onClick={()=>{setZone('africa');setSelectedPack(null);setShowWire(false);}} className={`flex-1 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${zone==='africa'?'border-emerald-500 bg-emerald-50 text-emerald-700':'border-gray-200 text-gray-400 hover:border-gray-300'}`}>En Afrique</button>
            <button onClick={()=>{setZone('diaspora');setSelectedPack(null);setShowWire(false);}} className={`flex-1 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${zone==='diaspora'?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-gray-200 text-gray-400 hover:border-gray-300'}`}>En diaspora</button>
          </div>
          {!detecting&&zone&&(<div className={`text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2 ${zone==='africa'?'bg-emerald-50 text-emerald-700':'bg-indigo-50 text-indigo-700'}`}><span>{zone==='africa'?'Paiement Mobile Money (Wave, Orange, MTN...)':'Paiement en EUR disponible (PayPal, virement SEPA)'}</span></div>)}
          {zone&&(<>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Choisir un pack</p>
            <div className="space-y-2.5">
              {PACKS.map(pack=>{const sel=selectedPack?.id===pack.id;return(
                <div key={pack.id} onClick={()=>{setSelectedPack(pack);setShowWire(false);}} className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${sel?'border-orange-500 shadow-md':pack.popular?'border-orange-200 bg-orange-50/60':'border-gray-200 hover:border-gray-300'}`} style={sel?{background:'linear-gradient(135deg,#fff7ed,#ffffff)'}:{}}>
                  <div className="flex items-center justify-between">
                    <div><div className="flex items-center gap-2"><p className="font-extrabold text-gray-900">{pack.name}</p>{pack.popular&&<span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">POPULAIRE</span>}</div><p className="text-xs text-gray-500 mt-0.5">{zone==='africa'?`${pack.pricePerPhoto} FCFA / photo`:`${(Number(toEur(pack.price))/pack.credits*100).toFixed(1)}c / photo`}</p></div>
                    <div className="text-right"><p className="text-xl font-extrabold text-orange-600">{zone==='africa'?`${pack.price.toLocaleString()} F`:`${toEur(pack.price)}`}</p>{zone==='diaspora'&&<p className="text-[10px] text-gray-400">{pack.price.toLocaleString()} FCFA</p>}</div>
                  </div>
                </div>
              );})}
            </div>
            {selectedPack&&(
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Methode de paiement</p>
                {zone==='africa'?(
                  <div className="space-y-2">
                    {[{logo:'',name:'Wave',sub:'Le plus rapide',color:'#16a34a',bg:'#f0fdf4',border:'#86efac'},{logo:'',name:'Orange Money',sub:'Disponible partout',color:'#ea580c',bg:'#fff7ed',border:'#fdba74'},{logo:'',name:'MTN MoMo',sub:"Cote d'Ivoire, Ghana, Cameroun",color:'#ca8a04',bg:'#fefce8',border:'#fde047'},{logo:'',name:'Airtel Money',sub:'Tanzania, Kenya, Rwanda',color:'#dc2626',bg:'#fef2f2',border:'#fca5a5'}].map(m=>(
                      <button key={m.name} onClick={()=>sendWhatsApp(selectedPack,'mobilemoney')} className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left hover:opacity-90 active:scale-[0.98] transition-all" style={{borderColor:m.border,background:m.bg}}>
                        <span className="text-2xl flex-shrink-0">{m.logo}</span>
                        <div className="flex-1 min-w-0"><p className="font-extrabold text-sm" style={{color:m.color}}>{m.name}</p><p className="text-[11px] text-gray-500">{m.sub}</p></div>
                        <div className="text-xs font-bold px-3 py-1.5 rounded-xl text-white flex-shrink-0" style={{background:m.color}}>Payer {selectedPack.price.toLocaleString()}F</div>
                      </button>
                    ))}
                  </div>
                ):(
                  <div className="space-y-2">
                    <button onClick={()=>{const url=STRIPE_LINKS[selectedPack.id];const p=new URLSearchParams();if(shopId)p.set('client_reference_id',shopId);if(shopName)p.set('prefilled_custom_field_0',shopName);window.open(`${url}?${p.toString()}`,'_blank');}} className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-violet-300 bg-violet-50 hover:bg-violet-100 active:scale-[0.98] transition-all text-left">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0"><svg viewBox="0 0 60 25" className="w-8 h-4" fill="none"><path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V6.27h3.64l.24 1.12a4.52 4.52 0 0 1 3.26-1.4c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 6.91-5.72 6.91zm-1-11.3c-.86 0-1.37.3-1.9.8l.04 6.27c.5.45 1 .72 1.86.72 1.46 0 2.46-1.63 2.46-3.87 0-2.18-.99-3.92-2.46-3.92zM28.24 5.12c-1.36 0-2.23.59-2.23 1.89 0 1.04.69 1.73 2.37 2.34l.87.32C31.15 10.4 32.4 11.6 32.4 13.7c0 2.76-2.22 4.63-5.92 4.63-1.61 0-3.38-.33-4.77-1.06V13.4a8.37 8.37 0 0 0 4.72 1.48c1.56 0 2.4-.55 2.4-1.67 0-1.02-.73-1.71-2.5-2.36l-.87-.31C23.6 9.7 22.4 8.5 22.4 6.5c0-2.7 2.08-4.45 5.66-4.45 1.5 0 3.04.3 4.2.87v3.77a7.6 7.6 0 0 0-4.02-1.57zM14.88 0l4.16.88V3.4l-4.16-.88V0zm0 6.27h4.16V20h-4.16V6.27zm-5.5 4.97L5.1 6.27H.37l5.22 6.86L0 20h4.74l4.64-6.24V20h4.16V0L9.38 .88V11.24z" fill="#635BFF"/></svg></div>
                      <div className="flex-1"><p className="font-extrabold text-violet-800">Carte bancaire via Stripe</p><p className="text-xs text-violet-500">Visa Mastercard CB Apple Pay Google Pay</p></div>
                      <div className="text-right flex-shrink-0"><p className="text-xl font-extrabold text-violet-700">{toEur(selectedPack.price)}</p><div className="text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded-full font-bold mt-1">Payer</div></div>
                    </button>
                    <div className="rounded-2xl border-2 border-gray-200 overflow-hidden">
                      <button onClick={()=>setShowWire(w=>!w)} className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl flex-shrink-0"></div>
                        <div className="flex-1"><p className="font-extrabold text-gray-800">Virement SEPA / bancaire</p><p className="text-xs text-gray-500">Europe 1-2 jours ouvres</p></div>
                        <div className="text-right flex-shrink-0"><p className="text-xl font-extrabold text-gray-700">{toEur(selectedPack.price)}</p><div className="text-[10px] bg-gray-700 text-white px-2 py-0.5 rounded-full font-bold mt-1">{showWire?'Masquer':'IBAN'}</div></div>
                      </button>
                      {showWire&&(
                        <div className="p-4 pt-0 bg-gray-50 space-y-2">
                          <div className="bg-white rounded-xl p-3 border border-gray-200 font-mono text-xs space-y-1.5">
                            <div className="flex justify-between"><span className="text-gray-400">Beneficiaire</span><span className="font-bold text-gray-800">MasterShopPro</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">IBAN</span><span className="font-bold text-gray-800 text-[10px]">IT60 X054 2811 1010 0000 0123 456</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">BIC/SWIFT</span><span className="font-bold text-gray-800">SELBIT2BXXX</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Motif</span><span className="font-bold text-gray-800">STUDIO-{selectedPack.credits}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Montant</span><span className="font-extrabold text-orange-600">{toEur(selectedPack.price)}</span></div>
                          </div>
                          <button onClick={()=>sendWhatsApp(selectedPack,'wire')} className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5" style={{background:'linear-gradient(135deg,#16a34a,#15803d)'}}>Confirmer sur WhatsApp apres virement</button>
                        </div>
                      )}
                    </div>
                    <button onClick={()=>sendWhatsApp(selectedPack,'whatsapp')} className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100 text-left transition-colors">
                      <span className="text-2xl"></span>
                      <div className="flex-1"><p className="font-extrabold text-green-800">Contacter sur WhatsApp</p><p className="text-xs text-green-600">Western Union, Wise, autre methode - on s'adapte</p></div>
                      <div className="text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-xl">Chat</div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>)}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
            <p className="text-xs font-bold text-amber-700">Credits actives sous 2h max - Support 7j/7</p>
            <p className="text-[10px] text-amber-500 mt-0.5">{zone==='africa'?'Wave Orange Money MTN MoMo Airtel Money':'PayPal Virement SEPA Wise Western Union'}</p>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-gray-100 rounded-2xl text-sm text-gray-600 font-medium hover:bg-gray-200">Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
function formatPriceCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0','')}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}
function StatCell({ label, value, sub, accent }: { label:string; value:string; sub:string; accent:string }) {
  return (
    <div className="px-5 py-5 sm:px-6 border-r border-white/10 last:border-r-0">
      <div className="text-[10.5px] font-extrabold tracking-[0.22em] uppercase text-white/55">{label}</div>
      <div className="display-serif text-3xl sm:text-4xl leading-none mt-1.5" style={{ color: accent }}>{value}</div>
      <div className="text-[11.5px] font-semibold text-white/55 mt-1">{sub}</div>
    </div>
  );
}

export default function ProductsPage() {
  const { shop } = useAuth();
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [limits, setLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [photoMode, setPhotoMode] = useState<PhotoMode>('none');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]);
  const [extraPhotoFiles, setExtraPhotoFiles] = useState<(File | null)[]>([null, null]);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const [rawSrc, setRawSrc] = useState('');
  const [imgNat, setImgNat] = useState({ w:0, h:0 });
  const [cropOff, setCropOff] = useState({ x:0, y:0 });
  const [cropScale, setCropScale] = useState(1);
  const [cropRot, setCropRot] = useState(0);
  const isDrag = useRef(false);
  const dragRef = useRef({ mx:0, my:0, ox:0, oy:0 });
  const cropImgRef = useRef<HTMLImageElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment'|'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [studio, setStudio] = useState<StudioSettings>(DEFAULT_STUDIO);
  const [studioPreview, setStudioPreview] = useState('');
  const [applyingStudio, setApplyingStudio] = useState(false);
  const [studioCredits, setStudioCredits] = useState<number>(0);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [brochureProduct, setBrochureProduct] = useState<Product | null>(null);
  const [brochureCopy, setBrochureCopy] = useState<ProductBrochureCopy | null>(null);
  const [brochureLoading, setBrochureLoading] = useState(false);
  const [brochureError, setBrochureError] = useState('');
  const [brochureCopied, setBrochureCopied] = useState(false);
  const [proImageUrl, setProImageUrl] = useState('');
  const [proImageLoading, setProImageLoading] = useState(false);
  const [modalProLoading, setModalProLoading] = useState(false);
  const [brochurePreviewUrl, setBrochurePreviewUrl] = useState('');
  const [newCat, setNewCat] = useState({ name:'', color:'#16a34a' });
  const [postSaveProduct, setPostSaveProduct] = useState<Product | null>(null);
  const [showQuickSell, setShowQuickSell] = useState(false);
  const [qsStep, setQsStep] = useState<'photo'|'review'>('photo');
  const [qsSaving, setQsSaving] = useState(false);

  const [promoProduct, setPromoProduct] = useState<Product | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoGenerating, setPromoGenerating] = useState(false);
  const [promoTemplate, setPromoTemplate] = useState<'flash' | 'vedette'>('flash');
  const [promoPreviewUrl, setPromoPreviewUrl] = useState('');
  const [promoForm, setPromoForm] = useState({
    discountPercent: 20,
    promoPrice: 0,
    deadline: '',
    headline: '',
    subtext: '',
    badge: 'OFFRE FLASH',
  });

  function openQuickSell() {
    resetPhoto();
    setForm({ name:'', description:'', specifications:'', category:'', brand:'', sku:'', barcode:'', costPrice:'', sellingPrice:'', stock:'1', minStock:'5', isActive:true, isFeatured:false, imageUrl:'' });
    setQsStep('photo');
    setShowQuickSell(true);
  }

  async function handleQuickSave() {
    if (!shop?.id || !form.name || !form.sellingPrice) return;
    setQsSaving(true);
    try {
      let imageUrl = form.imageUrl;
      if (photoFile) {
        try {
          const r = ref(storage, `shops/${shop.id}/products/${Date.now()}.jpg`);
          await uploadBytes(r, photoFile);
          imageUrl = await getDownloadURL(r);
        } catch {}
      }
      const data: Record<string,any> = {
        name: form.name.trim(),
        category: form.category || 'Autre',
        costPrice: parseFloat(form.costPrice) || 0,
        sellingPrice: parseFloat(form.sellingPrice) || 0,
        stock: parseInt(form.stock) || 1,
        minStock: 5,
        isActive: true,
        isFeatured: false,
        imageUrl,
        images: extraPhotos.filter(Boolean),
      };
      if (form.description.trim()) data.description = form.description.trim();
      const savedProduct = {
        ...data, id: '', shopId: shop.id,
        createdAt: new Date().toISOString(),
      } as Product;
      await createProduct(shop.id, data as any);
      await loadData();
      setShowQuickSell(false);
      resetPhoto();
      setPostSaveProduct(savedProduct);
    } catch(err:any) { alert('Erreur : ' + (err?.message || String(err))); }
    setQsSaving(false);
  }

  const [form, setForm] = useState({
    name:'', description:'', specifications:'', category:'', brand:'',
    sku:'', barcode:'', costPrice:'', sellingPrice:'', stock:'', minStock:'5',
    isActive:true, isFeatured:false, imageUrl:'',
  });

  useEffect(() => { if (shop?.id) loadData(); }, [shop?.id]);
  useEffect(() => () => { if (cameraStream) cameraStream.getTracks().forEach(t=>t.stop()); }, [cameraStream]);

  function proxySrc(src: string): string {
    if (src && src.includes('firebasestorage.googleapis.com')) return `/api/proxy-image?url=${encodeURIComponent(src)}`;
    return src;
  }

  useEffect(() => {
    if (!showStudio || !rawSrc) return;
    const id = setTimeout(() => {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas'); c.width=280; c.height=280;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = studio.bgWhite ? '#FFFFFF' : '#f0f0f0'; ctx.fillRect(0,0,280,280);
        ctx.filter = buildFilter(studio);
        const scale = Math.min(280/img.width,280/img.height)*0.9;
        const sw=img.width*scale, sh=img.height*scale;
        ctx.drawImage(img,(280-sw)/2,(280-sh)/2,sw,sh);
        setStudioPreview(c.toDataURL('image/jpeg',0.85));
      };
      img.src = proxySrc(rawSrc);
    }, 60);
    return () => clearTimeout(id);
  }, [studio, rawSrc, showStudio]);

  async function loadData() {
    if (!shop?.id) return;
    const [p, c, lim] = await Promise.all([getProducts(shop.id), getCategories(shop.id), checkShopLimits(shop.id)]);
    setProducts(p); setCategories(c); setLimits(lim);
    setStudioCredits((shop as any).aiCredits ?? 0);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null); resetPhoto();
    setForm({ name:'', description:'', specifications:'', category:'', brand:'', sku:'', barcode:'', costPrice:'', sellingPrice:'', stock:'', minStock:'5', isActive:true, isFeatured:false, imageUrl:'' });
    setShowModal(true);
  }
  function openEdit(p: Product) {
    setEditing(p); resetPhoto();
    setForm({ name:p.name, description:p.description||'', specifications:p.specifications||'', category:p.category, brand:p.brand||'', sku:p.sku||'', barcode:p.barcode||'', costPrice:String(p.costPrice), sellingPrice:String(p.sellingPrice), stock:String(p.stock), minStock:String(p.minStock||5), isActive:p.isActive, isFeatured:p.isFeatured||false, imageUrl:p.imageUrl||'' });
    setExtraPhotos((p as any).images || []);
    setShowModal(true);
  }
  function resetPhoto() {
    setPhotoMode('none'); setPhotoFile(null); setPhotoPreview(''); setRawSrc('');
    setExtraPhotos([]); setExtraPhotoFiles([null, null]);
    setCropOff({x:0,y:0}); setCropScale(1); setCropRot(0); stopCam();
    setStudio(DEFAULT_STUDIO); setAiAnalysis(null); setShowStudio(false); setStudioPreview('');
  }

  async function startCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width:{ideal:1920}, height:{ideal:1080} } });
      setCameraStream(stream); setPhotoMode('camera');
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { alert('Camera non disponible'); }
  }
  function stopCam() { if (cameraStream) { cameraStream.getTracks().forEach(t=>t.stop()); setCameraStream(null); } }
  async function flipCamera() { stopCam(); setFacingMode(f=>f==='environment'?'user':'environment'); setTimeout(()=>startCam(),200); }
  function captureCam() {
    if (!videoRef.current||!canvasRef.current) return;
    const v=videoRef.current, c=canvasRef.current;
    c.width=v.videoWidth||1280; c.height=v.videoHeight||720;
    c.getContext('2d')!.drawImage(v,0,0);
    const src=c.toDataURL('image/jpeg',0.95); stopCam();
    const img=new Image();
    img.onload=()=>{ setImgNat({w:img.naturalWidth,h:img.naturalHeight}); setRawSrc(src); setCropScale(Math.max(FRAME/img.naturalWidth,FRAME/img.naturalHeight)); setCropOff({x:0,y:0}); setPhotoMode('crop'); };
    img.src=src;
  }
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f=e.target.files?.[0]; if (!f) return;
    const url=URL.createObjectURL(f);
    const img=new Image();
    img.onload=()=>{ setImgNat({w:img.naturalWidth,h:img.naturalHeight}); setRawSrc(url); setCropScale(Math.max(FRAME/img.naturalWidth,FRAME/img.naturalHeight)); setCropOff({x:0,y:0}); setPhotoMode('crop'); };
    img.src=url; e.target.value='';
  }
  function onPD(e: React.PointerEvent) { isDrag.current=true; dragRef.current={mx:e.clientX,my:e.clientY,ox:cropOff.x,oy:cropOff.y}; (e.target as HTMLElement).setPointerCapture(e.pointerId); }
  function onPM(e: React.PointerEvent) { if (!isDrag.current) return; setCropOff({x:dragRef.current.ox+e.clientX-dragRef.current.mx,y:dragRef.current.oy+e.clientY-dragRef.current.my}); }
  function onPU() { isDrag.current=false; }

  function applyCrop() {
    const canvas=document.createElement('canvas'), OUT=1024;
    canvas.width=OUT; canvas.height=OUT;
    const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,OUT,OUT);
    const r2c=OUT/FRAME, img=cropImgRef.current!;
    ctx.save(); ctx.rect(0,0,OUT,OUT); ctx.clip();
    ctx.translate(OUT/2,OUT/2); ctx.rotate((cropRot*Math.PI)/180);
    const sw=imgNat.w*cropScale*r2c, sh=imgNat.h*cropScale*r2c;
    ctx.translate(cropOff.x*r2c+sw/2-OUT/2,cropOff.y*r2c+sh/2-OUT/2);
    ctx.drawImage(img,-sw/2,-sh/2,sw,sh); ctx.restore();
    const croppedSrc=canvas.toDataURL('image/jpeg',0.95);
    canvas.toBlob(async(blob)=>{
      if (!blob) return;
      setRawSrc(croppedSrc); setPhotoFile(new File([blob],`prod-${Date.now()}.jpg`,{type:'image/jpeg'}));
      setPhotoPreview(croppedSrc); setPhotoMode('done');
      await analyzeAI(blob);
    },'image/jpeg',0.95);
  }

  async function analyzeAI(blob: Blob) {
    setIsAnalyzing(true);
    let b64 = '';
    try {
      const reader = new FileReader();
      b64 = await new Promise<string>((res, rej) => {
        reader.onload = () => res((reader.result as string).split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
      const costPrice = form.costPrice ? parseFloat(form.costPrice) : undefined;
      const r = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: b64, mediaType: 'image/jpeg', costPrice }),
      });
      if (!r.ok) throw new Error();
      const p = await r.json();
      if (p.name || p.description) {
        setForm(prev => ({
          ...prev,
          name:         p.name         || prev.name,
          description:  p.description  || prev.description,
          specifications: p.specifications || prev.specifications,
          brand:        p.brand        || prev.brand,
          sellingPrice: p.suggestedPrice ? p.suggestedPrice.replace(/[^0-9]/g, '') || prev.sellingPrice : prev.sellingPrice,
          category:     p.category ? (categories.find(c => c.name.toLowerCase().includes(p.category.toLowerCase()))?.name || prev.category) : prev.category,
        }));
        setAiAnalysis(p);
      }
    } catch {
      /* analyse silencieuse — ne jamais bloquer */
    } finally {
      setIsAnalyzing(false);
    }

    // ── Photo Pro IA — génération OpenAI en arrière-plan (silent, non-bloquant) ──
    if (!b64 || !shop?.id) return;
    try {
      const { doc: fsDoc, getDoc, updateDoc } = await import('firebase/firestore');
      const { db: fsDb } = await import('@/lib/firebase');
      const shopRef = fsDoc(fsDb, 'shops', shop.id);
      const shopSnap = await getDoc(shopRef);
      const currentCredits = shopSnap.data()?.aiCredits ?? 0;
      if (currentCredits < 3) return; // coût = 3 crédits (photoProIA)
      fetch('/api/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: 'product-spotlight',
          brandName: shop?.name || 'MasterShopPro',
          aspectRatio: '1:1',
          imageSize: '1K',
          quality: 'fast',
          referenceImages: [{ data: b64, mimeType: 'image/jpeg' }],
          description: `Premium ecommerce product photo for "${form.name || 'product'}". Clean studio background, mobile-first visual for WhatsApp commerce. Same product, improved lighting and presentation.`,
        }),
      }).then(async sRes => {
        if (!sRes.ok) return;
        const sData = await sRes.json();
        if (!sData.image) return;
        // Déduire 3 crédits seulement si succès
        updateDoc(shopRef, { aiCredits: Math.max(0, currentCredits - 3), updatedAt: new Date().toISOString() }).catch(() => {});
        setStudioCredits(c => Math.max(0, c - 3));
        const imgData = sData.image;
        const processedBlob = await fetch(imgData).then(r => r.blob());
        const processedUrl = URL.createObjectURL(processedBlob);
        setPhotoPreview(processedUrl);
        setRawSrc(imgData);
        setPhotoFile(new File([processedBlob], `pro-${Date.now()}.png`, { type: 'image/png' }));
        setPhotoMode('done');
      }).catch(() => { /* OpenAI indisponible — photo originale conservée */ });
    } catch { /* non-bloquant */ }
  }

  async function generateModalProPhoto() {
    const srcToUse = photoPreview || form.imageUrl;
    if (!srcToUse || !shop?.id) return;
    if (studioCredits < 3) { setShowCreditsModal(true); return; }
    setModalProLoading(true);
    try {
      const referenceImages = [await imageUrlToDataUrl(proxySrc(srcToUse))];
      const res = await fetch('/api/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: 'product-spotlight',
          brandName: shop?.name || 'MasterShopPro',
          aspectRatio: '1:1',
          imageSize: '1K',
          quality: 'fast',
          referenceImages,
          description: `Premium ecommerce product photo for "${form.name || 'product'}". Clean studio background, mobile-first visual for WhatsApp commerce.`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.image) throw new Error(data.error || 'Génération impossible');
      const { doc: fsDoc, updateDoc } = await import('firebase/firestore');
      const { db: fsDb } = await import('@/lib/firebase');
      updateDoc(fsDoc(fsDb, 'shops', shop.id), { aiCredits: Math.max(0, studioCredits - 3), updatedAt: new Date().toISOString() }).catch(() => {});
      setStudioCredits(c => Math.max(0, c - 3));
      const processedBlob = await fetch(data.image).then(r => r.blob());
      const processedUrl = URL.createObjectURL(processedBlob);
      setPhotoPreview(processedUrl);
      setRawSrc(data.image);
      setPhotoFile(new File([processedBlob], `pro-${Date.now()}.png`, { type: 'image/png' }));
      setPhotoMode('done');
    } catch (e: any) {
      console.error('[ModalProPhoto]', e);
    } finally {
      setModalProLoading(false);
    }
  }

  async function applyStudio() {
    if (!rawSrc) return; setApplyingStudio(true);
    try {
      const blob=await applyStudioToCanvas(proxySrc(rawSrc),studio,1024);
      const url=URL.createObjectURL(blob);
      setPhotoFile(new File([blob],`studio-${Date.now()}.jpg`,{type:'image/jpeg'}));
      setPhotoPreview(url); setShowStudio(false); setPhotoMode('done');
    } catch(e){ console.error(e); }
    setApplyingStudio(false);
  }

  async function uploadPhoto(): Promise<string> {
    if (!photoFile||!shop?.id) return form.imageUrl;
    setUploadingPhoto(true);
    try {
      const extension = photoFile.type.includes('png') ? 'png' : 'jpg';
      const r=ref(storage,`shops/${shop.id}/products/${Date.now()}.${extension}`);
      await uploadBytes(r,photoFile,{ contentType: photoFile.type || 'image/jpeg' });
      return await getDownloadURL(r);
    }
    catch (error) {
      console.warn('[Products] Firebase Storage indisponible, fallback image compressee:', error);
      try {
        return await compressFileToDataUrl(photoFile);
      } catch (fallbackError) {
        console.error('[Products] Impossible de sauvegarder la photo:', fallbackError);
        throw new Error("La photo n'a pas pu etre sauvegardee. Reessaie avec une image plus legere.");
      }
    } finally { setUploadingPhoto(false); }
  }

  // Upload une photo supplémentaire depuis un input file
  async function uploadExtraPhoto(file: File, idx: number) {
    if (!shop?.id) return;
    setUploadingExtra(true);
    try {
      const r = ref(storage, `shops/${shop.id}/products/extra-${Date.now()}-${idx}.jpg`);
      await uploadBytes(r, file, { contentType: file.type || 'image/jpeg' });
      const url = await getDownloadURL(r);
      setExtraPhotos(prev => { const next = [...prev]; next[idx] = url; return next; });
    } catch (e) {
      console.warn('[Products] Upload photo supplementaire indisponible, fallback local:', e);
      try {
        const dataUrl = await compressFileToDataUrl(file, 640, 0.68);
        setExtraPhotos(prev => { const next = [...prev]; next[idx] = dataUrl; return next; });
      } catch (fallbackError) {
        console.error('upload extra photo', fallbackError);
        alert("Cette photo n'a pas pu etre ajoutee. Essaie une image plus legere.");
      }
    }
    setUploadingExtra(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); if (!shop?.id) return; setSaving(true);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const shouldOpenBrochure = submitter?.value === 'brochure';
    try {
      let imageUrl=form.imageUrl||'';
      if (photoFile) imageUrl=await uploadPhoto();
      const data: Record<string,any>={
        name:form.name.trim(), category:form.category,
        costPrice:parseFloat(form.costPrice)||0, sellingPrice:parseFloat(form.sellingPrice)||0,
        stock:parseInt(form.stock)||0, minStock:parseInt(form.minStock)||5,
        isActive:Boolean(form.isActive), isFeatured:Boolean(form.isFeatured),
        imageUrl, images: extraPhotos.filter(Boolean),
      };
      if (form.description.trim()) data.description=form.description.trim();
      if (form.specifications.trim()) data.specifications=form.specifications.trim();
      if (form.brand.trim()) data.brand=form.brand.trim();
      if (form.sku.trim()) data.sku=form.sku.trim();
      if (form.barcode.trim()) data.barcode=form.barcode.trim();
      let savedId = editing?.id || '';
      if (editing?.id) await updateProduct(editing.id,data);
      else savedId = await createProduct(shop.id, data as any);
      const savedProduct = {
        ...(editing || {}),
        ...data,
        id: savedId,
        shopId: shop.id,
        createdAt: editing?.createdAt || new Date().toISOString(),
      } as Product;
      await loadData(); setShowModal(false); resetPhoto();
      setPostSaveProduct(savedProduct);
      if (shouldOpenBrochure) {
        setTimeout(() => openBrochure(savedProduct), 120);
      }
    } catch(err:any){ alert('Erreur : '+(err?.message||String(err))); }
    setSaving(false);
  }
  async function handleDelete(id: string) { if (!confirm('Supprimer ce produit ?')) return; await deleteProduct(id); await loadData(); }
  async function handleAddCat(e: React.FormEvent) { e.preventDefault(); if (!shop?.id||!newCat.name.trim()) return; await createCategory(shop.id,newCat); setNewCat({name:'',color:'#16a34a'}); await loadData(); setShowCatModal(false); }

  async function openBrochure(product: Product, forceRegenerate = false) {
    const savedBrochureUrl = (product as any).brochureImageUrl as string | undefined;

    // Brochure déjà générée — afficher directement sans brûler de crédits
    if (savedBrochureUrl && !forceRegenerate) {
      const initial = defaultBrochure(product, shop?.name || 'MasterShopPro', shop?.currency || 'FCFA', shop?.slug || '');
      setBrochureProduct(product);
      setBrochureCopy(initial);
      setBrochureError('');
      setBrochureCopied(false);
      setProImageUrl(product.imageUrl || '');
      if (brochurePreviewUrl) URL.revokeObjectURL(brochurePreviewUrl);
      setBrochurePreviewUrl(savedBrochureUrl);
      setBrochureLoading(false);
      return;
    }

    if (studioCredits < 1) { setShowCreditsModal(true); return; }
    const initial = defaultBrochure(product, shop?.name || 'MasterShopPro', shop?.currency || 'FCFA', shop?.slug || '');
    setBrochureProduct(product);
    setBrochureCopy(initial);
    setBrochureError('');
    setBrochureCopied(false);
    setProImageUrl('');
    if (brochurePreviewUrl) URL.revokeObjectURL(brochurePreviewUrl);
    setBrochurePreviewUrl('');
    setBrochureLoading(true);

    // Phase 1: texte IA + photo pro OpenAI en parallèle
    let generatedCopy: ProductBrochureCopy = initial;
    let proImg = '';

    const textPromise = (async () => {
      try {
        const res = await fetch('/api/product-brochure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: product.name,
            description: product.description || '',
            category: product.category || '',
            brand: product.brand || '',
            price: product.sellingPrice || 0,
            currency: shop?.currency || 'FCFA',
            shopName: shop?.name || 'MasterShopPro',
            stock: product.stock,
          }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        generatedCopy = { ...initial, ...data, bullets: data.bullets?.length ? data.bullets : initial.bullets };
        setBrochureCopy(generatedCopy);
      } catch {
        setBrochureCopy(initial);
      }
    })();

    const photoPromise = (async () => {
      if (!product.imageUrl) return;
      try {
        proImg = await generateProfessionalProductImage(product) || '';
        if (proImg) setProImageUrl(proImg);
      } catch { /* photo pro non bloquante */ }
    })();

    await Promise.all([textPromise, photoPromise]);
    setBrochureLoading(false);

    // Phase 2: canvas avec la photo pro
    const imageForCanvas = proImg || product.imageUrl || '';
    try {
      const blob = await renderCommercialBrochureBlob(imageForCanvas, product, generatedCopy);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setBrochurePreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
        // Phase 3: sauvegarder la brochure dans la boutique
        if (product.id) autoSaveBrochureImage(product.id, blob).catch(() => {});
        setBrochureError('');
      }
    } catch (e) {
      console.warn('[openBrochure] canvas failed', e);
      setBrochureError('Brochure texte prête. Télécharge pour voir le visuel complet.');
    }
  }

  async function generateBrochure(product: Product, fallback = defaultBrochure(product, shop?.name || 'MasterShopPro', shop?.currency || 'FCFA', shop?.slug || '')) {
    // Vérifier les crédits avant d'appeler l'IA
    if (studioCredits <= 0) {
      setBrochureCopy(fallback);
      setBrochureError('Crédits insuffisants — recharge pour générer avec l\'IA.');
      setShowCreditsModal(true);
      return;
    }
    setBrochureLoading(true);
    setBrochureError('');
    try {
      const res = await fetch('/api/product-brochure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          description: product.description || '',
          category: product.category || '',
          brand: product.brand || '',
          price: product.sellingPrice || 0,
          currency: shop?.currency || 'FCFA',
          shopName: shop?.name || 'MasterShopPro',
          stock: product.stock,
        }),
      });
      if (!res.ok) throw new Error('generation_failed');
      const data = await res.json();
      setBrochureCopy({ ...fallback, ...data, bullets: data.bullets?.length ? data.bullets : fallback.bullets });
      // Déduire 1 crédit (brochureIA) après succès
      if (shop?.id) {
        const { doc: fsDoc, getDoc, updateDoc } = await import('firebase/firestore');
        const { db: fsDb } = await import('@/lib/firebase');
        const shopRef = fsDoc(fsDb, 'shops', shop.id);
        const snap = await getDoc(shopRef);
        const cur = snap.data()?.aiCredits ?? 0;
        updateDoc(shopRef, { aiCredits: Math.max(0, cur - 1), updatedAt: new Date().toISOString() }).catch(() => {});
        setStudioCredits(c => Math.max(0, c - 1));
      }
    } catch {
      setBrochureCopy(fallback);
      setBrochureError("L'IA n'a pas repondu. J'ai prepare une brochure locale utilisable.");
    } finally {
      setBrochureLoading(false);
    }
  }

  async function copyBrochureText() {
    if (!brochureCopy) return;
    await navigator.clipboard.writeText(brochureCopy.whatsappCaption);
    setBrochureCopied(true);
    setTimeout(() => setBrochureCopied(false), 1800);
  }

  async function generateProfessionalProductImage(pOverride?: Product) {
    const p = pOverride ?? brochureProduct;
    if (!p) return '';
    setProImageLoading(true);
    setBrochureError('');
    try {
      const referenceImages = p.imageUrl
        ? [await imageUrlToDataUrl(proxySrc(p.imageUrl))]
        : [];
      const res = await fetch('/api/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: 'product-spotlight',
          brandName: shop?.name || 'MasterShopPro',
          aspectRatio: '4:5',
          imageSize: '1K',
          quality: 'fast',
          referenceImages,
          description: `Create a premium but realistic ecommerce product photo for "${p.name}" using the reference image as the strict source of truth.
The final image must show the exact same product: same object, same shape, same color, same visible logo or label if present, same quantity, same packaging and same main details.
Do not invent a different product, different model, different brand, different color, extra accessories, fake labels, fake text, or unrealistic features.
Only improve lighting, background cleanliness, centering, sharpness, shadows and perceived value.
If a detail is unclear, preserve it rather than replacing it.
Market: African/Cameroonian WhatsApp commerce. Clean premium studio look, realistic shadow, mobile-first visual.`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.image) {
        if (data?.code === 'GEMINI_IMAGE_ACCESS_DENIED' || res.status === 403) {
          throw new Error(
            "Image pro IA bloquee par Google pour cette cle API. Tu peux quand meme utiliser le texte IA, l'image actuelle et la fiche PDF."
          );
        }
        throw new Error(data.error || 'Generation image impossible');
      }
      setProImageUrl(data.image);
      await refreshBrochurePreview(data.image);
      // Auto-sauvegarde dans la boutique — la photo pro devient l'image principale
      if (p?.id && shop?.id) {
        try {
          let finalUrl: string = data.image;
          if (data.image.startsWith('data:')) {
            const blob = await fetch(data.image).then(r => r.blob());
            const r2 = ref(storage, `shops/${shop.id}/products/pro-${p.id}-${Date.now()}.png`);
            await uploadBytes(r2, blob, { contentType: blob.type || 'image/png' });
            finalUrl = await getDownloadURL(r2);
          }
          const prevImages = p.images || [];
          const nextImages = [finalUrl, ...prevImages.filter(i => i && i !== finalUrl)].slice(0, 6);
          await updateProduct(p.id!, { imageUrl: finalUrl, images: nextImages });
          setBrochureProduct(prev => prev ? { ...prev, imageUrl: finalUrl, images: nextImages } : prev);
          setProImageUrl(finalUrl);
          await loadData();
          setBrochureError('✓ Photo pro sauvegardée dans la boutique.');
        } catch { /* non-bloquant */ }
      }
      return data.image as string;
    } catch (error: any) {
      console.error('[Brochure] Image pro IA impossible:', error);
      setBrochureError(error?.message || "L'image pro IA n'a pas pu etre generee. La brochure simple reste disponible.");
      return '';
    } finally {
      setProImageLoading(false);
    }
  }

  async function autoSaveBrochureImage(productId: string, blob: Blob) {
    if (!shop?.id) return;
    try {
      const r2 = ref(storage, `shops/${shop.id}/products/brochure-${productId}-${Date.now()}.png`);
      await uploadBytes(r2, blob, { contentType: 'image/png' });
      const url = await getDownloadURL(r2);
      await updateProduct(productId, { brochureImageUrl: url } as any);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, brochureImageUrl: url } : p));
      setBrochureProduct(prev => prev ? { ...prev, brochureImageUrl: url } : prev);
    } catch (e) {
      console.warn('[AutoSaveBrochure]', e);
    }
  }

  function openPromoModal(product: Product) {
    setPromoProduct(product);
    const discount = 20;
    const promoPrice = Math.round(product.sellingPrice * (1 - discount / 100));
    setPromoForm({
      discountPercent: discount,
      promoPrice,
      deadline: '',
      headline: '',
      subtext: '',
      badge: 'OFFRE FLASH',
    });
    setPromoTemplate('flash');
    setPromoPreviewUrl('');
    setShowPromoModal(true);
  }

  async function generatePromoTextAI() {
    if (!promoProduct || !shop?.id) return;
    if (studioCredits < 1) { setShowCreditsModal(true); return; }
    setPromoGenerating(true);
    try {
      const res = await fetch('/api/product-brochure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: promoProduct.name,
          description: promoProduct.description || '',
          category: promoProduct.category || '',
          brand: promoProduct.brand || '',
          price: promoForm.promoPrice || promoProduct.sellingPrice,
          currency: shop?.currency || 'FCFA',
          shopName: shop?.name || 'MasterShopPro',
          stock: promoProduct.stock,
          promoMode: true,
          discountPercent: promoForm.discountPercent,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Deduct 1 credit
      const { doc: fsDoc, getDoc, updateDoc } = await import('firebase/firestore');
      const { db: fsDb } = await import('@/lib/firebase');
      const shopRef = fsDoc(fsDb, 'shops', shop.id);
      const shopSnap = await getDoc(shopRef);
      const currentCredits = shopSnap.data()?.aiCredits ?? 0;
      updateDoc(shopRef, { aiCredits: Math.max(0, currentCredits - 1), updatedAt: new Date().toISOString() }).catch(() => {});
      setStudioCredits(c => Math.max(0, c - 1));
      setPromoForm(prev => ({
        ...prev,
        headline: data.headline || `Profitez de -${prev.discountPercent}% sur ${promoProduct.name}`,
        subtext: data.subheadline || 'Offre limitée. Commandez maintenant sur WhatsApp.',
        badge: data.badge || 'OFFRE FLASH',
      }));
    } catch {
      setPromoForm(prev => ({
        ...prev,
        headline: `Profitez de -${prev.discountPercent}% sur ${promoProduct.name}`,
        subtext: 'Offre limitée. Commandez maintenant sur WhatsApp.',
      }));
    } finally {
      setPromoGenerating(false);
    }
  }

  async function renderPromoCanvas(): Promise<Blob | null> {
    if (!promoProduct) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const isFlash = promoTemplate === 'flash';
    const currency = shop?.currency || 'FCFA';
    const originalPrice = promoProduct.sellingPrice;
    const promoPrice = promoForm.promoPrice || Math.round(originalPrice * (1 - promoForm.discountPercent / 100));
    const discount = promoForm.discountPercent;
    const shopName = shop?.name || 'MasterShopPro';
    const whatsapp = (shop as any)?.whatsapp || '';
    const headline = promoForm.headline || `-${discount}% sur ${promoProduct.name}`;
    const subtext = promoForm.subtext || 'Offre limitée. Commandez sur WhatsApp.';
    const badge = promoForm.badge || (isFlash ? 'OFFRE FLASH' : 'PRODUIT VEDETTE');
    const deadline = promoForm.deadline ? new Date(promoForm.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

    // Background gradient
    if (isFlash) {
      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      grad.addColorStop(0, '#7f1d1d');
      grad.addColorStop(0.5, '#dc2626');
      grad.addColorStop(1, '#ea580c');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
      grad.addColorStop(0, '#0b1220');
      grad.addColorStop(0.6, '#14532d');
      grad.addColorStop(1, '#166534');
      ctx.fillStyle = grad;
    }
    ctx.fillRect(0, 0, 1080, 1080);

    // Decorative circles
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(980, 100, 260, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(80, 980, 200, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Top badge bar
    const badgeColor = isFlash ? '#ff4500' : '#16a34a';
    ctx.fillStyle = badgeColor;
    ctx.fillRect(0, 0, 1080, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(badge.toUpperCase(), 540, 54);

    // Shop name
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '700 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(shopName.toUpperCase(), 540, 126);

    // Product image
    const imageUrl = promoProduct.imageUrl;
    if (imageUrl) {
      try {
        const img = await loadCanvasImage(imageUrl.startsWith('data:') ? imageUrl : proxySrc(imageUrl));
        const imgSize = 380;
        const imgX = (1080 - imgSize) / 2;
        const imgY = 145;
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.roundRect(imgX - 10, imgY - 10, imgSize + 20, imgSize + 20, 30);
        ctx.fill();
        const scale = Math.min(imgSize / img.width, imgSize / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, imgX + (imgSize - w) / 2, imgY + (imgSize - h) / 2, w, h);
      } catch {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(300, 145, 480, 380, 30);
        ctx.fill();
      }
    }

    // Discount badge circle
    if (discount > 0) {
      const cx = 870, cy = 230, r = 90;
      ctx.fillStyle = isFlash ? '#fbbf24' : '#4ade80';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isFlash ? '#7f1d1d' : '#052e16';
      ctx.font = '900 52px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`-${discount}%`, cx, cy + 8);
      ctx.font = '700 22px Arial';
      ctx.fillText('de réduction', cx, cy + 38);
    }

    // Product name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px Arial';
    ctx.textAlign = 'center';
    const nameLine = promoProduct.name.length > 28 ? promoProduct.name.substring(0, 28) + '...' : promoProduct.name;
    ctx.fillText(nameLine, 540, 588);

    // Prices
    if (originalPrice > 0 && discount > 0) {
      // Strikethrough old price
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '700 36px Arial';
      const oldPriceText = `${originalPrice.toLocaleString('fr-FR')} ${currency}`;
      const oldW = ctx.measureText(oldPriceText).width;
      ctx.fillText(oldPriceText, 540, 640);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(540 - oldW / 2, 633);
      ctx.lineTo(540 + oldW / 2, 633);
      ctx.stroke();
    }

    // New promo price
    ctx.fillStyle = isFlash ? '#fbbf24' : '#4ade80';
    ctx.font = '900 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${promoPrice.toLocaleString('fr-FR')} ${currency}`, 540, 720);

    // Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 32px Arial';
    ctx.textAlign = 'center';
    const hlWords = headline;
    const hlMaxW = 900;
    wrapCanvasText(ctx, hlWords, 540, 790, hlMaxW, 38, 2);

    // Subtext
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '500 26px Arial';
    wrapCanvasText(ctx, subtext, 540, 858, 900, 32, 2);

    // Deadline
    if (deadline) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '700 26px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`⏳ Valable jusqu'au ${deadline}`, 540, 930);
    }

    // Bottom bar
    const shopUrl = shop?.slug ? `mastershoppro.com/${shop.slug}` : '';
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.fillRect(0, 955, 1080, 125);
    ctx.textAlign = 'center';
    if (whatsapp) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 26px Arial';
      ctx.fillText(`📱 WhatsApp: ${whatsapp}`, 540, 990);
    }
    if (shopUrl) {
      ctx.fillStyle = isFlash ? '#fbbf24' : '#4ade80';
      ctx.font = '700 24px Arial';
      ctx.fillText(`🛒 Commander: ${shopUrl}`, 540, 1024);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '500 18px Arial';
    ctx.fillText('Fiche promo générée avec MasterShopPro', 540, 1062);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('canvas blob failed')), 'image/png');
    });
  }

  async function previewPromo() {
    setPromoLoading(true);
    try {
      const blob = await renderPromoCanvas();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setPromoPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    } catch (e) { console.error(e); }
    setPromoLoading(false);
  }

  async function downloadPromo() {
    setPromoLoading(true);
    try {
      const blob = await renderPromoCanvas();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promo-${promoProduct?.name?.replace(/\s+/g, '-').toLowerCase() || 'produit'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      // Auto-save to Firestore
      if (promoProduct?.id && shop?.id) {
        const r2 = ref(storage, `shops/${shop.id}/products/promo-${promoProduct.id}-${Date.now()}.png`);
        await uploadBytes(r2, blob, { contentType: 'image/png' });
        const savedUrl = await getDownloadURL(r2);
        await updateProduct(promoProduct.id, { promoImageUrl: savedUrl } as any);
        setProducts(prev => prev.map(p => p.id === promoProduct!.id ? { ...p, promoImageUrl: savedUrl } : p));
      }
    } catch (e) { console.error(e); }
    setPromoLoading(false);
  }

  async function sharePromo() {
    setPromoLoading(true);
    try {
      const blob = await renderPromoCanvas();
      if (!blob) return;
      const caption = promoForm.headline || `Promo sur ${promoProduct?.name}`;
      await nativeShareBlob(
        blob,
        `promo-${promoProduct?.name?.replace(/\s+/g, '-').toLowerCase() || 'produit'}.png`,
        promoProduct?.name || 'Promo',
        caption
      );
    } catch (e) { console.error(e); }
    setPromoLoading(false);
  }

  function printProductSheet() {
    if (!brochureProduct || !brochureCopy) return;
    const img = proImageUrl || brochureProduct.imageUrl || '';
    const price = brochureProduct.sellingPrice > 0 ? `${brochureProduct.sellingPrice.toLocaleString('fr-FR')} ${shop?.currency || 'FCFA'}` : 'Prix disponible en boutique';
    const specs = (brochureProduct.specifications || 'Caracteristiques a completer').replace(/\n/g, '<br/>');

    const html = `
      <html><head><title>Fiche produit - ${brochureProduct.name}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:0;background:#f1f5f9;color:#0f172a}
        .page{max-width:820px;margin:28px auto;background:white;border-radius:28px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,.12)}
        .hero{background:linear-gradient(135deg,#052e25,#0f766e);color:white;padding:28px 34px}
        .brand{font-size:13px;text-transform:uppercase;letter-spacing:.18em;opacity:.8;font-weight:800}
        h1{font-size:36px;line-height:1.05;margin:12px 0 8px}
        .sub{font-size:15px;line-height:1.55;opacity:.92}
        .media{background:#f8fafc;padding:24px;text-align:center}
        .media img{max-width:100%;max-height:360px;object-fit:contain;border-radius:20px}
        .content{padding:24px 28px;display:grid;gap:18px}
        .price{font-size:28px;font-weight:900;color:#047857}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .card{border:1px solid #e2e8f0;border-radius:16px;padding:14px;background:#f8fafc}
        .label{font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:#64748b;font-weight:900;margin-bottom:8px}
        .bullet{font-weight:700;margin:6px 0;font-size:14px}
        .cta{background:#052e25;color:white;border-radius:16px;padding:16px;font-weight:900;text-align:center;font-size:16px}
        .toolbar{position:fixed;top:0;left:0;right:0;background:#0f172a;padding:10px 16px;display:flex;gap:10px;z-index:9999}
        .btn{padding:8px 18px;border:none;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer}
        .btn-print{background:#1FB955;color:white}
        .btn-close{background:#dc2626;color:white}
        body{padding-top:52px}
        @media print{.toolbar{display:none}body{padding-top:0;background:white}.page{margin:0;box-shadow:none;border-radius:0}}
      </style></head>
      <body>
        <div class="toolbar">
          <button class="btn btn-print" onclick="window.print()">⬇️ Sauver / Imprimer PDF</button>
          <button class="btn btn-close" onclick="document.getElementById('psheet').remove();document.querySelector('.toolbar').remove();document.body.style.paddingTop='0'">✕ Fermer</button>
        </div>
        <div class="page" id="psheet">
          <div class="hero">
            <div class="brand">${shop?.name || 'MasterShopPro'} · fiche produit</div>
            <h1>${brochureCopy.headline}</h1>
            <div class="sub">${brochureCopy.subheadline}</div>
          </div>
          ${img ? `<div class="media"><img src="${img}" /></div>` : ''}
          <div class="content">
            <div class="price">${price}</div>
            <div class="grid">
              <div class="card"><div class="label">Points forts</div>${brochureCopy.bullets.map(b=>`<div class="bullet">✓ ${b}</div>`).join('')}</div>
              <div class="card"><div class="label">Caracteristiques</div><div style="font-size:13px">${specs}</div></div>
            </div>
            <div class="card"><div class="label">Message WhatsApp</div><div style="font-size:13px">${brochureCopy.whatsappCaption.replace(/\n/g,'<br/>')}</div></div>
            <div class="cta">${brochureCopy.cta}</div>
          </div>
        </div>
      </body></html>`;

    // Essayer d'abord window.open (desktop)
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (win) {
      win.document.write(html);
      win.document.close();
      return;
    }

    // Fallback Android/WebView : overlay dans la page courante
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:white;z-index:99998;overflow-y:auto;';
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
    iframe.contentDocument!.open();
    iframe.contentDocument!.write(html);
    iframe.contentDocument!.close();
  }

  async function persistProfessionalImageToProduct() {
    if (!brochureProduct?.id || !proImageUrl || !shop?.id) return '';
    let finalUrl = proImageUrl;
    const previousImages = brochureProduct.images || [];
    try {
      if (proImageUrl.startsWith('data:')) {
        const blob = await fetch(proImageUrl).then((res) => res.blob());
        const r = ref(storage, `shops/${shop.id}/products/pro-${brochureProduct.id}-${Date.now()}.png`);
        await uploadBytes(r, blob, { contentType: blob.type || 'image/png' });
        finalUrl = await getDownloadURL(r);
      }
    } catch (error) {
      console.error('[Brochure] Sauvegarde image pro impossible:', error);
      try {
        finalUrl = proImageUrl.startsWith('data:')
          ? await compressDataUrlToDataUrl(proImageUrl)
          : proImageUrl;
      } catch (fallbackError) {
        console.error('[Brochure] Fallback sauvegarde image pro impossible:', fallbackError);
        setBrochureError("L'image pro est prete, mais la sauvegarde dans la boutique a echoue. Tu peux quand meme telecharger la brochure.");
        return '';
      }
    }

    const nextImages = [finalUrl, ...previousImages.filter((image) => image && image !== finalUrl)].slice(0, 6);
    await updateProduct(brochureProduct.id, {
      imageUrl: finalUrl,
      images: nextImages,
    });
    setBrochureProduct({ ...brochureProduct, imageUrl: finalUrl, images: nextImages });
    setProImageUrl(finalUrl);
    await loadData();
    return finalUrl;
  }

  async function saveProfessionalImageToProduct() {
    if (!brochureProduct?.id || !proImageUrl || !shop?.id) return '';
    setProImageLoading(true);
    try {
      const url = await persistProfessionalImageToProduct();
      if (url) setBrochureError('Photo pro enregistree dans la boutique en ligne.');
      return url;
    } catch (error) {
      console.error('[Brochure] Mise a jour produit impossible:', error);
      setBrochureError("La photo pro est prete, mais la boutique n'a pas accepte la sauvegarde. Reessaie ou recharge la page.");
      return '';
    } finally {
      setProImageLoading(false);
    }
  }

  async function publishProductOnline() {
    if (!brochureProduct?.id) return;
    try {
      let imageUrl = brochureProduct.imageUrl || '';
      if (proImageUrl) {
        imageUrl = await persistProfessionalImageToProduct() || imageUrl;
      }
      const nextImages = imageUrl
        ? [imageUrl, ...(brochureProduct.images || []).filter((image) => image && image !== imageUrl)].slice(0, 6)
        : brochureProduct.images;
      await updateProduct(brochureProduct.id, {
        isActive: true,
        ...(imageUrl ? { imageUrl, images: nextImages } : {}),
      });
      setBrochureProduct({ ...brochureProduct, isActive: true, imageUrl, images: nextImages });
      await loadData();
      setBrochureError('Produit publie dans la boutique en ligne.');
    } catch (error) {
      console.error('[Brochure] Publication produit impossible:', error);
      setBrochureError("Le produit n'a pas pu etre publie avec la photo pro. Reessaie apres quelques secondes.");
    }
  }

  async function renderCommercialBrochureBlob(imageOverride = '', pOverride?: Product | null, cOverride?: ProductBrochureCopy | null) {
    const prod = pOverride ?? brochureProduct;
    const copy = cOverride ?? brochureCopy;
    if (!prod || !copy) return;
      const whatsappNumber = getShopWhatsappNumber(shop);
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas indisponible');

      const width = canvas.width;
      const height = canvas.height;
      const currency = shop?.currency || 'FCFA';
      const price = prod.sellingPrice > 0
        ? `${prod.sellingPrice.toLocaleString('fr-FR')} ${currency}`
        : 'Prix a confirmer';
      const availability = prod.stock > 0
        ? `${prod.stock} disponible${prod.stock > 1 ? 's' : ''}`
        : 'Disponibilite a confirmer';
      const detailRows = [
        { label: 'Categorie', value: prod.category || 'Produit boutique' },
        { label: 'Marque', value: prod.brand || 'Non renseignee' },
        { label: 'Stock', value: availability },
        { label: 'Reference', value: prod.sku || 'Non renseignee' },
        { label: 'Code-barres', value: prod.barcode || 'Non renseigne' },
        { label: 'Unite', value: prod.unit || 'Piece' },
        { label: 'Poids', value: prod.weight || 'Non renseigne' },
      ];
      const specRows = getSpecRows(prod);
      const productStrengths = getProductStrengths(prod, copy);

      function sectionTitle(text: string, x: number, y: number, color = '#0645a8') {
        ctx.fillStyle = color;
        roundRect(ctx, x, y, Math.min(470, Math.max(230, ctx.measureText(text).width + 54)), 48, 18);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 22px Arial';
        ctx.fillText(text.toUpperCase(), x + 24, y + 31);
      }

      function drawSoftCard(x: number, y: number, w: number, h: number, stroke = '#d8e6ff') {
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, x, y, w, h, 26);
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      function drawRows(rows: { label: string; value: string }[], x: number, y: number, labelW: number, valueW: number, rowH: number) {
        rows.forEach((row, idx) => {
          const top = y + idx * rowH;
          ctx.fillStyle = '#eff6ff';
          roundRect(ctx, x, top - 24, 34, 34, 12);
          ctx.fill();
          ctx.fillStyle = '#0645a8';
          ctx.font = '900 15px Arial';
          ctx.fillText(String(idx + 1), x + (idx + 1 > 9 ? 9 : 12), top - 2);
          ctx.fillStyle = '#0645a8';
          ctx.font = '900 21px Arial';
          wrapCanvasText(ctx, row.label, x + 50, top - 7, labelW, 24, 1);
          ctx.fillStyle = '#111827';
          ctx.font = '800 20px Arial';
          wrapCanvasText(ctx, row.value || 'Non renseigne', x + 50 + labelW + 22, top - 7, valueW, 24, 2);
          ctx.strokeStyle = '#e3ecff';
          ctx.beginPath();
          ctx.moveTo(x + 50, top + 30);
          ctx.lineTo(x + labelW + valueW + 90, top + 30);
          ctx.stroke();
        });
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      const heroGradient = ctx.createLinearGradient(0, 0, width, 620);
      heroGradient.addColorStop(0, '#f8fbff');
      heroGradient.addColorStop(1, '#eaf4ff');
      ctx.fillStyle = heroGradient;
      ctx.fillRect(0, 0, width, 620);

      ctx.fillStyle = '#0645a8';
      roundRect(ctx, -18, 0, 310, 56, 0);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px Arial';
      ctx.fillText('FICHE PRODUIT', 28, 37);

      ctx.fillStyle = '#dbeafe';
      ctx.beginPath(); ctx.arc(855, 270, 280, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#bfdbfe';
      ctx.beginPath(); ctx.arc(970, 480, 170, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#061433';
      ctx.font = '900 42px Arial';
      wrapCanvasText(ctx, shop?.name || 'MasterShopPro', 52, 126, 520, 48, 1);
      drawCanvasPill(ctx, 52, 172, copy.badge || 'Produit disponible', '#ff5a0a');

      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 52, 238, 536, 326, 30);
      ctx.fill();
      ctx.strokeStyle = '#d8e6ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0645a8';
      ctx.font = '900 18px Arial';
      ctx.fillText('NOM DU PRODUIT', 86, 292);
      ctx.fillStyle = '#061433';
      const titleLength = prod.name.length;
      ctx.font = titleLength > 38 ? '900 40px Arial' : titleLength > 24 ? '900 46px Arial' : '900 54px Arial';
      wrapCanvasText(ctx, prod.name.toUpperCase(), 86, 356, 460, titleLength > 38 ? 46 : 54, 4);

      const imageForBrochure = imageOverride || proImageUrl || prod.imageUrl;
      if (imageForBrochure) {
        try {
          const img = await loadCanvasImage(imageForBrochure.startsWith('data:') ? imageForBrochure : proxySrc(imageForBrochure));
          const scale = Math.min(390 / img.width, 390 / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, 812 - w / 2, 342 - h / 2, w, h);
        } catch {
          ctx.fillStyle = '#dbeafe';
          roundRect(ctx, 620, 150, 360, 320, 34);
          ctx.fill();
          ctx.fillStyle = '#0645a8';
          ctx.font = '800 44px Arial';
          ctx.fillText('PRODUIT', 690, 320);
        }
      }

      drawSoftCard(52, 650, 976, 138, '#ffd1b5');
      ctx.fillStyle = '#fff7ed';
      roundRect(ctx, 76, 678, 290, 86, 20);
      ctx.fill();
      ctx.fillStyle = '#ff5a0a';
      ctx.font = '900 20px Arial';
      ctx.fillText('PRIX DE VENTE', 106, 708);
      ctx.font = price.length > 17 ? '900 44px Arial' : '900 58px Arial';
      wrapCanvasText(ctx, price, 106, price.length > 17 ? 752 : 758, 235, 46, 1);
      ctx.fillStyle = '#101828';
      ctx.font = '900 26px Arial';
      wrapCanvasText(ctx, availability, 420, 706, 250, 30, 2);
      ctx.fillStyle = '#475467';
      ctx.font = '800 22px Arial';
      wrapCanvasText(ctx, `Commande: ${whatsappNumber || 'via la boutique'}`, 704, 706, 280, 30, 2);

      drawSoftCard(52, 820, 976, 228);
      sectionTitle('Description complete', 76, 846, '#0645a8');
      ctx.fillStyle = '#101828';
      ctx.font = '800 26px Arial';
      wrapCanvasText(
        ctx,
        prod.description || copy.subheadline || 'Ajoute une description dans la fiche produit pour rendre la brochure plus convaincante.',
        82,
        930,
        910,
        34,
        6
      );

      drawSoftCard(52, 1080, 468, 430);
      sectionTitle('Infos produit', 76, 1106, '#ff5a0a');
      drawRows(detailRows, 82, 1190, 150, 190, 42);

      drawSoftCard(552, 1080, 476, 430);
      sectionTitle('Caracteristiques', 576, 1106, '#0645a8');
      drawRows(specRows.slice(0, 8), 582, 1190, 145, 190, 42);

      drawSoftCard(52, 1540, 476, 230);
      sectionTitle('Points forts', 76, 1566, '#0645a8');
      productStrengths.slice(0, 4).forEach((bullet, idx) => {
        const y = 1634 + idx * 44;
        ctx.fillStyle = '#16a34a';
        ctx.beginPath(); ctx.arc(94, y - 7, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 14px Arial';
        ctx.fillText('✓', 89, y - 2);
        ctx.fillStyle = '#101828';
        ctx.font = '800 18px Arial';
        wrapCanvasText(ctx, bullet, 120, y - 16, 350, 21, 2);
      });

      drawSoftCard(552, 1540, 476, 230, '#bbf7d0');
      sectionTitle('Commander', 576, 1566, '#16a34a');
      ctx.fillStyle = '#111827';
      ctx.font = '900 24px Arial';
      ctx.fillText('WhatsApp', 582, 1634);
      ctx.fillStyle = '#16a34a';
      ctx.font = whatsappNumber.length > 18 ? '900 21px Arial' : '900 24px Arial';
      wrapCanvasText(ctx, whatsappNumber || 'Numero disponible sur la boutique', 582, 1668, 390, 28, 2);
      ctx.fillStyle = '#111827';
      ctx.font = '800 19px Arial';
      wrapCanvasText(ctx, copy.cta || 'Contactez la boutique pour commander.', 582, 1728, 390, 25, 1);

      ctx.fillStyle = '#0645a8';
      roundRect(ctx, 96, 1802, 888, 84, 30);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px Arial';
      ctx.fillText('Commandez cette fiche maintenant', 178, 1855);
      ctx.fillStyle = '#ff8a00';
      ctx.beginPath(); ctx.arc(920, 1844, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 38px Arial';
      ctx.fillText('›', 912, 1856);

      ctx.fillStyle = '#052a66';
      ctx.fillRect(0, 1874, width, 46);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 18px Arial';
      ctx.fillText('Fiche produit generee avec MasterShopPro - prete a partager sur WhatsApp', 240, 1904);

      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Export image impossible')), 'image/png');
      });
  }

  async function refreshBrochurePreview(imageOverride = '', pOverride?: Product | null, cOverride?: ProductBrochureCopy | null) {
    const prod = pOverride ?? brochureProduct;
    const copy = cOverride ?? brochureCopy;
    if (!prod || !copy) return '';
    const blob = await renderCommercialBrochureBlob(imageOverride, prod, copy);
    if (!blob) return '';
    const url = URL.createObjectURL(blob);
    setBrochurePreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });
    return url;
  }

  async function generateCompleteBrochure() {
    if (!brochureProduct) return;
    setBrochureLoading(true);
    setBrochureError('');
    try {
      let imageForPreview = proImageUrl;
      if (!imageForPreview && brochureProduct.imageUrl) {
        imageForPreview = await generateProfessionalProductImage();
      }
      await refreshBrochurePreview(imageForPreview);
      setBrochureError('Brochure prete avec la photo pro. Tu peux partager ou telecharger.');
    } catch (error) {
      console.error('[Brochure] Generation complete impossible:', error);
      setBrochureError("La brochure n'a pas pu etre preparee automatiquement. Essaie Telecharger.");
    } finally {
      setBrochureLoading(false);
    }
  }

  async function downloadBrochure() {
    if (!brochureProduct || !brochureCopy) return;
    try {
        const blob = await renderCommercialBrochureBlob();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `brochure-${brochureProduct.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('[Brochure] Telechargement impossible:', error);
      alert("Le telechargement a bloque sur ce navigateur. Reessaie apres avoir sauvegarde la photo du produit, ou copie le message WhatsApp.");
    }
  }

  async function nativeShareBlob(blob: Blob, filename: string, title: string, text: string) {
    // Capacitor (Android WebView) — Filesystem + Share avec files:[uri]
    try {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([
        import('@capacitor/filesystem'),
        import('@capacitor/share'),
      ]);
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
      const path = `mastershop_${Date.now()}.png`;
      await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache });
      const { uri } = await Filesystem.getUri({ path, directory: Directory.Cache });
      await Share.share({ title, text, files: [uri], dialogTitle: 'Partager' });
      Filesystem.deleteFile({ path, directory: Directory.Cache }).catch(() => {});
      return;
    } catch (e: any) {
      // AbortError = user cancelled → ne pas continuer
      if (e?.name === 'AbortError') return;
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('cancel') || msg.includes('dismiss')) return;
      // sinon : Capacitor non dispo → fallback web
    }

    // Web Share API avec fichiers (navigateur standard hors Capacitor)
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title, text, files: [file] });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }

    // Dernier recours : télécharger + ouvrir WhatsApp avec le texte
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setTimeout(() => {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }, 800);
  }

  async function shareBrochure() {
    if (!brochureProduct || !brochureCopy) return;
    try {
      const blob = await renderCommercialBrochureBlob();
      if (!blob) return;
      await nativeShareBlob(
        blob,
        `brochure-${brochureProduct.name}.png`,
        brochureProduct.name,
        brochureCopy.whatsappCaption
      );
    } catch (error) {
      console.error('[Brochure] Partage impossible:', error);
    }
  }

  const margin=calculateMargin(parseFloat(form.costPrice)||0, parseFloat(form.sellingPrice)||0);
  const filtered=products.filter(p=>(p.name.toLowerCase().includes(search.toLowerCase())||p.category.toLowerCase().includes(search.toLowerCase()))&&(!catFilter||p.category===catFilter));
  const activeProducts = products.filter(p => p.isActive).length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5)).length;
  const sellableStockValue = products.reduce((s, p) => s + (p.sellingPrice||0) * (p.stock||0), 0);
  const pc='#25D366';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:pc}}/></div>;

  return (
    <div className="space-y-5">
      {limits&&!limits.canAddProduct&&(
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><AlertTriangle className="w-6 h-6 text-amber-500"/><div><p className="font-semibold text-amber-800">Limite de produits atteinte</p><p className="text-sm text-amber-600">{limits.productsCount}/{limits.plan.maxProducts} produits</p></div></div>
          <Link href="/admin/subscription" className="btn-primary flex items-center gap-2 text-sm" style={{backgroundColor:pc}}><Crown className="w-4 h-4"/>Upgrade</Link>
        </div>
      )}
      {studioCredits>=0&&studioCredits<10&&(
        <div className="rounded-2xl p-4 flex items-center justify-between border" style={{background:'linear-gradient(135deg,#fff7ed,#fef3c7)',borderColor:'#fed7aa'}}>
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Wand2 className="w-5 h-5 text-orange-500"/></div><div><p className="font-bold text-orange-800 text-sm">Studio Photo IA - {studioCredits} credit{studioCredits!==1?'s':''} restant{studioCredits!==1?'s':''}</p><p className="text-xs text-orange-600">Pack 50 = 1 500 FCFA · Pack 200 = 5 000 FCFA · Pack 500 = 10 000 FCFA</p></div></div>
          <button onClick={()=>setShowCreditsModal(true)} className="text-xs font-bold px-4 py-2 rounded-xl text-white shadow-sm" style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>Recharger</button>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[2.25rem] shadow-hi" style={{ background: '#0B1220' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 88% 12%, rgba(31,185,85,0.32), transparent 50%), radial-gradient(circle at 8% 88%, rgba(255,106,44,0.18), transparent 55%)' }} />
        <div className="relative px-6 sm:px-8 py-8 sm:py-10 text-white">
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.22em] uppercase text-white/60">
            <span className="pulse-dot" /> Tableau de bord · Produits
          </div>
          <h1 className="display-serif text-4xl sm:text-5xl lg:text-6xl mt-3 leading-[1.02]">
            Ajoute un produit.<br /><em className="italic" style={{ color: '#1FB955' }}>L'IA fait la fiche.</em>
          </h1>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={openAdd} className="btn-primary px-6 text-sm"><Plus className="w-5 h-5" />Nouveau produit</button>
            <button onClick={openQuickSell}
                    className="btn px-5 py-3 text-sm rounded-full font-extrabold"
                    style={{ background: 'rgba(255,106,44,0.22)', border: '1.5px solid rgba(255,106,44,0.45)', color: '#FFB89A' }}>
              <Zap className="w-4 h-4" />⚡ Quick Sell
            </button>
            <button onClick={() => setShowCatModal(true)} className="btn px-5 py-3 text-sm rounded-full" style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white' }}>+ Catégorie</button>
          </div>
        </div>
        <div className="relative grid grid-cols-2 sm:grid-cols-4 border-t border-white/10">
          <StatCell label="Visibles" value={String(activeProducts)} sub={`/ ${products.length} total`} accent="#1FB955" />
          <StatCell label="Alertes stock" value={String(lowStockProducts)} sub="< 5 unités" accent={lowStockProducts ? '#FF6A2C' : 'rgba(255,255,255,0.6)'} />
          <StatCell label="Valeur stock" value={formatPriceCompact(sellableStockValue)} sub={shop?.currency || 'FCFA'} accent="#FFFFFF" />
          <StatCell label="Crédits IA" value={String(studioCredits ?? 0)} sub="photos" accent="#3F7BDC" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-gray-100 rounded-3xl p-3 shadow-sm">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/><input type="text" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} className="input pl-10"/></div>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="select w-full sm:w-48"><option value="">Toutes categories</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select>
        <button onClick={()=>setShowCatModal(true)} className="btn-outline text-sm whitespace-nowrap">Categories</button>
      </div>

      {filtered.length>0?(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(product=>(
            <div key={product.id} className={`premium-card overflow-hidden ${!product.isActive ? 'opacity-75' : ''}`}>
              <div className="relative bg-gradient-to-br from-gray-50 to-emerald-50" style={{aspectRatio:'1'}}>
                {product.imageUrl
                  ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4"/>
                  : <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-gray-300"/></div>}
                {/* Indicateur multi-photos */}
                {(product as any).images?.length > 0 && (
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    +{(product as any).images.length} photo{(product as any).images.length > 1 ? 's' : ''}
                  </div>
                )}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black ${product.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {product.isActive ? 'En ligne' : 'Masque'}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><h3 className="font-black text-gray-900 truncate">{product.name}</h3>{product.isFeatured&&<Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0"/>}</div>
                    <p className="text-sm text-gray-500 truncate">{product.category}{product.brand&&` · ${product.brand}`}</p>
                  </div>
                  <button onClick={()=>openEdit(product)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-blue-500"><Edit className="w-4 h-4"/></button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-2xl bg-emerald-50 px-3 py-2">
                    <p className="text-[10px] uppercase text-emerald-600 font-black">Prix</p>
                    <p className="text-lg font-black text-emerald-700">{formatPrice(product.sellingPrice,shop?.currency)}</p>
                  </div>
                  <div className={`rounded-2xl px-3 py-2 ${product.stock<=(product.minStock||5)?'bg-red-50':'bg-gray-50'}`}>
                    <p className={`text-[10px] uppercase font-black ${product.stock<=(product.minStock||5)?'text-red-500':'text-gray-400'}`}>Stock</p>
                    <p className={`text-lg font-black ${product.stock<=(product.minStock||5)?'text-red-700':'text-gray-900'}`}>{product.stock}</p>
                  </div>
                </div>
                <div className="grid grid-cols-[1fr,auto,auto] gap-2">
                  <button
                    onClick={() => openBrochure(product)}
                    className="py-3 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    style={{background:'linear-gradient(135deg,#0f766e,#25D366)'}}
                  >
                    <Sparkles className="w-4 h-4"/>
                    Fiche + partage
                  </button>
                  <button
                    onClick={() => openPromoModal(product)}
                    title="Fiche Promo"
                    className="py-3 px-3 rounded-2xl text-white flex items-center justify-center shadow-sm hover:-translate-y-0.5 transition-all"
                    style={{background:'linear-gradient(135deg,#dc2626,#ea580c)'}}
                  >
                    <Zap className="w-4 h-4"/>
                  </button>
                  {shop?.whatsapp ? (
                    <a
                      href={getWhatsAppLink(shop.whatsapp, `Bonjour, je veux partager ce produit: ${product.name}\nPrix: ${formatPrice(product.sellingPrice, shop?.currency)}`)}
                      target="_blank"
                      className="w-12 h-12 rounded-2xl bg-green-50 text-green-700 border border-green-100 flex items-center justify-center hover:bg-green-100"
                      title="Partager sur WhatsApp"
                    >
                      <Share2 className="w-4 h-4"/>
                    </a>
                  ) : (
                    <button onClick={()=>handleDelete(product.id!)} className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-100" title="Supprimer">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
                </div>
                {shop?.whatsapp&&(
                  <button onClick={()=>handleDelete(product.id!)} className="mt-2 text-xs text-gray-400 hover:text-red-500 font-bold">
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ):(
        <div className="card text-center py-12"><Package className="w-16 h-16 mx-auto text-gray-300 mb-4"/><p className="text-gray-500">Aucun produit trouve</p><button onClick={openAdd} className="btn-primary mt-4" style={{backgroundColor:pc}}><Plus className="w-5 h-5 inline mr-2"/>Ajouter un produit</button></div>
      )}

      {/* =========== PRODUCT MODAL =========== */}
      {showModal&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">{editing?'Modifier':'Nouveau'} produit</h2>
              <button onClick={()=>{setShowModal(false);stopCam();}} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-sm font-black text-emerald-900">Parcours simple</p>
                <p className="text-xs text-emerald-700 mt-1">Photo du produit → l'IA remplit la fiche → tu sauvegardes → tu generes la brochure a partager.</p>
              </div>

              {/* PHOTO PRINCIPALE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Photo principale</label>
                  {(photoMode==='done'||form.imageUrl)&&(
                    <button type="button" onClick={()=>setShowStudio(true)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white shadow-sm" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>
                      <Wand2 className="w-3.5 h-3.5"/>Studio IA
                      {studioCredits>0&&<span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{studioCredits}</span>}
                    </button>
                  )}
                </div>

                {photoMode==='camera'&&(
                  <div className="relative rounded-2xl overflow-hidden bg-black mb-2">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{maxHeight:'60vw',objectFit:'cover'}}/>
                    <canvas ref={canvasRef} className="hidden"/>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative border-2 border-white/70 rounded-xl" style={{width:'72%',aspectRatio:'1'}}>
                        {(['top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl','top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl','bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl','bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl'] as const).map(cls=><div key={cls} className={`absolute w-6 h-6 border-white ${cls}`}/>)}
                      </div>
                    </div>
                    <p className="absolute top-3 left-0 right-0 text-center text-white/80 text-xs drop-shadow">Centrez le produit dans le cadre</p>
                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                      <button type="button" onClick={stopCam} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm"><StopCircle className="w-4 h-4"/>Annuler</button>
                      <button type="button" onClick={captureCam} className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"><div className="w-12 h-12 rounded-full border-4 border-gray-300"/></button>
                      <button type="button" onClick={flipCamera} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm"><RefreshCw className="w-4 h-4"/>Flip</button>
                    </div>
                  </div>
                )}

                {photoMode==='crop'&&rawSrc&&(
                  <div className="mb-2">
                    <p className="text-xs text-center text-gray-500 mb-2">Glissez pour repositionner</p>
                    <div className="flex justify-center mb-3">
                      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed cursor-grab active:cursor-grabbing select-none touch-none bg-gray-50" style={{width:FRAME,height:FRAME,borderColor:pc}} onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerLeave={onPU}>
                        {(['top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl','top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl','bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl','bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl'] as const).map(cls=><div key={cls} className={`absolute w-7 h-7 z-10 pointer-events-none ${cls}`} style={{borderColor:pc}}/>)}
                        <img ref={cropImgRef} src={rawSrc} alt="" draggable={false} className="absolute pointer-events-none" style={{left:cropOff.x,top:cropOff.y,width:imgNat.w*cropScale,height:imgNat.h*cropScale,transform:`rotate(${cropRot}deg)`,transformOrigin:'center'}}/>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-center mb-3">
                      <button type="button" onClick={()=>setCropScale(s=>Math.max(0.1,s-0.08))} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200"><ZoomOut className="w-4 h-4"/></button>
                      <input type="range" min="0.1" max="6" step="0.02" value={cropScale} onChange={e=>setCropScale(+e.target.value)} className="w-32 accent-emerald-500"/>
                      <button type="button" onClick={()=>setCropScale(s=>Math.min(6,s+0.08))} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200"><ZoomIn className="w-4 h-4"/></button>
                      <button type="button" onClick={()=>setCropRot(r=>(r+90)%360)} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200"><RotateCw className="w-4 h-4"/></button>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={()=>{setPhotoMode('none');setRawSrc('');}} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-600">Annuler</button>
                      <button type="button" onClick={applyCrop} className="flex-1 py-2.5 rounded-xl text-sm text-white font-semibold flex items-center justify-center gap-2" style={{backgroundColor:pc}}><Check className="w-4 h-4"/>Confirmer</button>
                    </div>
                  </div>
                )}

                {photoMode==='done'&&photoPreview&&(
                  <div className="mb-2">
                    <div className="relative w-full overflow-hidden rounded-2xl bg-white border border-gray-100" style={{aspectRatio:'1'}}>
                      <img src={photoPreview} alt="Apercu" className="w-full h-full object-contain p-2"/>
                      {isAnalyzing&&<div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl backdrop-blur-sm"><div className="text-center text-white"><Sparkles className="w-10 h-10 mx-auto mb-2 text-purple-300 animate-pulse"/><p className="font-bold text-sm">IA analyse...</p></div></div>}
                      {photoMode==='done'&&!isAnalyzing&&(
                        <button type="button" onClick={()=>setShowStudio(true)}
                                className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold shadow-md"
                                style={{ background: 'rgba(124,58,237,0.88)', color: 'white', backdropFilter: 'blur(4px)' }}>
                          <Wand2 className="w-3 h-3"/>Studio IA
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <button type="button" onClick={()=>{setPhotoPreview('');setPhotoFile(null);setPhotoMode('none');setForm(f=>({...f,imageUrl:''}));resetPhoto();}} className="py-2 bg-red-50 text-red-500 text-xs rounded-xl hover:bg-red-100 font-medium">Supprimer</button>
                      <button type="button" onClick={()=>rawSrc?setPhotoMode('crop'):fileInputRef.current?.click()} className="py-2 bg-gray-100 text-gray-600 text-xs rounded-xl hover:bg-gray-200 font-medium">Recadrer</button>
                      <button type="button" onClick={()=>setShowStudio(true)} className="py-2 text-white text-xs rounded-xl font-bold flex items-center justify-center gap-1" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}><Wand2 className="w-3 h-3"/>Studio</button>
                    </div>
                    <button type="button" onClick={generateModalProPhoto} disabled={modalProLoading}
                            className="mt-2 w-full py-2.5 text-white text-[11.5px] rounded-xl font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-60 transition hover:-translate-y-0.5"
                            style={{background:'linear-gradient(135deg,#7c3aed,#4c1d95)'}}>
                      {modalProLoading?<><Loader2 className="w-3.5 h-3.5 animate-spin"/>Génération en cours...</>:<><Sparkles className="w-3.5 h-3.5"/>Photo Pro IA{studioCredits>=3?<span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">3 crédits</span>:<span className="ml-1 text-violet-300 text-[10px]">— {studioCredits} crédit{studioCredits!==1?'s':''} (recharger)</span>}</>}
                    </button>
                  </div>
                )}

                {!photoPreview&&form.imageUrl&&photoMode==='none'&&(
                  <div className="relative mb-2 w-full overflow-hidden rounded-2xl bg-white border border-gray-100" style={{aspectRatio:'1'}}>
                    <img src={form.imageUrl} alt="Actuelle" className="w-full h-full object-contain p-2"/>
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">Actuelle</div>
                    <button type="button" onClick={()=>{setRawSrc(form.imageUrl);setShowStudio(true);setPhotoMode('done');setPhotoPreview(form.imageUrl);}} className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-xl text-white shadow" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}><Wand2 className="w-3 h-3"/>Studio IA</button>
                  </div>
                )}

                {photoMode==='none'&&!photoPreview&&(
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={()=>fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-300 rounded-2xl text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50"><ImageIcon className="w-4 h-4"/>Importer & cadrer</button>
                    <button type="button" onClick={startCam} className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm text-white font-semibold" style={{background:`linear-gradient(135deg,${pc},${pc}bb)`}}><Camera className="w-4 h-4"/>Photo + IA</button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
                {photoMode==='none'&&!photoPreview&&!form.imageUrl&&<p className="text-xs text-gray-400 mt-2 text-center">Gemini + GPT-4o remplissent les champs automatiquement</p>}
              </div>

              {/* ── 3 ANGLES PRODUIT ── */}
              {(photoMode==='done'||form.imageUrl) && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-gray-800">3 angles pour la brochure</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Face avant déjà prise · Ajoute côté + détail pour une brochure complète</p>
                    </div>
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i===0 ? 'bg-emerald-500' : extraPhotos[i-1] ? 'bg-emerald-500' : 'bg-gray-200'}`}/>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Angle 1 — Face avant (déjà pris) */}
                    <div className="relative rounded-xl overflow-hidden border-2 border-emerald-400 bg-white" style={{aspectRatio:'1'}}>
                      {(photoPreview||form.imageUrl) && (
                        <img src={photoPreview||form.imageUrl} alt="Vue face" className="w-full h-full object-contain p-1"/>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-white text-[9px] font-extrabold text-center py-0.5">✓ FACE</div>
                    </div>
                    {/* Angles 2 & 3 */}
                    {[
                      { idx:0, label:'CÔTÉ', hint:'Vue de côté' },
                      { idx:1, label:'DÉTAIL', hint:'Zoom / détail' },
                    ].map(({idx, label, hint}) => (
                      <div key={idx}>
                        {extraPhotos[idx] ? (
                          <div className="relative rounded-xl overflow-hidden border-2 border-emerald-400 bg-white" style={{aspectRatio:'1'}}>
                            <img src={extraPhotos[idx]} alt={label} className="w-full h-full object-contain p-1"/>
                            <button type="button"
                              onClick={() => setExtraPhotos(prev => { const next=[...prev]; next.splice(idx,1); return next; })}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white">
                              <X className="w-3 h-3"/>
                            </button>
                            <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-white text-[9px] font-extrabold text-center py-0.5">✓ {label}</div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all" style={{aspectRatio:'1'}}>
                            {uploadingExtra ? (
                              <Loader2 className="w-5 h-5 text-gray-400 animate-spin"/>
                            ) : (
                              <>
                                <Camera className="w-5 h-5 text-gray-300 mb-1"/>
                                <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wide">{label}</span>
                                <span className="text-[9px] text-gray-300">{hint}</span>
                              </>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={async e => {
                              const file = e.target.files?.[0]; if (!file) return;
                              await uploadExtraPhoto(file, idx);
                              e.target.value='';
                            }}/>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                  {extraPhotos.length > 0 && (
                    <p className="text-[11px] text-emerald-700 font-extrabold">
                      ✓ {extraPhotos.length + 1}/3 angle{extraPhotos.length > 0 ? 's' : ''} — brochure {extraPhotos.length >= 2 ? 'complète' : 'partielle'}
                    </p>
                  )}
                </div>
              )}

              {isAnalyzing&&photoMode==='done'&&(
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3">
                  <Sparkles className="w-5 h-5 text-purple-500 animate-pulse"/>
                  <p className="text-sm text-purple-700 font-medium">IA analyse - les champs se remplissent...</p>
                </div>
              )}

              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label><input type="text" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input" placeholder="Nom du produit"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description {form.description&&<span className="text-xs text-green-500 ml-1">✓ IA</span>}</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="textarea" rows={2} placeholder="Description attrayante"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Caracteristiques {form.specifications&&<span className="text-xs text-green-500 ml-1">✓ IA</span>}</label><textarea value={form.specifications} onChange={e=>setForm({...form,specifications:e.target.value})} className="textarea font-mono text-xs" rows={3} placeholder={"Couleur: \nMatiere: \nDimensions: "}/></div>
              {/* ── CATÉGORIE — Smart Chips ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Catégorie
                    {form.category && <span className="ml-2 text-xs text-emerald-600 font-extrabold">✓ {form.category}</span>}
                  </label>
                  <button type="button" onClick={()=>setShowCatModal(true)}
                    className="text-[11px] font-extrabold text-wa-dark hover:text-wa underline-offset-2 hover:underline">
                    + Créer
                  </button>
                </div>
                {/* AI suggestion */}
                {aiAnalysis?.category && !form.category && (
                  <button type="button"
                    onClick={()=>setForm({...form,category:aiAnalysis.category})}
                    className="mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all">
                    <Sparkles className="w-3.5 h-3.5"/>
                    IA suggère : {aiAnalysis.category}
                  </button>
                )}
                {/* Preset chips + existing categories */}
                <div className="flex flex-wrap gap-2">
                  {[
                    ...['Vêtements','Cosmétiques','Alimentaire','Électronique','Maison','Artisanat','Accessoires','Autre'],
                    ...categories.map(c=>c.name).filter(n=>!['Vêtements','Cosmétiques','Alimentaire','Électronique','Maison','Artisanat','Accessoires','Autre'].includes(n)),
                  ].map(cat => (
                    <button type="button" key={cat}
                      onClick={()=>setForm({...form,category:form.category===cat?'':cat})}
                      className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                        form.category===cat
                          ? 'bg-wa text-white shadow-wa'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Marque</label><input type="text" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} className="input" placeholder="Samsung, Nike..."/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prix d'achat *</label><input type="number" required min="0" value={form.costPrice} onChange={e=>setForm({...form,costPrice:e.target.value})} className="input"/></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente *</label>
                  <input type="number" required min="0" value={form.sellingPrice} onChange={e=>setForm({...form,sellingPrice:e.target.value})} className="input"/>
                  {(() => {
                    const cost = parseFloat(form.costPrice) || 0;
                    const sell = parseFloat(form.sellingPrice) || 0;
                    if (!sell || !cost) return null;
                    if (sell < cost) return (
                      <p className="text-xs mt-1 font-extrabold text-red-600 flex items-center gap-1">
                        ⚠️ Tu vends à perte ! Prix coût : {cost.toLocaleString('fr-FR')} {shop?.currency||'FCFA'}
                      </p>
                    );
                    if (sell === cost) return (
                      <p className="text-xs mt-1 font-extrabold text-red-500">⚠️ Marge nulle — pas de bénéfice</p>
                    );
                    const m = Math.round(((sell - cost) / cost) * 100);
                    if (m < 15) return (
                      <p className="text-xs mt-1 font-extrabold text-amber-600">⚠️ Marge {m}% — trop faible, risque de perte</p>
                    );
                    if (m < 30) return (
                      <p className="text-xs mt-1 font-bold text-amber-500">Marge {m}% — correcte mais peut mieux faire</p>
                    );
                    return (
                      <p className="text-xs mt-1 font-extrabold text-emerald-600">✓ Marge {m}% — bonne</p>
                    );
                  })()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label><input type="number" required min="0" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} className="input"/></div>
              </div>
              <details className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <summary className="cursor-pointer text-sm font-bold text-gray-700">Options avancees</summary>
                <div className="mt-3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU</label><input type="text" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} className="input font-mono text-sm" placeholder="REF-001"/></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Code-barres</label><input type="text" value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})} className="input font-mono text-sm" placeholder="0123456789" inputMode="numeric"/></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock min. alerte</label><input type="number" min="0" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} className="input"/></div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})} className="w-5 h-5 rounded"/><span className="text-sm">Actif (visible)</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFeatured} onChange={e=>setForm({...form,isFeatured:e.target.checked})} className="w-5 h-5 rounded"/><span className="text-sm">Mis en avant</span></label>
                  </div>
                </div>
              </details>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowModal(false);stopCam();}} className="btn-secondary flex-1">Annuler</button>
                <button
                  type="submit"
                  name="afterSave"
                  value="brochure"
                  disabled={saving||uploadingPhoto||uploadingExtra||photoMode==='crop'}
                  className="flex-1 py-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 disabled:opacity-60"
                >
                  <FileText className="w-4 h-4"/>
                  Sauvegarder + brochure
                </button>
                <button type="submit" disabled={saving||uploadingPhoto||uploadingExtra||photoMode==='crop'} className="btn-primary flex-1 flex items-center justify-center gap-2" style={{backgroundColor:pc}}>
                  {(saving||uploadingPhoto||uploadingExtra)&&<Loader2 className="w-5 h-5 animate-spin"/>}
                  {photoMode==='crop'?"Confirmez d'abord le cadrage":uploadingPhoto||uploadingExtra?'Upload...':saving?'Sauvegarde...':'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========== STUDIO BROCHURE PRODUIT =========== */}
      {brochureProduct&&brochureCopy&&(
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[65] p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[96vh] flex flex-col">
            <div className="px-5 py-4 flex items-center justify-between" style={{background:'linear-gradient(135deg,#052e25,#0f766e)'}}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center"><Sparkles className="w-5 h-5 text-emerald-200"/></div>
                <div>
                  <p className="font-extrabold text-white text-lg">Brochure produit</p>
                  <p className="text-emerald-100 text-xs">Photo, prix, arguments et partage en un seul endroit</p>
                </div>
              </div>
              <button onClick={()=>setBrochureProduct(null)} className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25"><X className="w-4 h-4 text-white"/></button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6 grid lg:grid-cols-[430px,1fr] gap-6 bg-slate-50">
              <div className="space-y-4">
                <div className="rounded-[2rem] bg-white shadow-xl border border-emerald-100 overflow-hidden">
                  <div className="p-4" style={{background:'linear-gradient(135deg,#052e25,#0f766e)'}}>
                    <div className="flex items-center justify-between text-white">
                      <span className="text-sm font-extrabold">{shop?.name || 'MasterShopPro'}</span>
                      <span className="text-[11px] font-bold bg-white/15 px-3 py-1 rounded-full">WhatsApp ready</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="rounded-3xl bg-slate-50 overflow-hidden border border-slate-100" style={{aspectRatio: brochurePreviewUrl ? '1080 / 1920' : '1'}}>
                      {brochurePreviewUrl ? (
                        <img src={brochurePreviewUrl} alt={`Brochure ${brochureProduct.name}`} className="w-full h-full object-contain bg-white"/>
                      ) : proImageLoading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-emerald-700">
                          <Loader2 className="w-10 h-10 animate-spin mb-3"/>
                          <p className="text-sm font-extrabold">Creation image pro...</p>
                          <p className="text-xs text-slate-400 mt-1">On garde le produit semblable</p>
                        </div>
                      ) : (proImageUrl || brochureProduct.imageUrl)
                        ? <img src={proImageUrl || brochureProduct.imageUrl} alt={brochureProduct.name} className="w-full h-full object-contain p-4"/>
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-slate-300"/></div>}
                    </div>
                    <div className="inline-flex px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-100">
                      {brochureCopy.badge}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-950 leading-tight">{brochureCopy.headline}</h3>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">{brochureCopy.subheadline}</p>
                    </div>
                    <div className="grid gap-2">
                      {getProductStrengths(brochureProduct, brochureCopy).slice(0,3).map((bullet, idx)=>(
                        <div key={`${bullet}-${idx}`} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</span>
                          {bullet}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl bg-slate-950 text-white px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-extrabold">{brochureCopy.cta}</span>
                      <Share2 className="w-4 h-4 text-emerald-300"/>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={downloadBrochure} className="py-3.5 rounded-2xl text-white font-extrabold flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 transition-all" style={{background:'linear-gradient(135deg,#0f766e,#25D366)'}}>
                    <Download className="w-4 h-4"/>
                    Telecharger
                  </button>
                  <button onClick={printProductSheet} className="py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 font-extrabold flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50">
                    <FileText className="w-4 h-4"/>
                    PDF
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600">Produit</p>
                      <h2 className="text-2xl font-black text-slate-950 mt-1">{brochureProduct.name}</h2>
                      <p className="text-sm text-slate-500">{brochureProduct.category} · {formatPrice(brochureProduct.sellingPrice, shop?.currency)}</p>
                    </div>
                    {brochureLoading&&<div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-2xl"><Loader2 className="w-4 h-4 animate-spin"/>IA...</div>}
                  </div>
                  {brochureError&&<p className="mt-3 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2">{brochureError}</p>}
                  <div className="grid sm:grid-cols-2 gap-3 mt-5">
                    <button onClick={generateProfessionalProductImage} disabled={proImageLoading || !brochureProduct.imageUrl} className="py-3 rounded-2xl bg-violet-50 text-violet-800 font-extrabold text-sm border border-violet-100 hover:bg-violet-100 flex items-center justify-center gap-2 disabled:opacity-60">
                      {proImageLoading?<Loader2 className="w-4 h-4 animate-spin"/>:<Sparkles className="w-4 h-4"/>}
                      Generer photo pro
                    </button>
                    <button onClick={generateCompleteBrochure} disabled={brochureLoading || proImageLoading} className="py-3 rounded-2xl bg-emerald-50 text-emerald-800 font-extrabold text-sm border border-emerald-100 hover:bg-emerald-100 flex items-center justify-center gap-2 disabled:opacity-60">
                      {brochureLoading?<Loader2 className="w-4 h-4 animate-spin"/>:<Wand2 className="w-4 h-4"/>}
                      Generer brochure
                    </button>
                    {(brochureProduct as any)?.brochureImageUrl && (
                      <button onClick={() => brochureProduct && openBrochure(brochureProduct, true)} disabled={brochureLoading} className="py-3 rounded-2xl bg-amber-50 text-amber-800 font-extrabold text-sm border border-amber-100 hover:bg-amber-100 flex items-center justify-center gap-2 disabled:opacity-60 col-span-2">
                        <RefreshCw className="w-4 h-4"/>
                        Regenerer (4 credits)
                      </button>
                    )}
                    <button onClick={shareBrochure} className="py-3 rounded-2xl bg-slate-950 text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-slate-800">
                      <Share2 className="w-4 h-4"/>
                      Partager brochure
                    </button>
                    <button onClick={publishProductOnline} className="py-3 rounded-2xl bg-blue-50 text-blue-800 font-extrabold text-sm border border-blue-100 hover:bg-blue-100 flex items-center justify-center gap-2">
                      <Package className="w-4 h-4"/>
                      Mettre en boutique
                    </button>
                    {proImageUrl&&(
                      <button onClick={saveProfessionalImageToProduct} disabled={proImageLoading} className="py-3 rounded-2xl bg-orange-50 text-orange-800 font-extrabold text-sm border border-orange-100 hover:bg-orange-100 flex items-center justify-center gap-2 disabled:opacity-60">
                        {proImageLoading?<Loader2 className="w-4 h-4 animate-spin"/>:<Download className="w-4 h-4"/>}
                        Enregistrer photo pro
                      </button>
                    )}
                    <button onClick={copyBrochureText} className="py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-slate-50">
                      <Copy className="w-4 h-4"/>
                      {brochureCopied?'Message copie !':'Copier message'}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400 mb-3">Message WhatsApp pret</p>
                  <textarea
                    value={brochureCopy.whatsappCaption}
                    onChange={e=>setBrochureCopy({...brochureCopy, whatsappCaption:e.target.value})}
                    className="w-full min-h-[160px] rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-3 text-xs text-slate-500">Le client ne voit pas l'IA. Il voit un message propre, court et rassurant.</p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400 mb-3">Caracteristiques partageables</p>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 whitespace-pre-line min-h-[90px]">
                    {brochureProduct.specifications || 'Ajoute des caracteristiques dans la fiche produit pour enrichir la brochure PDF.'}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">La fiche PDF regroupe image, prix, benefices, caracteristiques et message client.</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    ['Statut WhatsApp', 'Format vertical 4:5 lisible sur mobile'],
                    ['Facebook', 'Visuel propre pour post produit'],
                    ['Catalogue', 'Prix, benefices et CTA au meme endroit'],
                  ].map(([title, text])=>(
                    <div key={title} className="bg-white rounded-3xl border border-slate-200 p-4">
                      <p className="font-extrabold text-slate-900 text-sm">{title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========== STUDIO PHOTO IA =========== */}
      {showStudio&&(
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
            <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{background:'linear-gradient(135deg,#4c1d95,#7c3aed)'}}>
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center"><Wand2 className="w-5 h-5 text-white"/></div><div><p className="font-extrabold text-white text-base">Studio Photo IA</p><p className="text-violet-300 text-xs">Optimisez pour vendre plus</p></div></div>
              <div className="flex items-center gap-2"><div className="bg-white/20 px-3 py-1 rounded-full text-white text-xs font-bold">{studioCredits} credit{studioCredits!==1?'s':''}</div><button onClick={()=>setShowStudio(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"><X className="w-4 h-4 text-white"/></button></div>
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="p-4 bg-gray-50 border-b">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 text-center">Apercu temps reel</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center"><div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm" style={{aspectRatio:'1'}}>{rawSrc&&<img src={rawSrc} alt="Original" className="w-full h-full object-contain"/>}</div><p className="text-xs text-gray-400 mt-1.5 font-medium">Original</p></div>
                  <div className="text-center"><div className="rounded-2xl overflow-hidden border-2 shadow-sm" style={{aspectRatio:'1',borderColor:'#7c3aed',background:studio.bgWhite?'#fff':'#f0f0f0'}}>{studioPreview?<img src={studioPreview} alt="Apercu" className="w-full h-full object-contain"/>:rawSrc&&<img src={rawSrc} alt="Apercu" className="w-full h-full object-contain" style={{filter:buildFilter(studio)}}/>}</div><p className="text-xs font-bold mt-1.5" style={{color:'#7c3aed'}}>Resultat</p></div>
                </div>
              </div>
              {aiAnalysis&&(
                <div className="mx-4 mt-4 bg-violet-50 border border-violet-200 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-violet-600"/><p className="text-xs font-bold text-violet-700">Analyse IA</p><div className="ml-auto bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Score: {aiAnalysis.quality_score}/100</div></div>
                  <button type="button" onClick={()=>setStudio(prev=>({...prev,brightness:aiAnalysis.brightness_adj||0,contrast:aiAnalysis.contrast_adj||0}))} className="mt-2 w-full text-xs font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 py-1.5 rounded-xl transition-colors">Appliquer les suggestions IA</button>
                </div>
              )}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1"><SlidersHorizontal className="w-4 h-4 text-gray-500"/><p className="font-bold text-gray-700 text-sm">Reglages</p></div>
                <StudioSlider label="Luminosite" icon={Sun} value={studio.brightness} min={-100} max={100} onChange={v=>setStudio(s=>({...s,brightness:v}))} color="#f59e0b"/>
                <StudioSlider label="Contraste" icon={Contrast} value={studio.contrast} min={-100} max={100} onChange={v=>setStudio(s=>({...s,contrast:v}))} color="#6366f1"/>
                <StudioSlider label="Saturation" icon={Eye} value={studio.saturation} min={-100} max={100} onChange={v=>setStudio(s=>({...s,saturation:v}))} color="#ec4899"/>
                <StudioSlider label="Nettete" icon={Zap} value={studio.sharpness} min={0} max={100} onChange={v=>setStudio(s=>({...s,sharpness:v}))} color="#14b8a6"/>
                <StudioSlider label="Chaleur" icon={Sun} value={studio.warmth} min={-50} max={50} onChange={v=>setStudio(s=>({...s,warmth:v}))} color="#f97316"/>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 bg-white border-2 border-gray-300 rounded-xl shadow-sm"/><div><p className="text-sm font-semibold text-gray-700">Fond blanc pur</p><p className="text-xs text-gray-400">Ideal pour e-commerce</p></div></div>
                  <button type="button" onClick={()=>setStudio(s=>({...s,bgWhite:!s.bgWhite}))} className={`w-12 h-6 rounded-full transition-all relative ${studio.bgWhite?'bg-violet-600':'bg-gray-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${studio.bgWhite?'left-7':'left-1'}`}/></button>
                </div>
                <button type="button" onClick={()=>setStudio(DEFAULT_STUDIO)} className="w-full py-2.5 text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2"><RefreshCw className="w-3.5 h-3.5"/>Reinitialiser</button>
              </div>
            </div>
            <div className="p-4 border-t flex-shrink-0 bg-white">
              {studioCredits<=0?(
                <div className="space-y-2">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center"><p className="text-sm font-bold text-orange-700">Credits epuises</p></div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={applyStudio} className="py-3 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 flex items-center justify-center gap-2">{applyingStudio?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}Appliquer</button>
                    <button type="button" onClick={()=>{setShowStudio(false);setShowCreditsModal(true);}} className="py-3 rounded-xl text-sm font-bold text-white" style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>Recharger</button>
                  </div>
                </div>
              ):(
                <button type="button" onClick={applyStudio} disabled={applyingStudio} className="w-full py-3.5 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>
                  {applyingStudio?<><Loader2 className="w-5 h-5 animate-spin"/>Optimisation...</>:<><Check className="w-5 h-5"/>Appliquer - {studioCredits} credit{studioCredits!==1?'s':''}</>}
                </button>
              )}
              <p className="text-center text-xs text-gray-400 mt-2">Photo sauvegardee en 1024x1024px</p>
            </div>
          </div>
        </div>
      )}

      {/* ── FICHE PROMO MODAL ── */}
      {showPromoModal && promoProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:rounded-3xl sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-3xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{background:'linear-gradient(135deg,#dc2626,#ea580c)'}}>
                  <Zap className="w-5 h-5"/>
                </div>
                <div>
                  <p className="font-extrabold text-gray-900">Fiche Promo</p>
                  <p className="text-xs text-gray-400 truncate max-w-[180px]">{promoProduct.name}</p>
                </div>
              </div>
              <button onClick={() => setShowPromoModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500"/>
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Template selector */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Template</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPromoTemplate('flash')}
                    className={`py-3 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 border-2 transition-all ${promoTemplate==='flash' ? 'border-red-500 text-red-700 bg-red-50' : 'border-gray-200 text-gray-500'}`}>
                    <Zap className="w-4 h-4"/> Flash (Rouge)
                  </button>
                  <button onClick={() => setPromoTemplate('vedette')}
                    className={`py-3 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 border-2 transition-all ${promoTemplate==='vedette' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-500'}`}>
                    <Star className="w-4 h-4"/> Vedette (Vert)
                  </button>
                </div>
              </div>

              {/* Discount + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Réduction (%)</label>
                  <input type="number" min={0} max={90} value={promoForm.discountPercent}
                    onChange={e => {
                      const d = Number(e.target.value);
                      setPromoForm(prev => ({ ...prev, discountPercent: d, promoPrice: Math.round(promoProduct.sellingPrice * (1 - d / 100)) }));
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-red-300 focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Prix promo ({shop?.currency || 'FCFA'})</label>
                  <input type="number" min={0} value={promoForm.promoPrice}
                    onChange={e => setPromoForm(prev => ({ ...prev, promoPrice: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-red-300 focus:outline-none"/>
                </div>
              </div>

              {/* Date limite */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Date limite (optionnel)</label>
                <input type="date" value={promoForm.deadline}
                  onChange={e => setPromoForm(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-300 focus:outline-none"/>
              </div>

              {/* Accroche */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Accroche</label>
                  <button onClick={generatePromoTextAI} disabled={promoGenerating}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-xl text-white disabled:opacity-60"
                    style={{background:'linear-gradient(135deg,#7c3aed,#4c1d95)'}}>
                    {promoGenerating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                    IA — 1 crédit
                  </button>
                </div>
                <input type="text" value={promoForm.headline} placeholder="Ex: Profitez de -20% sur ce produit !"
                  onChange={e => setPromoForm(prev => ({ ...prev, headline: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-300 focus:outline-none"/>
              </div>

              {/* Sous-texte */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Texte secondaire</label>
                <input type="text" value={promoForm.subtext} placeholder="Ex: Offre limitée. Commandez maintenant !"
                  onChange={e => setPromoForm(prev => ({ ...prev, subtext: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-300 focus:outline-none"/>
              </div>

              {/* Preview */}
              {promoPreviewUrl ? (
                <div className="rounded-2xl overflow-hidden border border-gray-100">
                  <img src={promoPreviewUrl} alt="Aperçu fiche promo" className="w-full"/>
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center" style={{height:200}}>
                  <p className="text-sm text-gray-400 font-medium">Clique sur &quot;Aperçu&quot; pour voir la fiche</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-gray-100 flex-shrink-0 space-y-2">
              <button onClick={previewPromo} disabled={promoLoading}
                className="w-full py-3 rounded-2xl bg-gray-100 text-gray-700 font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                {promoLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Eye className="w-4 h-4"/>}
                Aperçu
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={downloadPromo} disabled={promoLoading}
                  className="py-3 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{background:'linear-gradient(135deg,#dc2626,#ea580c)'}}>
                  <Download className="w-4 h-4"/> Télécharger
                </button>
                <button onClick={sharePromo} disabled={promoLoading}
                  className="py-3 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{background:'linear-gradient(135deg,#1FB955,#0E5D32)'}}>
                  <Share2 className="w-4 h-4"/> Partager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreditsModal && <CreditsModal credits={studioCredits} shopName={shop?.name||''} shopId={shop?.id||''} onClose={()=>setShowCreditsModal(false)}/>}

      {/* ── QUICK SELL MODAL ── */}
      {showQuickSell && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: 'rgba(11,18,32,0.7)' }}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl overflow-hidden shadow-hi animate-slideUp">
            {/* Header */}
            <div className="relative px-5 py-5 text-white" style={{ background: 'linear-gradient(135deg,#0B1220,#0E5D32)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 90% 10%, rgba(31,185,85,0.3), transparent 50%)' }}/>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 text-[10px] font-extrabold tracking-[0.22em] uppercase text-white/55 mb-1">
                    <Zap className="w-3 h-3 text-orange" /> Mode express
                  </div>
                  <h2 className="display-serif text-2xl">Quick Sell</h2>
                  <p className="text-white/65 text-[12px] mt-0.5">Photo → IA remplit → partage en 30 sec</p>
                </div>
                <button onClick={() => { setShowQuickSell(false); stopCam(); resetPhoto(); }}
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <X className="w-4 h-4 text-white"/>
                </button>
              </div>
              {/* Steps indicator */}
              <div className="relative flex gap-2 mt-4">
                <div className={`flex-1 h-1 rounded-full transition-all ${qsStep === 'photo' || qsStep === 'review' ? 'bg-wa' : 'bg-white/20'}`}/>
                <div className={`flex-1 h-1 rounded-full transition-all ${qsStep === 'review' ? 'bg-wa' : 'bg-white/20'}`}/>
              </div>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh] pb-safe">
              {/* STEP 1 — PHOTO */}
              {qsStep === 'photo' && (
                <>
                  <p className="text-[13px] font-extrabold text-slate-500 uppercase tracking-[0.18em]">Étape 1 — Prends une photo</p>
                  {photoMode === 'camera' && (
                    <div className="relative rounded-2xl overflow-hidden bg-black">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ maxHeight: '55vw', objectFit: 'cover' }}/>
                      <canvas ref={canvasRef} className="hidden"/>
                      <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4">
                        <button type="button" onClick={stopCam} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm"><StopCircle className="w-4 h-4"/>Annuler</button>
                        <button type="button" onClick={() => { captureCam(); setQsStep('review'); }}
                                className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center active:scale-95">
                          <div className="w-12 h-12 rounded-full border-4 border-gray-300"/>
                        </button>
                        <button type="button" onClick={flipCamera} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm"><RefreshCw className="w-4 h-4"/>Flip</button>
                      </div>
                    </div>
                  )}
                  {(photoMode === 'done' || photoPreview) && (
                    <div className="relative rounded-2xl overflow-hidden border border-emerald-200" style={{ aspectRatio: '1' }}>
                      <img src={photoPreview} alt="Aperçu" className="w-full h-full object-contain p-2"/>
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 rounded-2xl backdrop-blur-sm">
                          <Sparkles className="w-8 h-8 text-purple-300 animate-pulse"/>
                          <p className="text-white font-extrabold text-sm">IA analyse…</p>
                          <p className="text-white/60 text-xs">Nom, prix, description en cours</p>
                        </div>
                      )}
                      {!isAnalyzing && (
                        <div className="absolute bottom-3 inset-x-3 flex gap-2">
                          <button type="button" onClick={() => { setPhotoPreview(''); setPhotoMode('none'); setForm(f=>({...f,imageUrl:''})); }}
                                  className="flex-1 py-2 rounded-xl bg-black/60 text-white text-[11px] font-bold backdrop-blur-sm">Reprendre</button>
                          <button type="button" onClick={() => setQsStep('review')}
                                  className="flex-1 py-2 rounded-xl text-[11px] font-extrabold text-white shadow-wa"
                                  style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>
                            Continuer →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {photoMode !== 'camera' && !photoPreview && (
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => { startCam(); }}
                              className="flex flex-col items-center justify-center gap-2 py-8 rounded-2xl text-white font-extrabold shadow-wa"
                              style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>
                        <Camera className="w-8 h-8"/>
                        <span className="text-sm">Prendre une photo</span>
                      </button>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                              className="flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-all">
                        <ImageIcon className="w-8 h-8"/>
                        <span className="text-sm font-bold">Importer</span>
                      </button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleFile(e); setQsStep('review'); }}/>
                </>
              )}

              {/* STEP 2 — REVIEW */}
              {qsStep === 'review' && (
                <>
                  <p className="text-[13px] font-extrabold text-slate-500 uppercase tracking-[0.18em]">Étape 2 — Vérifie et enregistre</p>
                  {isAnalyzing && (
                    <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-2xl p-4">
                      <Sparkles className="w-5 h-5 text-purple-500 animate-pulse flex-shrink-0"/>
                      <p className="text-sm text-purple-700 font-extrabold">IA remplit la fiche… quelques secondes</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1 block">
                      Nom du produit *
                      {form.name && <span className="ml-2 text-emerald-600 normal-case tracking-normal">✓ IA</span>}
                    </label>
                    <input type="text" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input" placeholder="Nom du produit"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1 block">Prix de vente *</label>
                      <input type="number" required min="0" value={form.sellingPrice} onChange={e=>setForm({...form,sellingPrice:e.target.value})} className="input" placeholder="0"/>
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-1 block">Stock</label>
                      <input type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} className="input" placeholder="1"/>
                    </div>
                  </div>
                  {/* Catégorie chips */}
                  <div>
                    <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wide mb-2 block">
                      Catégorie {form.category && <span className="text-emerald-600 normal-case tracking-normal ml-1">✓ {form.category}</span>}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Vêtements','Cosmétiques','Alimentaire','Électronique','Maison','Artisanat','Accessoires','Autre'].map(cat => (
                        <button type="button" key={cat}
                          onClick={()=>setForm({...form,category:form.category===cat?'':cat})}
                          className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${form.category===cat ? 'bg-wa text-white shadow-wa' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button type="button" onClick={() => setQsStep('photo')}
                            className="btn-secondary py-3.5 text-sm">
                      ← Reprendre photo
                    </button>
                    <button type="button" onClick={handleQuickSave}
                            disabled={qsSaving || !form.name || !form.sellingPrice || isAnalyzing}
                            className="btn-primary py-3.5 text-sm disabled:opacity-60">
                      {qsSaving ? <><Loader2 className="w-4 h-4 animate-spin"/>Sauvegarde…</> : <><Zap className="w-4 h-4"/>Enregistrer</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── POST-SAVE BOTTOM SHEET ── */}
      {postSaveProduct && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" style={{ background: 'rgba(11,18,32,0.6)' }}
             onClick={()=>setPostSaveProduct(null)}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl overflow-hidden shadow-hi animate-slideUp"
               onClick={e=>e.stopPropagation()}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full"/>
            </div>
            {/* Header */}
            <div className="px-5 pt-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-wa"
                     style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>
                  <span className="text-white text-lg">✅</span>
                </div>
                <div>
                  <p className="font-extrabold text-ink text-base truncate max-w-[240px]">{postSaveProduct.name || 'Produit enregistré'}</p>
                  <p className="text-[12px] text-slate-500 font-semibold">
                    {postSaveProduct.sellingPrice?.toLocaleString('fr-FR')} {shop?.currency || 'FCFA'}
                    {postSaveProduct.category ? ` · ${postSaveProduct.category}` : ''}
                  </p>
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="p-4 space-y-2.5 pb-safe">
              <button
                onClick={()=>{ setPostSaveProduct(null); openBrochure(postSaveProduct); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:bg-emerald-50 border border-emerald-100 bg-emerald-50/50">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-wa"
                     style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>
                  <Sparkles className="w-5 h-5 text-white"/>
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-ink text-[15px]">Générer la brochure</p>
                  <p className="text-[12px] text-slate-500 font-semibold">
                    {extraPhotos.length >= 2 ? '3 angles · prête pour WhatsApp' : 'Fiche produit + partage WhatsApp'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400"/>
              </button>

              {shop?.whatsapp && (
                <a href={getWhatsAppLink(shop.whatsapp, `Bonjour ! Voici ${postSaveProduct.name} — ${postSaveProduct.sellingPrice?.toLocaleString('fr-FR')} ${shop.currency||'FCFA'}\n\n✅ Disponible en boutique : ${typeof window!=='undefined'?window.location.origin:''} /${shop.slug}`)}
                   target="_blank" rel="noopener noreferrer"
                   onClick={()=>setPostSaveProduct(null)}
                   className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:bg-slate-50 border border-slate-100">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: '#E6F8EE', color: '#0E5D32' }}>
                    <MessageCircle className="w-5 h-5"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-ink text-[15px]">Partager sur WhatsApp</p>
                    <p className="text-[12px] text-slate-500 font-semibold">Message pré-rempli avec prix + lien</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400"/>
                </a>
              )}

              {shop?.slug && (
                <a href={`/${shop.slug}`} target="_blank" rel="noopener noreferrer"
                   onClick={()=>setPostSaveProduct(null)}
                   className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:bg-slate-50 border border-slate-100">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background: '#EAF2FF', color: '#1E3F87' }}>
                    <Eye className="w-5 h-5"/>
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-ink text-[15px]">Voir dans la boutique</p>
                    <p className="text-[12px] text-slate-500 font-semibold">Vérifier l'affichage public</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400"/>
                </a>
              )}

              <button
                onClick={()=>{ navigator.clipboard.writeText(`${typeof window!=='undefined'?window.location.origin:''}/${shop?.slug}`); setPostSaveProduct(null); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:bg-slate-50 border border-slate-100">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: '#F6F2EA', color: '#6B7385' }}>
                  <Copy className="w-5 h-5"/>
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-ink text-[15px]">Copier le lien boutique</p>
                  <p className="text-[12px] text-slate-500 font-semibold">{typeof window!=='undefined'?window.location.origin:''}/{shop?.slug}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400"/>
              </button>

              <button onClick={()=>setPostSaveProduct(null)}
                      className="w-full py-3 text-center text-[13px] font-extrabold text-slate-400 hover:text-slate-600 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showCatModal&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b"><h2 className="text-lg font-bold">Nouvelle categorie</h2><button onClick={()=>setShowCatModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5"/></button></div>
            <form onSubmit={handleAddCat} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label><input type="text" required value={newCat.name} onChange={e=>setNewCat({...newCat,name:e.target.value})} className="input" placeholder="Ex: Electronique"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label><input type="color" value={newCat.color} onChange={e=>setNewCat({...newCat,color:e.target.value})} className="w-full h-10 rounded-lg cursor-pointer"/></div>
              <button type="submit" className="btn-primary w-full" style={{backgroundColor:pc}}>Creer la categorie</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
