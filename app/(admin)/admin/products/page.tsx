'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Package, Loader2, X, Star, Camera, Sparkles, AlertTriangle, Crown, Image as ImageIcon, StopCircle, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, createCategory, checkShopLimits } from '@/lib/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Product, Category, PLANS } from '@/lib/types';
import { formatPrice, calculateMargin } from '@/lib/utils';

type PhotoMode = 'none' | 'camera' | 'crop' | 'done';

const FRAME = 280; // square crop frame px

export default function ProductsPage() {
  const { shop } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [limits, setLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', color: '#ec4899' });

  // Photo & crop
  const [photoMode, setPhotoMode] = useState<PhotoMode>('none');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [rawSrc, setRawSrc] = useState('');
  const [imgNat, setImgNat] = useState({ w: 0, h: 0 });
  const [cropOff, setCropOff] = useState({ x: 0, y: 0 });
  const [cropScale, setCropScale] = useState(1);
  const [cropRot, setCropRot] = useState(0);
  const isDrag = useRef(false);
  const dragRef = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const cropImgRef = useRef<HTMLImageElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', description: '', specifications: '', category: '', brand: '',
    costPrice: '', sellingPrice: '', stock: '', minStock: '5',
    isActive: true, isFeatured: false, imageUrl: '',
  });

  useEffect(() => { if (shop?.id) loadData(); }, [shop?.id]);
  useEffect(() => () => { if (cameraStream) cameraStream.getTracks().forEach(t => t.stop()); }, [cameraStream]);

  async function loadData() {
    if (!shop?.id) return;
    const [p, c, lim] = await Promise.all([getProducts(shop.id), getCategories(shop.id), checkShopLimits(shop.id)]);
    setProducts(p); setCategories(c); setLimits(lim); setLoading(false);
  }

  function openAdd() {
    setEditing(null); resetPhoto();
    setForm({ name: '', description: '', specifications: '', category: '', brand: '', costPrice: '', sellingPrice: '', stock: '', minStock: '5', isActive: true, isFeatured: false, imageUrl: '' });
    setShowModal(true);
  }
  function openEdit(p: Product) {
    setEditing(p); resetPhoto();
    setForm({ name: p.name, description: p.description || '', specifications: p.specifications || '', category: p.category, brand: p.brand || '', costPrice: String(p.costPrice), sellingPrice: String(p.sellingPrice), stock: String(p.stock), minStock: String(p.minStock || 5), isActive: p.isActive, isFeatured: p.isFeatured || false, imageUrl: p.imageUrl || '' });
    setShowModal(true);
  }
  function resetPhoto() {
    setPhotoMode('none'); setPhotoFile(null); setPhotoPreview(''); setRawSrc('');
    setCropOff({ x: 0, y: 0 }); setCropScale(1); setCropRot(0); stopCam();
  }

  // ── CAMERA ────────────────────────────────────────────────────────────────
  async function startCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
      setCameraStream(stream); setPhotoMode('camera');
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 80);
    } catch { alert("Autorisez l'accès à la caméra dans votre navigateur."); }
  }
  function stopCam() {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); }
    if (photoMode === 'camera') setPhotoMode('none');
  }
  function captureCam() {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    openCrop(c.toDataURL('image/jpeg', 0.92), v.videoWidth, v.videoHeight);
    stopCam();
  }

  // ── FILE PICK ─────────────────────────────────────────────────────────────
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => openCrop(url, img.naturalWidth, img.naturalHeight);
    img.src = url;
    e.target.value = '';
  }

  // ── CROP EDITOR OPEN ──────────────────────────────────────────────────────
  function openCrop(src: string, w: number, h: number) {
    setRawSrc(src); setImgNat({ w, h });
    const s = FRAME / Math.min(w, h);
    setCropScale(s);
    setCropOff({ x: (FRAME - w * s) / 2, y: (FRAME - h * s) / 2 });
    setCropRot(0);
    setPhotoMode('crop');
  }

  // ── DRAG ──────────────────────────────────────────────────────────────────
  function onPD(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDrag.current = true;
    dragRef.current = { mx: e.clientX, my: e.clientY, ox: cropOff.x, oy: cropOff.y };
  }
  function onPM(e: React.PointerEvent) {
    if (!isDrag.current) return;
    setCropOff({ x: dragRef.current.ox + e.clientX - dragRef.current.mx, y: dragRef.current.oy + e.clientY - dragRef.current.my });
  }
  function onPU() { isDrag.current = false; }

  // ── APPLY CROP ────────────────────────────────────────────────────────────
  function applyCrop() {
    const canvas = document.createElement('canvas');
    const OUT = 800;
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, OUT, OUT);
    const r2c = OUT / FRAME;
    const img = cropImgRef.current!;
    ctx.save();
    ctx.rect(0, 0, OUT, OUT); ctx.clip();
    ctx.translate(OUT / 2, OUT / 2);
    ctx.rotate((cropRot * Math.PI) / 180);
    const sw = imgNat.w * cropScale * r2c;
    const sh = imgNat.h * cropScale * r2c;
    ctx.translate(cropOff.x * r2c + sw / 2 - OUT / 2, cropOff.y * r2c + sh / 2 - OUT / 2);
    ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      setPhotoFile(new File([blob], `prod-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      setPhotoPreview(canvas.toDataURL('image/jpeg', 0.92));
      setPhotoMode('done');
      await analyzeAI(blob);
    }, 'image/jpeg', 0.92);
  }

  // ── GEMINI / OPENAI AI ANALYSIS ───────────────────────────────────────────
  async function analyzeAI(blob: Blob) {
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      const b64 = await new Promise<string>((res, rej) => {
        reader.onload = () => res((reader.result as string).split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
      const r = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: b64, mediaType: 'image/jpeg' }),
      });
      if (!r.ok) throw new Error();
      const p = await r.json();
      
      // Log which AI responded
      if (p._source) console.log('[AI] Source:', p._source);
      if (p._error) console.warn('[AI] Error:', p._error);
      
      if (p.name || p.description || p.specifications) {
        setForm(prev => {
          // Try to parse suggested price (remove non-numeric except decimal separator)
          let suggestedSellingPrice = prev.sellingPrice;
          if (p.suggestedPrice) {
            const numStr = p.suggestedPrice.replace(/[^0-9]/g, '');
            if (numStr && parseInt(numStr) > 0) suggestedSellingPrice = numStr;
          }
          return {
            ...prev,
            name: p.name || prev.name,
            description: p.description || prev.description,
            specifications: p.specifications || prev.specifications,
            brand: p.brand || prev.brand,
            sellingPrice: suggestedSellingPrice,
            category: p.category
              ? (categories.find(c => c.name.toLowerCase().includes(p.category.toLowerCase()))?.name || prev.category)
              : prev.category,
          };
        });
      }
    } catch { /* silent — AI errors don't block the form */ }
    setIsAnalyzing(false);
  }

  // ── FIREBASE UPLOAD ───────────────────────────────────────────────────────
  async function uploadPhoto(): Promise<string> {
    if (!photoFile || !shop?.id) return form.imageUrl;
    setUploadingPhoto(true);
    try {
      const r = ref(storage, `shops/${shop.id}/products/${Date.now()}.jpg`);
      await uploadBytes(r, photoFile);
      return await getDownloadURL(r);
    } catch { return form.imageUrl; }
    finally { setUploadingPhoto(false); }
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); if (!shop?.id) return;
    setSaving(true);
    let imageUrl = form.imageUrl;
    if (photoFile) imageUrl = await uploadPhoto();
    const data = { name: form.name, description: form.description, specifications: form.specifications, category: form.category, brand: form.brand, costPrice: parseFloat(form.costPrice) || 0, sellingPrice: parseFloat(form.sellingPrice) || 0, stock: parseInt(form.stock) || 0, minStock: parseInt(form.minStock) || 5, isActive: form.isActive, isFeatured: form.isFeatured, imageUrl };
    try {
      editing?.id ? await updateProduct(editing.id, data) : await createProduct(shop.id, data);
      await loadData(); setShowModal(false);
    } catch { alert('Erreur lors de la sauvegarde'); }
    setSaving(false);
  }
  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return;
    await deleteProduct(id); await loadData();
  }
  async function handleAddCat(e: React.FormEvent) {
    e.preventDefault(); if (!shop?.id || !newCat.name.trim()) return;
    await createCategory(shop.id, newCat); setNewCat({ name: '', color: '#ec4899' }); await loadData(); setShowCatModal(false);
  }

  const margin = calculateMargin(parseFloat(form.costPrice) || 0, parseFloat(form.sellingPrice) || 0);
  const filtered = products.filter(p => (p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())) && (!catFilter || p.category === catFilter));
  const primaryColor = shop?.primaryColor || '#ec4899';

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {limits && !limits.canAddProduct && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><AlertTriangle className="w-6 h-6 text-amber-500" /><div><p className="font-semibold text-amber-800">Limite de produits atteinte</p><p className="text-sm text-amber-600">{limits.productsCount}/{limits.plan.maxProducts} produits</p></div></div>
          <Link href="/admin/subscription" className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: primaryColor }}><Crown className="w-4 h-4" />Upgrade</Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800">Produits</h1><p className="text-gray-500 text-sm">{products.length} produits{limits?.plan?.maxProducts !== -1 && ` / ${limits?.plan?.maxProducts} max`}</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowCatModal(true)} className="btn-outline text-sm">+ Catégorie</button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2" style={{ backgroundColor: primaryColor }}><Plus className="w-5 h-5" />Nouveau</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" /></div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="select w-full sm:w-48"><option value="">Toutes catégories</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => (
            <div key={product.id} className={`card hover:shadow-md transition-shadow ${!product.isActive ? 'opacity-60' : ''}`}>
              <div className="mb-3 -mx-6 -mt-6 rounded-t-xl overflow-hidden bg-gray-100" style={{ aspectRatio: '1' }}>
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-gray-300" /></div>}
              </div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>{product.isFeatured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}</div>
                  <p className="text-sm text-gray-500">{product.category}{product.brand && ` • ${product.brand}`}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(product)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(product.id!)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div><p className="text-lg font-bold" style={{ color: primaryColor }}>{formatPrice(product.sellingPrice, shop?.currency)}</p><p className="text-xs text-gray-400">Coût: {formatPrice(product.costPrice, shop?.currency)}</p></div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${product.stock <= (product.minStock || 5) ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>Stock: {product.stock}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12"><Package className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">Aucun produit trouvé</p><button onClick={openAdd} className="btn-primary mt-4" style={{ backgroundColor: primaryColor }}><Plus className="w-5 h-5 inline mr-2" />Ajouter un produit</button></div>
      )}

      {/* ══════════════════ PRODUCT MODAL ═══════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">{editing ? 'Modifier' : 'Nouveau'} produit</h2>
              <button onClick={() => { setShowModal(false); stopCam(); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4">

              {/* ─── PHOTO SECTION ─── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo du produit</label>

                {/* CAMERA */}
                {photoMode === 'camera' && (
                  <div className="relative rounded-xl overflow-hidden bg-black mb-2">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-56 object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    {/* Square guide */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative border-2 border-white/80 rounded-lg" style={{ width: '72%', aspectRatio: '1' }}>
                        {[['top-0 left-0 border-t-4 border-l-4 rounded-tl-lg', 'border-white'],
                          ['top-0 right-0 border-t-4 border-r-4 rounded-tr-lg', 'border-white'],
                          ['bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg', 'border-white'],
                          ['bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg', 'border-white']
                        ].map(([pos]) => <div key={pos} className={`absolute w-6 h-6 ${pos}`} />)}
                      </div>
                    </div>
                    <p className="absolute top-2 left-0 right-0 text-center text-white/80 text-xs">Centrez le produit dans le cadre</p>
                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                      <button type="button" onClick={stopCam} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-sm"><StopCircle className="w-4 h-4" />Annuler</button>
                      <button type="button" onClick={captureCam} className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"><div className="w-11 h-11 rounded-full border-4 border-gray-300" /></button>
                    </div>
                  </div>
                )}

                {/* CROP EDITOR */}
                {photoMode === 'crop' && rawSrc && (
                  <div className="mb-2">
                    <p className="text-xs text-center text-gray-500 mb-2">👆 Glissez pour repositionner le produit</p>
                    <div className="flex justify-center mb-3">
                      <div
                        className="relative overflow-hidden rounded-2xl border-2 border-dashed cursor-grab active:cursor-grabbing select-none touch-none"
                        style={{ width: FRAME, height: FRAME, borderColor: primaryColor }}
                        onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerLeave={onPU}
                      >
                        {/* Corner markers */}
                        {[['top-0 left-0 border-t-4 border-l-4 rounded-tl-xl'],['top-0 right-0 border-t-4 border-r-4 rounded-tr-xl'],['bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl'],['bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl']].map(([cls]) => (
                          <div key={cls} className={`absolute w-7 h-7 z-10 pointer-events-none ${cls}`} style={{ borderColor: primaryColor }} />
                        ))}
                        {/* Crosshair */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-20">
                          <div className="w-px h-full bg-gray-400" /><div className="w-full h-px bg-gray-400 absolute" />
                        </div>
                        {/* Image */}
                        <img
                          ref={cropImgRef} src={rawSrc} alt="" draggable={false}
                          className="absolute pointer-events-none"
                          style={{ left: cropOff.x, top: cropOff.y, width: imgNat.w * cropScale, height: imgNat.h * cropScale, transform: `rotate(${cropRot}deg)`, transformOrigin: 'center' }}
                        />
                      </div>
                    </div>
                    {/* Controls */}
                    <div className="flex items-center gap-2 justify-center mb-3">
                      <button type="button" onClick={() => setCropScale(s => Math.max(0.15, s - 0.08))} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"><ZoomOut className="w-4 h-4" /></button>
                      <input type="range" min="0.15" max="5" step="0.02" value={cropScale} onChange={e => setCropScale(+e.target.value)} className="w-36 accent-pink-500" />
                      <button type="button" onClick={() => setCropScale(s => Math.min(5, s + 0.08))} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"><ZoomIn className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setCropRot(r => (r + 90) % 360)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200" title="Pivoter"><RotateCw className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setPhotoMode('none'); setRawSrc(''); }} className="flex-1 py-2 bg-gray-100 rounded-xl text-sm text-gray-600">Annuler</button>
                      <button type="button" onClick={applyCrop} className="flex-1 py-2 rounded-xl text-sm text-white font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}><Check className="w-4 h-4" />Confirmer</button>
                    </div>
                  </div>
                )}

                {/* PREVIEW (crop done) */}
                {photoMode === 'done' && photoPreview && (
                  <div className="mb-2">
                    <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: '1' }}>
                      <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                          <div className="text-center text-white">
                            <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-300 animate-pulse" />
                            <p className="font-semibold text-sm">IA analyse le produit...</p>
                            <p className="text-xs text-white/70 mt-1">Gemini • GPT-4o ✨</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button type="button" onClick={() => { setPhotoPreview(''); setPhotoFile(null); setPhotoMode('none'); setForm(f => ({ ...f, imageUrl: '' })); }} className="py-1.5 bg-red-50 text-red-500 text-xs rounded-lg hover:bg-red-100">🗑 Supprimer</button>
                      <button type="button" onClick={() => rawSrc ? setPhotoMode('crop') : fileInputRef.current?.click()} className="py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200">✏️ Recadrer</button>
                    </div>
                  </div>
                )}

                {/* Existing photo (edit mode) */}
                {!photoPreview && form.imageUrl && photoMode === 'none' && (
                  <div className="relative mb-2 w-full overflow-hidden rounded-2xl" style={{ aspectRatio: '1' }}>
                    <img src={form.imageUrl} alt="Photo actuelle" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">✓ Actuelle</div>
                  </div>
                )}

                {/* Buttons (when no preview) */}
                {photoMode === 'none' && !photoPreview && (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50">
                      <ImageIcon className="w-4 h-4" />Importer &amp; cadrer
                    </button>
                    <button type="button" onClick={startCam} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}bb)` }}>
                      <Camera className="w-4 h-4" />📷 Photo + IA
                    </button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                {photoMode === 'none' && !photoPreview && !form.imageUrl && (
                  <p className="text-xs text-gray-400 mt-2 text-center">🤖 Gemini + GPT-4o remplissent automatiquement nom, description, caractéristiques et prix suggéré</p>
                )}
              </div>

              {isAnalyzing && photoMode === 'done' && (
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-3">
                  <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                  <p className="text-sm text-purple-700 font-medium">🤖 Gemini + GPT-4o remplissent les champs automatiquement...</p>
                </div>
              )}

              {/* FIELDS */}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Nom du produit" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description {form.description && <span className="text-xs text-green-500 ml-1">✨ Gemini</span>}</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="textarea" rows={2} placeholder="Description attrayante pour les clients" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caractéristiques {form.specifications && <span className="text-xs text-green-500 ml-1">✨ Gemini</span>}</label>
                <textarea value={form.specifications} onChange={e => setForm({ ...form, specifications: e.target.value })} className="textarea font-mono text-xs" rows={4} placeholder={"Couleur: \nMatière: \nDimensions: \nPoids: "} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label><select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="select"><option value="">Choisir...</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Marque</label><input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="input" placeholder="Samsung, Nike..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prix d'achat *</label><input type="number" required min="0" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} className="input" /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente *</label>
                  <input type="number" required min="0" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} className="input" />
                  {margin > 0 && <p className={`text-xs mt-1 font-medium ${margin >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>Marge: {margin}%</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label><input type="number" required min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="input" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock min. alerte</label><input type="number" min="0" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} className="input" /></div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 rounded" /><span className="text-sm">Actif (visible)</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="w-5 h-5 rounded" /><span className="text-sm">⭐ Mis en avant</span></label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); stopCam(); }} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={saving || uploadingPhoto || photoMode === 'crop'} className="btn-primary flex-1 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
                  {(saving || uploadingPhoto) && <Loader2 className="w-5 h-5 animate-spin" />}
                  {photoMode === 'crop' ? 'Confirmez d\'abord le cadrage' : uploadingPhoto ? 'Upload...' : saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b"><h2 className="text-lg font-bold">Nouvelle catégorie</h2><button onClick={() => setShowCatModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleAddCat} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label><input type="text" required value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} className="input" placeholder="Ex: Électronique" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label><input type="color" value={newCat.color} onChange={e => setNewCat({ ...newCat, color: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer" /></div>
              <button type="submit" className="btn-primary w-full" style={{ backgroundColor: primaryColor }}>Créer la catégorie</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}