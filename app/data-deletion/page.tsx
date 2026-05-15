export const metadata = {
  title: 'Suppression des donnees - MasterShopPro',
  description: 'Procedure de suppression des donnees MasterShopPro.',
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">MasterShopPro</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Suppression des donnees</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Vous pouvez demander la suppression des donnees associees a votre compte MasterShopPro.
        </p>

        <div className="mt-8 space-y-5 text-sm leading-7 text-slate-600">
          <p>
            Pour demander la suppression, contactez le support MasterShopPro depuis l application ou envoyez une demande avec l email utilise pour votre compte administrateur.
          </p>
          <p>
            La demande doit indiquer le nom de la boutique, le numero WhatsApp professionnel concerne et l email du compte. Nous verifierons l identite du demandeur avant suppression.
          </p>
          <p>
            Certaines donnees peuvent etre conservees temporairement lorsque la loi l exige, pour la securite, la prevention de fraude ou la resolution d un litige.
          </p>
        </div>
      </section>
    </main>
  );
}
