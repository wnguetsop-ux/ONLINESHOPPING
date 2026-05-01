import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="text-6xl mb-4">📦</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Produit introuvable</h1>
      <p className="text-gray-600 mb-6 max-w-sm">
        Ce produit n&apos;existe plus ou a été retiré par le commerçant.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl transition"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
