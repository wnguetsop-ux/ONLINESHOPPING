export const metadata = {
  title: 'Conditions d utilisation - MasterShopPro',
  description: 'Conditions d utilisation de MasterShopPro.',
};

const sections = [
  {
    title: '1. Objet du service',
    body: 'MasterShopPro fournit des outils pour aider les commercants a gerer leurs produits, commandes, clients, paiements, messages et boutique partageable.',
  },
  {
    title: '2. Responsabilite du commercant',
    body: 'Le commercant reste responsable des informations qu il enregistre, des produits vendus, des prix, des livraisons, des paiements et de sa relation avec ses clients.',
  },
  {
    title: '3. WhatsApp Business',
    body: 'Lorsqu un compte WhatsApp Business est connecte, MasterShopPro peut recevoir les messages entrants autorises par le commercant afin de les afficher dans l application. Les envois automatiques ne sont pas actives par defaut.',
  },
  {
    title: '4. Paiements et abonnements',
    body: 'Certaines fonctionnalites peuvent etre soumises a un abonnement. Les prix et limites applicables sont affiches dans l application ou sur la page de presentation.',
  },
  {
    title: '5. Disponibilite',
    body: 'Nous faisons le maximum pour maintenir le service disponible, mais des interruptions peuvent survenir pour maintenance, incident technique ou dependance a des services externes.',
  },
  {
    title: '6. Utilisation interdite',
    body: 'Il est interdit d utiliser MasterShopPro pour la fraude, le spam, l usurpation d identite, les contenus illegaux ou toute activite contraire aux regles applicables de WhatsApp, Meta ou des lois locales.',
  },
  {
    title: '7. Contact',
    body: 'Pour toute question, contactez le support MasterShopPro depuis l application ou via les informations de contact disponibles sur le site.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">MasterShopPro</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Conditions d utilisation</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Derniere mise a jour : 23 avril 2026. En utilisant MasterShopPro, vous acceptez ces conditions.
        </p>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-black">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
