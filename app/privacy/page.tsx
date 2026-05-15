export const metadata = {
  title: 'Politique de confidentialite - MasterShopPro',
  description: 'Politique de confidentialite de MasterShopPro.',
};

const sections = [
  {
    title: '1. Qui sommes-nous ?',
    body: 'MasterShopPro est une application de gestion commerciale qui aide les commercants a organiser leurs produits, clients, commandes et messages lies a leur activite.',
  },
  {
    title: '2. Donnees collectees',
    body: 'Nous pouvons traiter les informations necessaires au fonctionnement du service: nom de boutique, email de compte, numero de telephone professionnel, produits, commandes, clients, messages entrants, notes internes et informations de paiement liees a l abonnement.',
  },
  {
    title: '3. Utilisation des donnees',
    body: 'Les donnees sont utilisees pour fournir le service, afficher les commandes, organiser les messages WhatsApp entrants, ameliorer la securite, assurer le support et gerer les abonnements.',
  },
  {
    title: '4. WhatsApp et Meta',
    body: 'Si un commercant connecte WhatsApp Business, les messages entrants peuvent etre recus par MasterShopPro afin de les afficher dans son espace de gestion. MasterShopPro ne vend pas ces donnees et ne les utilise pas pour envoyer des messages automatiques sans action explicite du commercant.',
  },
  {
    title: '5. Partage des donnees',
    body: 'Nous ne vendons pas les donnees personnelles. Certaines donnees peuvent etre traitees par des prestataires techniques necessaires au service, comme l hebergement, la base de donnees, l authentification, le paiement ou les services WhatsApp/Meta.',
  },
  {
    title: '6. Conservation',
    body: 'Les donnees sont conservees tant que le compte est actif ou tant que cela est necessaire pour fournir le service, respecter nos obligations legales, prevenir la fraude ou resoudre un litige.',
  },
  {
    title: '7. Suppression des donnees',
    body: 'Un utilisateur peut demander la suppression de ses donnees en utilisant la page de suppression des donnees ou en contactant le support MasterShopPro.',
  },
  {
    title: '8. Contact',
    body: 'Pour toute question sur la confidentialite, contactez MasterShopPro via le support indique dans l application ou par email a l adresse du compte administrateur.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">MasterShopPro</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Politique de confidentialite</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Derniere mise a jour : 23 avril 2026. Cette page explique comment MasterShopPro traite les donnees dans le cadre de son service de gestion des ventes et commandes.
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
