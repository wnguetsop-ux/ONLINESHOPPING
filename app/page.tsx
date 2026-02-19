'use client';
import Link from 'next/link';
import { Store, ShoppingBag, BarChart3, Smartphone, CheckCircle, ArrowRight, Star, Users, Package, CreditCard, TrendingUp, Shield, Zap, Globe, Play, MessageCircle, Mail, Phone } from 'lucide-react';

export default function HomePage() {
  // Tes informations de contact
  const WHATSAPP = '393299639430';  // 0039 3299639430 (Italie)
  const EMAIL = 'wnguetsop@gmail.com';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-800">ShopMaster</span>
              <span className="text-[10px] text-orange-500 block -mt-1">POINT DE VENTE</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-800 font-medium">Fonctionnalités</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-800 font-medium">Tarifs</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-800 font-medium">Contact</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-gray-600 hover:text-gray-800 font-medium px-4 py-2 hidden sm:block">
              Connexion
            </Link>
            <Link href="/register" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Style Loyverse */}
      <section className="bg-gradient-to-b from-orange-50 to-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-6">
                Logiciel de caisse et de gestion de stock
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Transformez votre smartphone ou tablette en un puissant logiciel de caisse dans le cloud. 
                Gérez facilement vos ventes, votre inventaire et vos clients. 
                Que vous ayez un ou plusieurs magasins, nos outils vous aident à mieux gérer votre activité.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/register" 
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg text-center transition-colors"
                >
                  Commencer gratuitement
                </Link>
                <a 
                  href={`https://wa.me/${WHATSAPP}?text=Bonjour, je souhaite en savoir plus sur ShopMaster`}
                  target="_blank"
                  className="border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold px-8 py-4 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Discuter avec nous
                </a>
              </div>
              
              <div className="flex items-center gap-2 mt-6 text-sm text-gray-500">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Gratuit pour commencer • Aucune carte requise</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-4 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">Dashboard</span>
                    <span className="text-sm opacity-80">Aujourd'hui</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-2xl font-bold">125K</p>
                      <p className="text-xs opacity-80">Ventes FCFA</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-2xl font-bold">23</p>
                      <p className="text-xs opacity-80">Commandes</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-2xl font-bold">+18%</p>
                      <p className="text-xs opacity-80">Croissance</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-2xl font-bold">45K</p>
                      <p className="text-xs opacity-80">Bénéfice</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="font-medium text-gray-700">Produit A</span>
                    </div>
                    <span className="font-semibold text-green-600">+15 000 F</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-500" />
                      </div>
                      <span className="font-medium text-gray-700">Produit B</span>
                    </div>
                    <span className="font-semibold text-green-600">+8 500 F</span>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm font-medium text-gray-700">Vente confirmée!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white">500+</p>
              <p className="text-gray-400 mt-1">Boutiques actives</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white">50K+</p>
              <p className="text-gray-400 mt-1">Transactions/mois</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white">15+</p>
              <p className="text-gray-400 mt-1">Pays</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white">99.9%</p>
              <p className="text-gray-400 mt-1">Disponibilité</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 1 - Caisse en cloud */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-green-500 p-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                    <span className="text-white text-sm ml-2">Point de Vente</span>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-2">
                    {['☕ Café', '🥐 Croissant', '🍕 Pizza', '🍔 Burger', '🥗 Salade', '🍦 Glace'].map((item, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 text-center hover:bg-orange-50 cursor-pointer transition-colors">
                        <span className="text-xl">{item.split(' ')[0]}</span>
                        <p className="text-xs text-gray-600 mt-1">{item.split(' ')[1]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold text-gray-800">12 500 F</p>
                    </div>
                    <button className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium">
                      Payer
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Caisse enregistreuse dans le cloud
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Transformez votre smartphone ou tablette en un terminal de caisse facile à utiliser.
              </p>
              <ul className="space-y-4">
                {[
                  'Émettez des reçus imprimés ou électroniques',
                  'Appliquez des remises et émettez des remboursements',
                  'Continuez à enregistrer les ventes même hors ligne',
                  'Connectez une imprimante de reçus et un scanner',
                  'Acceptez tous les modes de paiement (Mobile Money, Cash)',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 2 - Analytics */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Rapports et analyses en temps réel
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Accédez à vos rapports depuis smartphone, tablette ou ordinateur, où que vous soyez.
              </p>
              <ul className="space-y-4">
                {[
                  'Visualisez entrées, ventes moyennes et bénéfices',
                  'Suivez les tendances des ventes en temps réel',
                  'Identifiez les articles et catégories les plus vendus',
                  'Historique complet de toutes les transactions',
                  'Exportez vos données en Excel',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-800">Ventes ce mois</h3>
                  <select className="text-sm border rounded-lg px-3 py-1">
                    <option>Février 2026</option>
                  </select>
                </div>
                <div className="flex items-end gap-2 h-40">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all hover:from-orange-600 hover:to-orange-500"
                      style={{ height: `${h}%` }}
                    ></div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Total ventes</p>
                    <p className="text-xl font-bold text-gray-800">2.5M F</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bénéfice</p>
                    <p className="text-xl font-bold text-green-600">850K F</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commandes</p>
                    <p className="text-xl font-bold text-gray-800">342</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section 3 - Gestion stock */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  Gestion de l'inventaire
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'iPhone 15 Pro', stock: 12, status: 'ok' },
                    { name: 'Samsung S24', stock: 5, status: 'low' },
                    { name: 'AirPods Pro', stock: 2, status: 'critical' },
                    { name: 'MacBook Air', stock: 8, status: 'ok' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'ok' ? 'bg-green-500' :
                          item.status === 'low' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className={`font-semibold ${
                        item.status === 'ok' ? 'text-green-600' :
                        item.status === 'low' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        Stock: {item.stock}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-500 text-lg">⚠️</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">Alerte stock faible</p>
                    <p className="text-xs text-red-600">2 produits à réapprovisionner</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                Gestion intelligente du stock
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Ne manquez plus jamais une vente à cause d'un stock épuisé.
              </p>
              <ul className="space-y-4">
                {[
                  'Alertes automatiques de stock faible',
                  'Suivi des mouvements de stock en temps réel',
                  'Gestion multi-entrepôts',
                  'Historique des ajustements d\'inventaire',
                  'Import/export de produits en masse',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Pourquoi choisir ShopMaster ?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              La solution complète pour gérer votre commerce, que vous soyez une petite boutique ou une chaîne de magasins.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, title: 'Multi-plateforme', desc: 'Fonctionne sur smartphone, tablette et ordinateur. Synchronisation automatique.' },
              { icon: Shield, title: 'Sécurisé', desc: 'Vos données sont chiffrées et sauvegardées dans le cloud. Accès sécurisé.' },
              { icon: Zap, title: 'Rapide', desc: 'Interface optimisée pour des transactions rapides, même hors connexion.' },
              { icon: Globe, title: 'Multi-boutiques', desc: 'Gérez plusieurs points de vente depuis un seul tableau de bord.' },
              { icon: TrendingUp, title: 'Évolutif', desc: 'Commencez petit et grandissez. Notre système s\'adapte à vos besoins.' },
              { icon: Users, title: 'Support humain', desc: 'Équipe disponible sur WhatsApp pour vous accompagner.' },
            ].map((item, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Tarifs simples et transparents</h2>
            <p className="text-gray-600">Commencez gratuitement, évoluez selon vos besoins</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 hover:border-gray-200 transition-colors">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Gratuit</h3>
                <p className="text-5xl font-bold text-gray-800">0<span className="text-lg font-normal text-gray-400"> FCFA</span></p>
                <p className="text-gray-500 mt-2">Pour démarrer</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['20 produits', '20 commandes/mois', '1 utilisateur', 'Rapports basiques', 'Support email'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full py-3 text-center border-2 border-orange-500 text-orange-500 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
                Commencer
              </Link>
            </div>
            
            {/* Starter */}
            <div className="bg-white rounded-2xl border-2 border-orange-500 p-8 relative shadow-xl scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                ⭐ Populaire
              </div>
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Starter</h3>
                <p className="text-5xl font-bold text-orange-500">1 000<span className="text-lg font-normal text-gray-400"> F/mois</span></p>
                <p className="text-gray-500 mt-2">Pour les petits commerces</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['50 produits', '100 commandes/mois', '2 utilisateurs', 'Rapports avancés', 'Support prioritaire', 'Export données'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full py-3 text-center bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors">
                Commencer
              </Link>
            </div>
            
            {/* Pro */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 hover:border-gray-200 transition-colors">
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Pro</h3>
                <p className="text-5xl font-bold text-purple-600">2 500<span className="text-lg font-normal text-gray-400"> F/mois</span></p>
                <p className="text-gray-500 mt-2">Pour les entreprises</p>
              </div>
              <ul className="space-y-4 mb-8">
                {['Produits illimités', 'Commandes illimitées', 'Utilisateurs illimités', 'Multi-boutiques', 'Support 24/7', 'API accès'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full py-3 text-center border-2 border-purple-500 text-purple-500 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                Commencer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à digitaliser votre commerce ?
          </h2>
          <p className="text-orange-100 mb-8 text-lg">
            Rejoignez des centaines de commerçants qui font confiance à ShopMaster
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 font-semibold px-8 py-4 rounded-lg hover:bg-orange-50 transition-colors"
            >
              Créer ma boutique gratuite
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href={`https://wa.me/${WHATSAPP}?text=Bonjour, je voudrais une démo de ShopMaster`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 bg-green-500 text-white font-semibold px-8 py-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Demander une démo
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Contactez-nous</h2>
            <p className="text-gray-600">Notre équipe est disponible pour répondre à vos questions</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <a 
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center group"
            >
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">WhatsApp</h3>
              <p className="text-gray-600">+32 996 394 30</p>
            </a>
            
            <a 
              href={`mailto:${EMAIL}`}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center group"
            >
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <Mail className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Email</h3>
              <p className="text-gray-600">{EMAIL}</p>
            </a>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Mobile Money</h3>
              <p className="text-gray-600">+237 651 495 483</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">ShopMaster</span>
              </div>
              <p className="text-sm">
                La solution de caisse et gestion de stock pour les commerces modernes.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><Link href="/register" className="hover:text-white transition-colors">S'inscrire</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href={`mailto:${EMAIL}`} className="hover:text-white transition-colors">Contact</a></li>
                <li><a href={`https://wa.me/${WHATSAPP}`} target="_blank" className="hover:text-white transition-colors">WhatsApp</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} ShopMaster. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}