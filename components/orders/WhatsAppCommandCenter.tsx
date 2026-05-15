'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardPaste, FileText, Loader2, MessageCircle, Phone, Plus, Search, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import { addThreadInternalNote, getCustomerProfileById, getInternalNotes, getWhatsappMessages, getWhatsappThreads, markThreadAsProcessed } from '@/lib/merchant-firestore';
import { Customer, InternalNote, MessageAnalysisResult, Product, WhatsappMessage, WhatsappThread } from '@/lib/types';

export interface MessageCaptureDraft {
  customerName?: string;
  originalText: string;
  analysis: MessageAnalysisResult;
}

interface Props {
  merchantId: string;
  adminUserId?: string;
  products: Product[];
  onUseDraft: (draft: MessageCaptureDraft) => void;
  onOpenLinkedOrder?: (orderId: string) => void | Promise<void>;
}

const confidenceLabel = (score: number) =>
  score >= 0.75
    ? { label: 'Confiance forte', className: 'bg-emerald-100 text-emerald-700' }
    : score >= 0.5
      ? { label: 'Confiance moyenne', className: 'bg-amber-100 text-amber-700' }
      : { label: 'Confiance faible', className: 'bg-gray-100 text-gray-600' };

const suggestedActionLabel = (action: MessageAnalysisResult['suggestedAction']) => ({
  create_draft_order: 'Creer une commande brouillon',
  link_existing_order: 'Chercher une commande existante',
  request_payment_confirmation: 'Verifier la preuve de paiement',
  ask_for_details: 'Demander plus de details',
  review_manually: 'Verifier manuellement',
  store_only: 'Stocker sans action',
}[action]);

const categoryLabel = (value?: string) => (value ? value.replaceAll('_', ' ') : 'lecture en attente');
const shortDate = (value?: string) => value ? new Date(value).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
const dayLabel = (value?: string) => value ? new Date(value).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) : '';

export default function WhatsAppCommandCenter({ merchantId, adminUserId, products, onUseDraft, onOpenLinkedOrder }: Props) {
  const [threads, setThreads] = useState<WhatsappThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<WhatsappThread | null>(null);
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [threadCustomers, setThreadCustomers] = useState<Record<string, Customer | null>>({});
  const [loading, setLoading] = useState(true);
  const [inboxError, setInboxError] = useState('');
  const [search, setSearch] = useState('');
  const [captureText, setCaptureText] = useState('');
  const [captureLoading, setCaptureLoading] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [captureDraft, setCaptureDraft] = useState<MessageCaptureDraft | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [markingProcessed, setMarkingProcessed] = useState(false);
  const [threadActionLoading, setThreadActionLoading] = useState(false);
  const [threadActionError, setThreadActionError] = useState('');
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [showCapturePanel, setShowCapturePanel] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getWhatsappThreads(merchantId).then((items) => {
      if (!active) return;
      setThreads(items);
      setSelectedThread(items[0] || null);
    }).catch(() => {
      if (active) setInboxError("Impossible de charger l inbox WhatsApp pour le moment.");
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [merchantId]);

  useEffect(() => {
    if (!selectedThread) {
      setMessages([]); setNotes([]); setCustomer(null); return;
    }
    let active = true;
    Promise.all([
      getWhatsappMessages(selectedThread.id || ''),
      getInternalNotes(selectedThread.id || ''),
      getCustomerProfileById(selectedThread.customerId),
    ]).then(([threadMessages, threadNotes, threadCustomer]) => {
      if (!active) return;
      setMessages(threadMessages);
      setNotes(threadNotes);
      setCustomer(threadCustomer);
    }).catch(() => {
      if (!active) return;
      setMessages([]); setNotes([]); setCustomer(null);
    });
    return () => { active = false; };
  }, [selectedThread]);

  useEffect(() => {
    if (threads.length === 0) return setThreadCustomers({});
    let active = true;
    const customerIds = Array.from(new Set(threads.map((thread) => thread.customerId).filter(Boolean)));
    Promise.all(customerIds.map(async (customerId) => [customerId, await getCustomerProfileById(customerId)] as const))
      .then((entries) => active && setThreadCustomers(Object.fromEntries(entries)))
      .catch(() => active && setThreadCustomers({}));
    return () => { active = false; };
  }, [threads]);

  const threadCounts = useMemo(() => ({
    total: threads.length,
    unread: threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0),
    drafts: threads.filter((thread) => thread.suggestedAction === 'create_draft_order').length,
  }), [threads]);

  const filteredThreads = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return threads;
    return threads.filter((thread) => {
      const c = threadCustomers[thread.customerId];
      return [thread.lastMessage, c?.name, c?.phone, thread.lastCategory].filter(Boolean).join(' ').toLowerCase().includes(normalized);
    });
  }, [search, threadCustomers, threads]);

  async function analyzeTextMessage(text: string) {
    const response = await fetch('/api/whatsapp/analyze-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, knownProducts: products.map((product) => product.name) }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Analyse impossible');
    return data;
  }

  async function analyzeCapture() {
    if (!captureText.trim()) return setCaptureError('Colle un message client pour lancer l analyse.');
    setCaptureLoading(true); setCaptureError('');
    try {
      const data = await analyzeTextMessage(captureText);
      setCaptureDraft({ customerName: data.customerName, originalText: data.originalText, analysis: data.analysis });
    } catch (error) {
      setCaptureDraft(null);
      setCaptureError(error instanceof Error ? error.message : 'Analyse impossible');
    } finally {
      setCaptureLoading(false);
    }
  }

  async function useSelectedThreadInOrder() {
    if (!selectedThread) return;
    const latestIncomingText = [...messages].reverse().find((message) => message.direction === 'incoming' && (message.text || '').trim())?.text || selectedThread.lastMessage;
    if (!latestIncomingText?.trim()) return setThreadActionError("Ce message ne contient pas encore de texte exploitable pour preparer une commande.");
    setThreadActionLoading(true); setThreadActionError('');
    try {
      const data = await analyzeTextMessage(latestIncomingText);
      const draft = { customerName: customer?.name || data.customerName, originalText: latestIncomingText, analysis: data.analysis };
      setCaptureDraft(draft);
      setMobileThreadOpen(false);
      onUseDraft(draft);
    } catch (error) {
      setThreadActionError(error instanceof Error ? error.message : 'Analyse impossible');
    } finally {
      setThreadActionLoading(false);
    }
  }

  async function saveNote() {
    if (!selectedThread?.id || !noteDraft.trim() || !adminUserId) return;
    setSavingNote(true);
    try {
      await addThreadInternalNote({ merchantId, customerId: selectedThread.customerId, threadId: selectedThread.id, orderId: selectedThread.linkedOrderId || undefined, authorId: adminUserId, content: noteDraft.trim() });
      setNotes((current) => [...current, { merchantId, customerId: selectedThread.customerId, threadId: selectedThread.id, orderId: selectedThread.linkedOrderId || undefined, authorId: adminUserId, content: noteDraft.trim(), createdAt: new Date().toISOString() }]);
      setNoteDraft('');
    } finally {
      setSavingNote(false);
    }
  }

  async function handleMarkProcessed() {
    if (!selectedThread?.id) return;
    setMarkingProcessed(true);
    try {
      await markThreadAsProcessed(selectedThread.id);
      setThreads((current) => current.map((thread) => thread.id === selectedThread.id ? { ...thread, unreadCount: 0, status: 'processed' } : thread));
      setSelectedThread((current) => current ? { ...current, unreadCount: 0, status: 'processed' } : current);
      setMobileThreadOpen(false);
    } finally {
      setMarkingProcessed(false);
    }
  }

  const selectedConfidence = selectedThread ? confidenceLabel(selectedThread.lastConfidenceScore || 0) : null;
  const captureConfidence = captureDraft ? confidenceLabel(captureDraft.analysis.confidenceScore) : null;

  const capturePanel = (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-orange-100 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200"><ClipboardPaste className="h-5 w-5" /></div>
          <div><p className="font-black text-gray-900">Coller un message client</p><p className="mt-1 text-sm leading-6 text-gray-500">Copie le message depuis WhatsApp, colle-le ici, puis l app prepare une commande propre.</p></div>
        </div>
        <textarea value={captureText} onChange={(event) => setCaptureText(event.target.value)} rows={8} className="mt-4 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-7 text-gray-700 outline-none transition focus:border-orange-200 focus:ring-2 focus:ring-orange-100" placeholder="Ex: Bonjour, je veux 2 paires noires taille 42 pour Douala." />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button onClick={() => void analyzeCapture()} disabled={captureLoading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:opacity-60">{captureLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Comprendre le message</button>
          {captureDraft && <button onClick={() => onUseDraft(captureDraft)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"><Plus className="h-4 w-4" />Créer la commande</button>}
        </div>
        {captureError && <p className="mt-3 text-sm font-medium text-red-500">{captureError}</p>}
      </div>
      {captureDraft && captureConfidence && (
        <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Lecture du message</p><h3 className="mt-1 text-lg font-black capitalize text-gray-900">{categoryLabel(captureDraft.analysis.category)}</h3></div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${captureConfidence.className}`}>{captureConfidence.label}</span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Ce qu il faut retenir</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-600">{captureDraft.analysis.explanation.map((item) => <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" /><span>{item}</span></li>)}</ul>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Prochaine action</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-gray-800">{suggestedActionLabel(captureDraft.analysis.suggestedAction)}</p>
              <div className="mt-3 flex flex-wrap gap-2">{captureDraft.analysis.extractedOrderSignals.length > 0 ? captureDraft.analysis.extractedOrderSignals.map((signal) => <span key={`${signal.productName}-${signal.quantity}`} className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">{signal.quantity} x {signal.productName}</span>) : <span className="text-sm text-gray-500">Aucun article precise pour l instant.</span>}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const conversationPanel = !selectedThread ? (
    <div className="flex min-h-[34rem] items-center justify-center rounded-[28px] border border-dashed border-gray-200 bg-white p-8 text-center"><div className="max-w-sm"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"><MessageCircle className="h-6 w-6" /></div><h3 className="text-lg font-black text-gray-900">Choisis une conversation</h3><p className="mt-2 text-sm leading-7 text-gray-500">Ouvre un message pour voir le fil complet, la lecture metier et la prochaine action.</p></div></div>
  ) : (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Conversation active</p><h3 className="mt-1 text-xl font-black text-gray-900">{customer?.name || customer?.phone || 'Client WhatsApp'}</h3><p className="mt-2 text-sm text-gray-500">{selectedThread.linkedOrderId ? 'Une commande est deja liee a cette conversation.' : 'Cette conversation peut devenir une commande.'}</p><p className="mt-2 text-xs font-semibold text-gray-400">Dernier message: {shortDate(selectedThread.lastMessageAt)}</p></div>
          <div className="flex flex-wrap gap-2">{selectedThread.linkedOrderId && <button onClick={() => { setMobileThreadOpen(false); void onOpenLinkedOrder?.(selectedThread.linkedOrderId!); }} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-black text-gray-800 transition hover:border-gray-300 hover:shadow-soft">Ouvrir la commande</button>}<button onClick={() => void useSelectedThreadInOrder()} disabled={threadActionLoading || !!selectedThread.linkedOrderId} className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600 disabled:opacity-50">{threadActionLoading ? 'Preparation...' : selectedThread.linkedOrderId ? 'Commande deja creee' : 'Preparer une commande'}</button><button onClick={() => void handleMarkProcessed()} disabled={markingProcessed} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100">{markingProcessed ? '...' : 'Marquer comme traite'}</button></div>
        </div>
      </div>
      <div className="rounded-[24px] border border-orange-100 bg-orange-50/70 px-4 py-3"><p className="text-sm font-semibold text-orange-900">{selectedThread.linkedOrderId ? 'Action recommande: ouvrir la commande deja creee pour continuer le traitement.' : 'Action recommande: cliquer sur "Preparer une commande" pour transformer ce message en brouillon.'}</p>{threadActionError && <p className="mt-2 text-sm font-medium text-red-600">{threadActionError}</p>}</div>
      <div className="rounded-[28px] border border-gray-100 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_12rem)] p-4 shadow-soft"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Fil complet</p><p className="mt-1 text-sm text-gray-500">Lis d abord le dernier message, puis prepare la commande si besoin.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-500 shadow-soft">{messages.length} message{messages.length > 1 ? 's' : ''}</span></div><div className="space-y-3">{messages.map((message) => { const incoming = message.direction === 'incoming'; return <div key={message.id} className={`max-w-[88%] rounded-[22px] border px-4 py-3 shadow-sm ${incoming ? 'border-gray-100 bg-white text-gray-800' : 'ml-auto border-emerald-100 bg-emerald-50 text-emerald-900'}`}><div className="mb-2 flex items-center justify-between gap-3 text-[11px]"><span className={`rounded-full px-2.5 py-1 font-bold ${incoming ? 'bg-orange-50 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{incoming ? 'Client' : 'Vous'}</span><span className="text-gray-400">{shortDate(message.createdAt)}</span></div><p className="whitespace-pre-wrap break-words text-sm leading-7">{message.text || '[message media]'}</p></div>; })}</div></div>
    </div>
  );

  const contextPanel = !selectedThread ? (
    <div className="space-y-4"><InfoCard icon={<MessageCircle className="h-5 w-5 text-orange-500" />} title="Centre de tri simple" text="Chaque message devient visible, lisible et pret a etre traite sans se perdre dans WhatsApp." /><InfoCard icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />} title="IA jamais autonome" text="L IA peut suggerer, mais aucun message ne part seul." /><InfoCard icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} title="Reprise manuelle facile" text="Si le signal n est pas assez fort, tu gardes toujours la main." /></div>
  ) : (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700"><UserRound className="h-5 w-5" /></div>
          <div><p className="font-black text-gray-900">{customer?.name || 'Client WhatsApp'}</p><p className="mt-1 flex items-center gap-1 text-sm text-gray-500"><Phone className="h-3.5 w-3.5" />{customer?.phone || 'Numero en attente'}</p></div>
        </div>
        {selectedConfidence && <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-black capitalize text-gray-900">{categoryLabel(selectedThread.lastCategory)}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${selectedConfidence.className}`}>{selectedConfidence.label}</span></div>{selectedThread.suggestedAction && <p className="mt-2 text-sm leading-6 text-gray-600">{suggestedActionLabel(selectedThread.suggestedAction)}</p>}</div>}
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Aucun message WhatsApp ne part seul. L app suggere, l humain valide.</div>
      </div>
      <details className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-soft">
        <summary className="cursor-pointer list-none text-sm font-black text-gray-800">Voir les notes et details utiles</summary>
        <div className="mt-4 space-y-4">
          <div className="rounded-[24px] border border-orange-100 bg-orange-50/80 p-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Chemin simple</p><ol className="mt-2 space-y-1 text-sm leading-6 text-orange-900"><li>1. Ouvrir la conversation.</li><li>2. Lire ce que l app a compris.</li><li>3. Cliquer sur "Preparer une commande".</li><li>4. Verifier et enregistrer.</li></ol></div>
          <div><div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" /><p className="text-sm font-black text-gray-800">Notes internes</p></div><div className="max-h-52 space-y-2 overflow-y-auto">{notes.length === 0 ? <p className="text-sm text-gray-500">Aucune note pour cette conversation.</p> : notes.map((note, index) => <div key={`${note.createdAt}-${index}`} className="rounded-2xl border border-gray-100 bg-gray-50 p-3"><p className="text-sm leading-6 text-gray-700">{note.content}</p><p className="mt-2 text-[11px] text-gray-400">{shortDate(note.createdAt)}</p></div>)}</div>{adminUserId && <div className="mt-4 space-y-2"><textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} rows={3} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-700 outline-none transition resize-none focus:border-orange-200 focus:ring-2 focus:ring-orange-100" placeholder="Ajouter une note interne..." /><button onClick={() => void saveNote()} disabled={savingNote || !noteDraft.trim()} className="w-full rounded-2xl bg-gray-900 px-4 py-3 text-sm font-black text-white transition hover:bg-black disabled:opacity-40">{savingNote ? 'Enregistrement...' : 'Ajouter la note'}</button></div>}</div>
        </div>
      </details>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-soft">
      <div className="border-b border-gray-100 bg-[linear-gradient(180deg,rgba(255,247,237,0.75),rgba(255,255,255,1))] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">Message client → commande claire</h2>
            <p className="mt-2 text-sm leading-7 text-gray-500">Le commerçant colle ou ouvre un message, MasterShopPro aide à créer une commande, suivre le paiement et ne rien oublier.</p>
            <button
              onClick={() => {
                setShowCapturePanel(true);
                setSelectedThread(null);
                setThreadActionError('');
                setMobileThreadOpen(false);
              }}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-black text-white transition hover:bg-black"
            >
              <Plus className="h-4 w-4" />
              Coller un message WhatsApp
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm"><MetricCard value={threadCounts.total} label="Clients" tone="default" /><MetricCard value={threadCounts.unread} label="Nouveaux" tone="orange" /><MetricCard value={threadCounts.drafts} label="Commandes" tone="emerald" /></div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[310px_minmax(0,1fr)_340px]">
        <aside className="border-r border-gray-100 bg-white p-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500"><Search className="h-4 w-4" />Conversations</div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, numero, mot-cle..." className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-200 focus:ring-2 focus:ring-orange-100" />
            </div>
          </div>
          <div className="mt-4 space-y-2">{loading ? <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Chargement des conversations...</div> : filteredThreads.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4"><p className="font-semibold text-gray-800">Aucune conversation trouvee</p><p className="mt-2 text-sm leading-6 text-gray-500">{threads.length === 0 ? 'Les nouveaux messages WhatsApp apparaitront ici. Tu peux deja coller un message client reel.' : 'Aucune conversation ne correspond a ta recherche.'}</p>{inboxError && <p className="mt-3 text-xs font-medium text-orange-600">{inboxError}</p>}</div> : filteredThreads.map((thread) => { const c = threadCustomers[thread.customerId]; const selected = !showCapturePanel && selectedThread?.id === thread.id; const label = c?.name || c?.phone || 'Conversation client'; const sub = c?.name && c?.phone ? c.phone : null; const isNew = (thread.unreadCount || 0) > 0; return <button key={thread.id} onClick={() => { setShowCapturePanel(false); setSelectedThread(thread); setThreadActionError(''); setMobileThreadOpen(true); }} className={`w-full rounded-[24px] border p-4 text-left transition ${selected ? 'border-orange-200 bg-orange-50 shadow-soft' : isNew ? 'border-orange-200 bg-orange-50/40 hover:border-orange-300' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-soft'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-black text-gray-900">{label}</p>{isNew && <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-black text-white">Nouveau</span>}</div>{sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}</div><div className="text-right">{thread.unreadCount > 0 && <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-2 text-xs font-black text-white">{thread.unreadCount}</span>}<p className="mt-2 text-[11px] font-semibold text-gray-400">{dayLabel(thread.lastMessageAt)}</p></div></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-700">{thread.lastMessage}</p><div className="mt-3 flex items-center justify-between gap-2 text-[11px]"><span className="rounded-full bg-gray-100 px-2.5 py-1 font-bold text-gray-600">{thread.linkedOrderId ? 'Commande liee' : 'A verifier'}</span><span className="text-gray-400">{shortDate(thread.lastMessageAt)}</span></div></button>; })}</div>
        </aside>
        <div className="hidden border-r border-gray-100 bg-slate-50/50 p-5 xl:block">{showCapturePanel ? capturePanel : selectedThread || threads.length > 0 ? conversationPanel : capturePanel}</div>
        <aside className="hidden bg-slate-50/70 p-5 xl:block">{showCapturePanel ? <div className="space-y-4"><InfoCard icon={<Sparkles className="h-5 w-5 text-orange-500" />} title="Fonction utile sans connecteur" text="Le commercant peut coller un message WhatsApp et preparer une commande meme si Meta n est pas encore connecte." /><InfoCard icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />} title="Controle humain" text="L app propose, le commercant valide." /></div> : selectedThread ? contextPanel : capturePanel}</aside>
      </div>

      {selectedThread && mobileThreadOpen && <div className="fixed inset-0 z-50 bg-black/55 p-3 backdrop-blur-sm xl:hidden"><div className="flex h-full w-full flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl"><div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Conversation WhatsApp</p><p className="truncate text-base font-black text-gray-900">{customer?.name || customer?.phone || 'Client WhatsApp'}</p></div><button onClick={() => setMobileThreadOpen(false)} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-600"><X className="h-5 w-5" /></button></div><div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4"><div className="rounded-[28px] border border-gray-100 bg-white p-4 shadow-soft">{conversationPanel}</div><div className="rounded-[28px] border border-gray-100 bg-white p-4 shadow-soft">{contextPanel}</div></div></div></div>}
    </section>
  );
}

function MetricCard({ value, label, tone }: { value: number; label: string; tone: 'default' | 'orange' | 'emerald' }) {
  const toneClass = tone === 'orange' ? 'bg-orange-50 border-orange-100 text-orange-700' : tone === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-gray-50 border-gray-100 text-gray-800';
  return <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}><p className="text-lg font-black">{value}</p><p className="mt-1 text-xs font-semibold opacity-80">{label}</p></div>;
}

function InfoCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-soft"><div className="mb-2 flex items-center gap-3">{icon}<p className="font-black text-gray-900">{title}</p></div><p className="text-sm leading-7 text-gray-500">{text}</p></div>;
}
