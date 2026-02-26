'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit, Trash2, Package, Loader2, X, Star, Camera, Sparkles,
  AlertTriangle, Crown, Image as ImageIcon, StopCircle, ZoomIn, ZoomOut,
  RotateCw, Check, Wand2, Sun, Contrast, Zap, Move, SlidersHorizontal,
  RefreshCw, Eye,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, createCategory, checkShopLimits } from '@/lib/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Product, Category, PLANS } from '@/lib/types';
import { formatPrice, calculateMargin } from '@/lib/utils';

type PhotoMode = 'none' | 'camera' | 'crop' | 'done';

interface StudioSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  warmth: number;
  bgWhite: boolean;
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

// ==============================================================================
// CREDITS MODAL - Paiement adapte : Afrique (Mobile Money) ou Diaspora (EUR)
// ==============================================================================

const WA_SUPPORT = '393299639430';
const AFRICA_COUNTRIES = new Set(['SN','CI','CM','ML','BF','GN','TG','BJ','NE','CD','CG','GA','MG','MU','TZ','KE','GH','NG','RW','ET','MZ','ZA','AO','ZM','ZW','UG','BI','MW','SO','SD','TD','CF','GW','SL','LR','GM','CV','ST','GQ','DJ','ER','SS','KM','LS','BW','NA','SZ']);
const toEur = (fcfa: number) => (fcfa / 655).toFixed(2);

// -- Liens Stripe ponctuels ---------------------------------------------------
const STRIPE_LINKS: Record<string, string> = {
  PACK_50:  'https://buy.stripe.com/6oUbITeEl3ia1UM1DmaVa05',
  PACK_200: 'https://buy.stripe.com/dRmdR12VD6um56Y4PyaVa04',
};

// -- Packs definis localement (evite tout probleme d'import) -----------------
const PACKS = [
  { id: 'PACK_50',  name: 'Pack 50 photos',  credits: 50,  price: 1000, pricePerPhoto: 20, popular: false },
  { id: 'PACK_200', name: 'Pack 200 photos', credits: 200, price: 3000, pricePerPhoto: 15, popular: true  },
] as const;
type Pack = typeof PACKS[number];

function CreditsModal({ credits, shopName, shopId, onClose }: {
  credits: number; shopName: string; shopId: string; onClose: () => void;
}) {
  const { t } = useI18n();
  const [zone, setZone] = useState<'africa' | 'diaspora' | null>(null);
  const [detecting, setDetecting] = useState(true);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [showWire, setShowWire] = useState(false);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => setZone(AFRICA_COUNTRIES.has(d.country_code || '') ? 'africa' : 'diaspora'))
      .catch(() => setZone(null))
      .finally(() => setDetecting(false));
  }, []);

  function sendWhatsApp(pack: Pack, method: string) {
    const isEur = zone === 'diaspora';
    const price = isEur ? `${toEur(pack.price)}` : `${pack.price.toLocaleString()} FCFA`;
    const payLine = method === 'stripe' ? 'Stripe (carte bancaire) - paiement effectue '
      : method === 'wire' ? 'Virement SEPA'
      : method === 'whatsapp' ? 'A discuter'
      : 'Mobile Money (Wave / Orange / MTN)';
    const msg = `Bonjour \n\nJe veux activer le *${pack.name}* pour Studio Photo IA Mastershop.\n\n Boutique : ${shopName}\n Montant : ${price}\n Paiement : ${payLine}\n\nMerci d'activer mes *${pack.credits} credits* !`;
    window.open(`https://wa.me/${WA_SUPPORT}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl" style={{ maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg,#fff7ed,#fef3c7)' }}>
          <div>
            <p className="text-xl font-extrabold text-gray-900">Recharger Studio IA</p>
            <p className="text-sm text-gray-500 mt-0.5">Credits actuels : <strong className="text-orange-600">{credits}</strong></p>
          </div>
          <div className="flex items-center gap-2">
            {detecting && <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />}
            <button onClick={onClose} className="w-9 h-9 bg-white/60 rounded-full flex items-center justify-center hover:bg-white"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Zone toggle */}
          <div className="flex gap-2">
            <button onClick={() => { setZone('africa'); setSelectedPack(null); setShowWire(false); }}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${zone === 'africa' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
               En Afrique
            </button>
            <button onClick={() => { setZone('diaspora'); setSelectedPack(null); setShowWire(false); }}
              className={`flex-1 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all ${zone === 'diaspora' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
               En diaspora
            </button>
          </div>

          {!detecting && zone && (
            <div className={`text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-2 ${zone === 'africa' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
              <span>{zone === 'africa' ? ' Paiement Mobile Money (Wave, Orange, MTN...)' : ' Paiement en EUR disponible (PayPal, virement SEPA)'}</span>
            </div>
          )}

          {zone && (
            <>
              {/* Pack cards */}
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Choisir un pack</p>
              <div className="space-y-2.5">
                {PACKS.map(pack => {
                  const sel = selectedPack?.id === pack.id;
                  return (
                    <div key={pack.id} onClick={() => { setSelectedPack(pack); setShowWire(false); }}
                      className={`rounded-2xl border-2 p-4 cursor-pointer transition-all ${sel ? 'border-orange-500 shadow-md' : pack.popular ? 'border-orange-200 bg-orange-50/60' : 'border-gray-200 hover:border-gray-300'}`}
                      style={sel ? { background: 'linear-gradient(135deg,#fff7ed,#ffffff)' } : {}}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-gray-900">{pack.name}</p>
                            {pack.popular && <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full"> POPULAIRE</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {zone === 'africa'
                              ? `${pack.pricePerPhoto} FCFA / photo`
                              : `${(Number(toEur(pack.price)) / pack.credits * 100).toFixed(1)}c / photo`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-extrabold text-orange-600">
                            {zone === 'africa' ? `${pack.price.toLocaleString()} F` : `${toEur(pack.price)}`}
                          </p>
                          {zone === 'diaspora' && <p className="text-[10px] text-gray-400">{pack.price.toLocaleString()} FCFA</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment methods - show only when pack selected */}
              {selectedPack && (
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Methode de paiement</p>

                  {zone === 'africa' ? (
                    /* -- AFRIQUE Mobile Money -- */
                    <div className="space-y-2">
                      {[
                        { logo:'', name:'Wave',         sub:'Le plus rapide',     color:'#16a34a', bg:'#f0fdf4', border:'#86efac' },
                        { logo:'', name:'Orange Money', sub:'Disponible partout', color:'#ea580c', bg:'#fff7ed', border:'#fdba74' },
                        { logo:'', name:'MTN MoMo',     sub:'Cote d\'Ivoire, Ghana, Cameroun', color:'#ca8a04', bg:'#fefce8', border:'#fde047' },
                        { logo:'', name:'Airtel Money', sub:'Tanzania, Kenya, Rwanda', color:'#dc2626', bg:'#fef2f2', border:'#fca5a5' },
                      ].map(m => (
                        <button key={m.name} onClick={() => sendWhatsApp(selectedPack, 'mobilemoney')}
                          className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left hover:opacity-90 active:scale-[0.98] transition-all"
                          style={{ borderColor: m.border, background: m.bg }}>
                          <span className="text-2xl flex-shrink-0">{m.logo}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-sm" style={{ color: m.color }}>{m.name}</p>
                            <p className="text-[11px] text-gray-500">{m.sub}</p>
                          </div>
                          <div className="text-xs font-bold px-3 py-1.5 rounded-xl text-white flex-shrink-0" style={{ background: m.color }}>
                            Payer {selectedPack.price.toLocaleString()}F 
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* -- DIASPORA EUR - Stripe + Virement -- */
                    <div className="space-y-2">
                      {/* Stripe - carte bancaire */}
                      <button
                        onClick={() => {
                          const stripeUrl = STRIPE_LINKS[selectedPack.id];
                          const params = new URLSearchParams();
                          if (shopId) params.set('client_reference_id', shopId);
                          if (shopName) params.set('prefilled_custom_field_0', shopName);
                          window.open(`${stripeUrl}?${params.toString()}`, '_blank');
                        }}
                        className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-violet-300 bg-violet-50 hover:bg-violet-100 active:scale-[0.98] transition-all text-left">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                          {/* Stripe logo SVG */}
                          <svg viewBox="0 0 60 25" className="w-8 h-4" fill="none">
                            <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V6.27h3.64l.24 1.12a4.52 4.52 0 0 1 3.26-1.4c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 6.91-5.72 6.91zm-1-11.3c-.86 0-1.37.3-1.9.8l.04 6.27c.5.45 1 .72 1.86.72 1.46 0 2.46-1.63 2.46-3.87 0-2.18-.99-3.92-2.46-3.92zM28.24 5.12c-1.36 0-2.23.59-2.23 1.89 0 1.04.69 1.73 2.37 2.34l.87.32C31.15 10.4 32.4 11.6 32.4 13.7c0 2.76-2.22 4.63-5.92 4.63-1.61 0-3.38-.33-4.77-1.06V13.4a8.37 8.37 0 0 0 4.72 1.48c1.56 0 2.4-.55 2.4-1.67 0-1.02-.73-1.71-2.5-2.36l-.87-.31C23.6 9.7 22.4 8.5 22.4 6.5c0-2.7 2.08-4.45 5.66-4.45 1.5 0 3.04.3 4.2.87v3.77a7.6 7.6 0 0 0-4.02-1.57zM14.88 0l4.16.88V3.4l-4.16-.88V0zm0 6.27h4.16V20h-4.16V6.27zm-5.5 4.97L5.1 6.27H.37l5.22 6.86L0 20h4.74l4.64-6.24V20h4.16V0L9.38 .88V11.24z" fill="#635BFF"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-violet-800">Carte bancaire via Stripe</p>
                          <p className="text-xs text-violet-500">Visa  Mastercard  CB  Apple Pay  Google Pay</p>
                          <p className="text-[10px] text-violet-400 mt-0.5">Paiement securise  Credits actives sous 2h</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-extrabold text-violet-700">{toEur(selectedPack.price)}</p>
                          <div className="text-[10px] bg-violet-600 text-white px-2 py-0.5 rounded-full font-bold mt-1">Payer </div>
                        </div>
                      </button>

                      {/* Note apres paiement Stripe */}
                      <div className="bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 flex items-start gap-2">
                        <span className="text-sm mt-0.5"></span>
                        <p className="text-[11px] text-violet-600 leading-relaxed">
                          Apres paiement, envoie une capture Stripe sur WhatsApp pour activer tes credits plus vite.
                        </p>
                        <button onClick={() => sendWhatsApp(selectedPack, 'stripe')}
                          className="flex-shrink-0 text-[10px] font-bold bg-green-500 text-white px-2 py-1 rounded-lg">
                          WhatsApp
                        </button>
                      </div>

                      {/* Virement SEPA */}
                      <div className="rounded-2xl border-2 border-gray-200 overflow-hidden">
                        <button onClick={() => setShowWire(w => !w)}
                          className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="font-extrabold text-gray-800">Virement SEPA / bancaire</p>
                            <p className="text-xs text-gray-500">Europe  1-2 jours ouvres</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-extrabold text-gray-700">{toEur(selectedPack.price)}</p>
                            <div className="text-[10px] bg-gray-700 text-white px-2 py-0.5 rounded-full font-bold mt-1">{showWire ? 'Masquer' : 'IBAN '}</div>
                          </div>
                        </button>
                        {showWire && (
                          <div className="p-4 pt-0 bg-gray-50 space-y-2">
                            <div className="bg-white rounded-xl p-3 border border-gray-200 font-mono text-xs space-y-1.5">
                              <div className="flex justify-between"><span className="text-gray-400">Beneficiaire</span><span className="font-bold text-gray-800">Mastershop Pro</span></div>
                              <div className="flex justify-between"><span className="text-gray-400">IBAN</span><span className="font-bold text-gray-800 text-[10px]">IT60 X054 2811 1010 0000 0123 456</span></div>
                              <div className="flex justify-between"><span className="text-gray-400">BIC/SWIFT</span><span className="font-bold text-gray-800">SELBIT2BXXX</span></div>
                              <div className="flex justify-between"><span className="text-gray-400">Motif</span><span className="font-bold text-gray-800">STUDIO-{selectedPack.credits}</span></div>
                              <div className="flex justify-between"><span className="text-gray-400">Montant</span><span className="font-extrabold text-orange-600">{toEur(selectedPack.price)}</span></div>
                            </div>
                            <button onClick={() => sendWhatsApp(selectedPack, 'wire')}
                              className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
                              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                               Confirmer sur WhatsApp apres virement
                            </button>
                          </div>
                        )}
                      </div>

                      {/* WhatsApp direct */}
                      <button onClick={() => sendWhatsApp(selectedPack, 'whatsapp')}
                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100 text-left transition-colors">
                        <span className="text-2xl"></span>
                        <div className="flex-1">
                          <p className="font-extrabold text-green-800">Contacter sur WhatsApp</p>
                          <p className="text-xs text-green-600">Western Union, Wise, autre methode - on s'adapte</p>
                        </div>
                        <div className="text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-xl">Chat </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Footer info */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
            <p className="text-xs font-bold text-amber-700"> Credits actives sous 2h max  Support 7j/7</p>
            <p className="text-[10px] text-amber-500 mt-0.5">
              {zone === 'africa' ? 'Wave  Orange Money  MTN MoMo  Airtel Money' : 'PayPal  Virement SEPA  Wise  Western Union'}
            </p>
          </div>

          <button onClick={onClose} className="w-full py-3 bg-gray-100 rounded-2xl text-sm text-gray-600 font-medium hover:bg-gray-200">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
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
  const [newCat, setNewCat] = useState({ name:'', color:'#16a34a' });

  const [form, setForm] = useState({
    name:'', description:'', specifications:'', category:'', brand:'',
    sku:'', barcode:'', costPrice:'', sellingPrice:'', stock:'', minStock:'5',
    isActive:true, isFeatured:false, imageUrl:'',
  });

  useEffect(() => { if (shop?.id) loadData(); }, [shop?.id]);
  useEffect(() => () => { if (cameraStream) cameraStream.getTracks().forEach(t=>t.stop()); }, [cameraStream]);

  // Live studio preview
  useEffect(() => {
    if (!showStudio || !rawSrc) return;
    const id = setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width=280; c.height=280;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = studio.bgWhite ? '#FFFFFF' : '#f0f0f0';
        ctx.fillRect(0,0,280,280);
        ctx.filter = buildFilter(studio);
        const scale = Math.min(280/img.width,280/img.height)*0.9;
        const sw=img.width*scale, sh=img.height*scale;
        ctx.drawImage(img,(280-sw)/2,(280-sh)/2,sw,sh);
        setStudioPreview(c.toDataURL('image/jpeg',0.85));
      };
      img.src = rawSrc;
    }, 60);
    return () => clearTimeout(id);
  }, [studio, rawSrc, showStudio]);

  async function loadData() {
    if (!shop?.id) return;
    const [p, c, lim] = await Promise.all([getProducts(shop.id), getCategories(shop.id), checkShopLimits(shop.id)]);
    setProducts(p); setCategories(c); setLimits(lim);
    setStudioCredits((shop as any).photoCredits ?? 0);
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
    setShowModal(true);
  }
  function resetPhoto() {
    setPhotoMode('none'); setPhotoFile(null); setPhotoPreview(''); setRawSrc('');
    setCropOff({x:0,y:0}); setCropScale(1); setCropRot(0); stopCam();
    setStudio(DEFAULT_STUDIO); setAiAnalysis(null); setShowStudio(false); setStudioPreview('');
  }

  async function startCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width:{ideal:1920}, height:{ideal:1080} }
      });
      setCameraStream(stream); setPhotoMode('camera');
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { alert('Camera non disponible'); }
  }
  function stopCam() {
    if (cameraStream) { cameraStream.getTracks().forEach(t=>t.stop()); setCameraStream(null); }
  }
  async function flipCamera() {
    stopCam();
    setFacingMode(f => f==='environment'?'user':'environment');
    setTimeout(() => startCam(), 200);
  }
  function captureCam() {
    if (!videoRef.current||!canvasRef.current) return;
    const v=videoRef.current, c=canvasRef.current;
    c.width=v.videoWidth||1280; c.height=v.videoHeight||720;
    c.getContext('2d')!.drawImage(v,0,0);
    const src = c.toDataURL('image/jpeg',0.95);
    stopCam();
    const img = new Image();
    img.onload = () => {
      setImgNat({w:img.naturalWidth,h:img.naturalHeight});
      setRawSrc(src);
      setCropScale(Math.max(FRAME/img.naturalWidth,FRAME/img.naturalHeight));
      setCropOff({x:0,y:0}); setPhotoMode('crop');
    };
    img.src = src;
  }
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f=e.target.files?.[0]; if (!f) return;
    const url=URL.createObjectURL(f);
    const img=new Image();
    img.onload=()=>{
      setImgNat({w:img.naturalWidth,h:img.naturalHeight}); setRawSrc(url);
      setCropScale(Math.max(FRAME/img.naturalWidth,FRAME/img.naturalHeight));
      setCropOff({x:0,y:0}); setPhotoMode('crop');
    };
    img.src=url; e.target.value='';
  }

  function onPD(e: React.PointerEvent) {
    isDrag.current=true;
    dragRef.current={mx:e.clientX,my:e.clientY,ox:cropOff.x,oy:cropOff.y};
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPM(e: React.PointerEvent) {
    if (!isDrag.current) return;
    setCropOff({x:dragRef.current.ox+e.clientX-dragRef.current.mx, y:dragRef.current.oy+e.clientY-dragRef.current.my});
  }
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
    ctx.translate(cropOff.x*r2c+sw/2-OUT/2, cropOff.y*r2c+sh/2-OUT/2);
    ctx.drawImage(img,-sw/2,-sh/2,sw,sh); ctx.restore();
    const croppedSrc=canvas.toDataURL('image/jpeg',0.95);
    canvas.toBlob(async (blob)=>{
      if (!blob) return;
      setRawSrc(croppedSrc);
      setPhotoFile(new File([blob],`prod-${Date.now()}.jpg`,{type:'image/jpeg'}));
      setPhotoPreview(croppedSrc); setPhotoMode('done');
      await analyzeAI(blob);
    },'image/jpeg',0.95);
  }

  async function analyzeAI(blob: Blob) {
    setIsAnalyzing(true);
    try {
      const reader=new FileReader();
      const b64=await new Promise<string>((res,rej)=>{ reader.onload=()=>res((reader.result as string).split(',')[1]); reader.onerror=rej; reader.readAsDataURL(blob); });
      const r=await fetch('/api/analyze-product',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base64:b64,mediaType:'image/jpeg'})});
      if (!r.ok) throw new Error();
      const p=await r.json();
      if (p.name||p.description) {
        setForm(prev=>({
          ...prev,
          name:p.name||prev.name, description:p.description||prev.description,
          specifications:p.specifications||prev.specifications, brand:p.brand||prev.brand,
          sellingPrice:p.suggestedPrice?p.suggestedPrice.replace(/[^0-9]/g,'')||prev.sellingPrice:prev.sellingPrice,
          category:p.category?(categories.find(c=>c.name.toLowerCase().includes(p.category.toLowerCase()))?.name||prev.category):prev.category,
        }));
      }
      try {
        const sRes=await fetch('/api/photo-studio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base64:b64,shopId:shop?.id})});
        if (sRes.ok) {
          const sData=await sRes.json();
          if (sData.analysis) {
            setAiAnalysis(sData.analysis);
            setStudio(prev=>({...prev, brightness:Math.max(-60,Math.min(60,sData.analysis.brightness_adj||0)), contrast:Math.max(-40,Math.min(40,sData.analysis.contrast_adj||0))}));
          }
        }
      } catch {}
    } catch {}
    setIsAnalyzing(false);
  }

  async function applyStudio() {
    if (!rawSrc) return;
    setApplyingStudio(true);
    try {
      const blob=await applyStudioToCanvas(rawSrc,studio,1024);
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
      const r=ref(storage,`shops/${shop.id}/products/${Date.now()}.jpg`);
      await uploadBytes(r,photoFile); return await getDownloadURL(r);
    } catch { return form.imageUrl; } finally { setUploadingPhoto(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); if (!shop?.id) return; setSaving(true);
    try {
      let imageUrl=form.imageUrl||'';
      if (photoFile) { try { imageUrl=await uploadPhoto(); } catch {} }
      const data: Record<string,any>={
        name:form.name.trim(), category:form.category,
        costPrice:parseFloat(form.costPrice)||0, sellingPrice:parseFloat(form.sellingPrice)||0,
        stock:parseInt(form.stock)||0, minStock:parseInt(form.minStock)||5,
        isActive:Boolean(form.isActive), isFeatured:Boolean(form.isFeatured), imageUrl,
      };
      if (form.description.trim()) data.description=form.description.trim();
      if (form.specifications.trim()) data.specifications=form.specifications.trim();
      if (form.brand.trim()) data.brand=form.brand.trim();
      if (form.sku.trim()) data.sku=form.sku.trim();
      if (form.barcode.trim()) data.barcode=form.barcode.trim();
      if (editing?.id) await updateProduct(editing.id,data);
      else await createProduct(shop.id,data);
      await loadData(); setShowModal(false); resetPhoto();
    } catch(err:any){ alert('Erreur : '+(err?.message||String(err))); }
    setSaving(false);
  }
  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return;
    await deleteProduct(id); await loadData();
  }
  async function handleAddCat(e: React.FormEvent) {
    e.preventDefault(); if (!shop?.id||!newCat.name.trim()) return;
    await createCategory(shop.id,newCat); setNewCat({name:'',color:'#16a34a'}); await loadData(); setShowCatModal(false);
  }

  const margin=calculateMargin(parseFloat(form.costPrice)||0, parseFloat(form.sellingPrice)||0);
  const filtered=products.filter(p=>(p.name.toLowerCase().includes(search.toLowerCase())||p.category.toLowerCase().includes(search.toLowerCase()))&&(!catFilter||p.category===catFilter));
  const pc=shop?.primaryColor||'#16a34a';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:pc,borderTopColor:'transparent'}}/></div>;

  return (
    <div className="space-y-5">

      {/* Limit warning */}
      {limits&&!limits.canAddProduct&&(
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><AlertTriangle className="w-6 h-6 text-amber-500"/><div><p className="font-semibold text-amber-800">Limite de produits atteinte</p><p className="text-sm text-amber-600">{limits.productsCount}/{limits.plan.maxProducts} produits</p></div></div>
          <Link href="/admin/subscription" className="btn-primary flex items-center gap-2 text-sm" style={{backgroundColor:pc}}><Crown className="w-4 h-4"/>Upgrade</Link>
        </div>
      )}

      {/* Studio credits low */}
      {studioCredits>=0&&studioCredits<10&&(
        <div className="rounded-2xl p-4 flex items-center justify-between border" style={{background:'linear-gradient(135deg,#fff7ed,#fef3c7)',borderColor:'#fed7aa'}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center"><Wand2 className="w-5 h-5 text-orange-500"/></div>
            <div><p className="font-bold text-orange-800 text-sm">Studio Photo IA - {studioCredits} credit{studioCredits!==1?'s':''} restant{studioCredits!==1?'s':''}</p><p className="text-xs text-orange-600">Pack 50 photos = 1 000 FCFA  Pack 200 = 3 000 FCFA</p></div>
          </div>
          <button onClick={()=>setShowCreditsModal(true)} className="text-xs font-bold px-4 py-2 rounded-xl text-white shadow-sm" style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>Recharger</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800">Produits</h1><p className="text-gray-500 text-sm">{products.length} produit{products.length!==1?'s':''}{limits?.plan?.maxProducts!==-1&&` / ${limits?.plan?.maxProducts} max`}</p></div>
        <div className="flex gap-2">
          <button onClick={()=>setShowCatModal(true)} className="btn-outline text-sm">+ Categorie</button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2" style={{backgroundColor:pc}}><Plus className="w-5 h-5"/>Nouveau</button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/><input type="text" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} className="input pl-10"/></div>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="select w-full sm:w-48"><option value="">Toutes categories</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select>
      </div>

      {/* Product grid */}
      {filtered.length>0?(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product=>(
            <div key={product.id} className={`card hover:shadow-md transition-shadow ${!product.isActive?'opacity-60':''}`}>
              <div className="mb-3 -mx-6 -mt-6 rounded-t-xl overflow-hidden bg-gray-100" style={{aspectRatio:'1'}}>
                {product.imageUrl?<img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-gray-300"/></div>}
              </div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>{product.isFeatured&&<Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0"/>}</div>
                  <p className="text-sm text-gray-500">{product.category}{product.brand&&`  ${product.brand}`}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>openEdit(product)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500"><Edit className="w-4 h-4"/></button>
                  <button onClick={()=>handleDelete(product.id!)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div><p className="text-lg font-bold" style={{color:pc}}>{formatPrice(product.sellingPrice,shop?.currency)}</p><p className="text-xs text-gray-400">Cout: {formatPrice(product.costPrice,shop?.currency)}</p></div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${product.stock<=(product.minStock||5)?'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}`}>Stock: {product.stock}</div>
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

              {/* PHOTO */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Photo du produit</label>
                  {(photoMode==='done'||form.imageUrl)&&(
                    <button type="button" onClick={()=>setShowStudio(true)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-white shadow-sm" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>
                      <Wand2 className="w-3.5 h-3.5"/>Studio IA
                      {studioCredits>0&&<span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{studioCredits}</span>}
                    </button>
                  )}
                </div>

                {/* Camera */}
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

                {/* Crop */}
                {photoMode==='crop'&&rawSrc&&(
                  <div className="mb-2">
                    <p className="text-xs text-center text-gray-500 mb-2"> Glissez pour repositionner</p>
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
                      <button type="button" onClick={()=>setCropRot(r=>(r+90)%360)} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200" title="Pivoter"><RotateCw className="w-4 h-4"/></button>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={()=>{setPhotoMode('none');setRawSrc('');}} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-600">Annuler</button>
                      <button type="button" onClick={applyCrop} className="flex-1 py-2.5 rounded-xl text-sm text-white font-semibold flex items-center justify-center gap-2" style={{backgroundColor:pc}}><Check className="w-4 h-4"/>Confirmer</button>
                    </div>
                  </div>
                )}

                {/* Preview */}
                {photoMode==='done'&&photoPreview&&(
                  <div className="mb-2">
                    <div className="relative w-full overflow-hidden rounded-2xl bg-gray-50" style={{aspectRatio:'1'}}>
                      <img src={photoPreview} alt="Apercu" className="w-full h-full object-cover"/>
                      {isAnalyzing&&<div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl backdrop-blur-sm"><div className="text-center text-white"><Sparkles className="w-10 h-10 mx-auto mb-2 text-purple-300 animate-pulse"/><p className="font-bold text-sm">IA analyse...</p><p className="text-xs text-white/70 mt-1">Gemini  GPT-4o </p></div></div>}
                      {!isAnalyzing&&(studio.brightness!==0||studio.contrast!==0||studio.saturation!==0||studio.sharpness!==0||studio.bgWhite)&&(
                        <div className="absolute top-2 left-2 bg-violet-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Wand2 className="w-3 h-3"/>Studio applique</div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <button type="button" onClick={()=>{setPhotoPreview('');setPhotoFile(null);setPhotoMode('none');setForm(f=>({...f,imageUrl:''}));resetPhoto();}} className="py-2 bg-red-50 text-red-500 text-xs rounded-xl hover:bg-red-100 font-medium"> Supprimer</button>
                      <button type="button" onClick={()=>rawSrc?setPhotoMode('crop'):fileInputRef.current?.click()} className="py-2 bg-gray-100 text-gray-600 text-xs rounded-xl hover:bg-gray-200 font-medium"> Recadrer</button>
                      <button type="button" onClick={()=>setShowStudio(true)} className="py-2 text-white text-xs rounded-xl font-bold flex items-center justify-center gap-1" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}><Wand2 className="w-3 h-3"/>Studio</button>
                    </div>
                  </div>
                )}

                {/* Existing photo edit */}
                {!photoPreview&&form.imageUrl&&photoMode==='none'&&(
                  <div className="relative mb-2 w-full overflow-hidden rounded-2xl bg-gray-50" style={{aspectRatio:'1'}}>
                    <img src={form.imageUrl} alt="Actuelle" className="w-full h-full object-cover"/>
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full"> Actuelle</div>
                    <button type="button" onClick={()=>{setRawSrc(form.imageUrl);setShowStudio(true);setPhotoMode('done');setPhotoPreview(form.imageUrl);}} className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-xl text-white shadow" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}><Wand2 className="w-3 h-3"/>Studio IA</button>
                  </div>
                )}

                {/* No photo buttons */}
                {photoMode==='none'&&!photoPreview&&(
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={()=>fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-300 rounded-2xl text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50"><ImageIcon className="w-4 h-4"/>Importer & cadrer</button>
                    <button type="button" onClick={startCam} className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm text-white font-semibold" style={{background:`linear-gradient(135deg,${pc},${pc}bb)`}}><Camera className="w-4 h-4"/> Photo + IA</button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
                {photoMode==='none'&&!photoPreview&&!form.imageUrl&&<p className="text-xs text-gray-400 mt-2 text-center"> Gemini + GPT-4o remplissent les champs automatiquement</p>}
              </div>

              {isAnalyzing&&photoMode==='done'&&(
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3">
                  <Sparkles className="w-5 h-5 text-purple-500 animate-pulse"/>
                  <p className="text-sm text-purple-700 font-medium">IA analyse - les champs se remplissent...</p>
                </div>
              )}

              {/* Fields */}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label><input type="text" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="input" placeholder="Nom du produit"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description {form.description&&<span className="text-xs text-green-500 ml-1"> IA</span>}</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="textarea" rows={2} placeholder="Description attrayante"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Caracteristiques {form.specifications&&<span className="text-xs text-green-500 ml-1"> IA</span>}</label><textarea value={form.specifications} onChange={e=>setForm({...form,specifications:e.target.value})} className="textarea font-mono text-xs" rows={3} placeholder={"Couleur: \nMatiere: \nDimensions: "}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label><select required value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="select"><option value="">Choisir...</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Marque</label><input type="text" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} className="input" placeholder="Samsung, Nike..."/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU</label><input type="text" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} className="input font-mono text-sm" placeholder="REF-001"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Code-barres</label><input type="text" value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})} className="input font-mono text-sm" placeholder="0123456789" inputMode="numeric"/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prix d'achat *</label><input type="number" required min="0" value={form.costPrice} onChange={e=>setForm({...form,costPrice:e.target.value})} className="input"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente *</label><input type="number" required min="0" value={form.sellingPrice} onChange={e=>setForm({...form,sellingPrice:e.target.value})} className="input"/>{margin>0&&<p className={`text-xs mt-1 font-medium ${margin>=20?'text-emerald-600':'text-amber-600'}`}>Marge: {margin}%</p>}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label><input type="number" required min="0" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} className="input"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock min. alerte</label><input type="number" min="0" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} className="input"/></div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})} className="w-5 h-5 rounded"/><span className="text-sm">Actif (visible)</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFeatured} onChange={e=>setForm({...form,isFeatured:e.target.checked})} className="w-5 h-5 rounded"/><span className="text-sm"> Mis en avant</span></label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{setShowModal(false);stopCam();}} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={saving||uploadingPhoto||photoMode==='crop'} className="btn-primary flex-1 flex items-center justify-center gap-2" style={{backgroundColor:pc}}>
                  {(saving||uploadingPhoto)&&<Loader2 className="w-5 h-5 animate-spin"/>}
                  {photoMode==='crop'?"Confirmez d'abord le cadrage":uploadingPhoto?'Upload...':saving?'Sauvegarde...':'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========== STUDIO PHOTO IA =========== */}
      {showStudio&&(
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">

            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{background:'linear-gradient(135deg,#4c1d95,#7c3aed)'}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center"><Wand2 className="w-5 h-5 text-white"/></div>
                <div><p className="font-extrabold text-white text-base">Studio Photo IA</p><p className="text-violet-300 text-xs">Optimisez pour vendre plus</p></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-white/20 px-3 py-1 rounded-full text-white text-xs font-bold">{studioCredits} credit{studioCredits!==1?'s':''}</div>
                <button onClick={()=>setShowStudio(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"><X className="w-4 h-4 text-white"/></button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Before/After */}
              <div className="p-4 bg-gray-50 border-b">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 text-center">Apercu temps reel</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm" style={{aspectRatio:'1'}}>
                      {rawSrc&&<img src={rawSrc} alt="Original" className="w-full h-full object-contain"/>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 font-medium">Original</p>
                  </div>
                  <div className="text-center">
                    <div className="rounded-2xl overflow-hidden border-2 shadow-sm" style={{aspectRatio:'1',borderColor:'#7c3aed',background:studio.bgWhite?'#fff':'#f0f0f0'}}>
                      {studioPreview?<img src={studioPreview} alt="Apercu" className="w-full h-full object-contain"/>:rawSrc&&<img src={rawSrc} alt="Apercu" className="w-full h-full object-contain" style={{filter:buildFilter(studio)}}/>}
                    </div>
                    <p className="text-xs font-bold mt-1.5" style={{color:'#7c3aed'}}> Resultat</p>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              {aiAnalysis&&(
                <div className="mx-4 mt-4 bg-violet-50 border border-violet-200 rounded-2xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-violet-600"/>
                    <p className="text-xs font-bold text-violet-700">Analyse IA de votre photo</p>
                    <div className="ml-auto bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Score: {aiAnalysis.quality_score}/100</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {aiAnalysis.bg_is_simple&&<span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-medium"> Fond simple</span>}
                    {aiAnalysis.brightness_adj>15&&<span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-medium"> Photo sombre</span>}
                    {aiAnalysis.brightness_adj<-15&&<span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-medium"> Surexposee</span>}
                    {aiAnalysis.quality_score<50&&<span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-medium"> Qualite faible</span>}
                  </div>
                  <button type="button" onClick={()=>setStudio(prev=>({...prev,brightness:aiAnalysis.brightness_adj||0,contrast:aiAnalysis.contrast_adj||0}))} className="mt-2 w-full text-xs font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 py-1.5 rounded-xl transition-colors"> Appliquer les suggestions IA</button>
                </div>
              )}

              {/* Sliders */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1"><SlidersHorizontal className="w-4 h-4 text-gray-500"/><p className="font-bold text-gray-700 text-sm">Reglages</p></div>
                <StudioSlider label="Luminosite" icon={Sun} value={studio.brightness} min={-100} max={100} onChange={v=>setStudio(s=>({...s,brightness:v}))} color="#f59e0b"/>
                <StudioSlider label="Contraste" icon={Contrast} value={studio.contrast} min={-100} max={100} onChange={v=>setStudio(s=>({...s,contrast:v}))} color="#6366f1"/>
                <StudioSlider label="Saturation" icon={Eye} value={studio.saturation} min={-100} max={100} onChange={v=>setStudio(s=>({...s,saturation:v}))} color="#ec4899"/>
                <StudioSlider label="Nettete" icon={Zap} value={studio.sharpness} min={0} max={100} onChange={v=>setStudio(s=>({...s,sharpness:v}))} color="#14b8a6"/>
                <StudioSlider label="Chaleur" icon={Sun} value={studio.warmth} min={-50} max={50} onChange={v=>setStudio(s=>({...s,warmth:v}))} color="#f97316"/>

                {/* Fond blanc */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded-xl shadow-sm"/>
                    <div><p className="text-sm font-semibold text-gray-700">Fond blanc pur</p><p className="text-xs text-gray-400">Ideal pour e-commerce</p></div>
                  </div>
                  <button type="button" onClick={()=>setStudio(s=>({...s,bgWhite:!s.bgWhite}))} className={`w-12 h-6 rounded-full transition-all relative ${studio.bgWhite?'bg-violet-600':'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${studio.bgWhite?'left-7':'left-1'}`}/>
                  </button>
                </div>

                <button type="button" onClick={()=>setStudio(DEFAULT_STUDIO)} className="w-full py-2.5 text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2"><RefreshCw className="w-3.5 h-3.5"/>Reinitialiser</button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex-shrink-0 bg-white">
              {studioCredits<=0?(
                <div className="space-y-2">
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center"><p className="text-sm font-bold text-orange-700">Credits epuises</p><p className="text-xs text-orange-500">Les reglages manuels restent disponibles</p></div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={applyStudio} className="py-3 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 flex items-center justify-center gap-2">{applyingStudio?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}Appliquer</button>
                    <button type="button" onClick={()=>{setShowStudio(false);setShowCreditsModal(true);}} className="py-3 rounded-xl text-sm font-bold text-white" style={{background:'linear-gradient(135deg,#f97316,#ea580c)'}}>Recharger </button>
                  </div>
                </div>
              ):(
                <button type="button" onClick={applyStudio} disabled={applyingStudio} className="w-full py-3.5 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>
                  {applyingStudio?<><Loader2 className="w-5 h-5 animate-spin"/>Optimisation...</>:<><Check className="w-5 h-5"/>Appliquer  {studioCredits} credit{studioCredits!==1?'s':''}</>}
                </button>
              )}
              <p className="text-center text-xs text-gray-400 mt-2">Photo sauvegardee en 10241024px</p>
            </div>
          </div>
        </div>
      )}

      {/* =========== CREDITS MODAL =========== */}
      {showCreditsModal && <CreditsModal
        credits={studioCredits}
        shopName={shop?.name || ''}
        shopId={shop?.id || ''}
        onClose={() => setShowCreditsModal(false)}
      />}

      {/* =========== CATEGORY MODAL =========== */}
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