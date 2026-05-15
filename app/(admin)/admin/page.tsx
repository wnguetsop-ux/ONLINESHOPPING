import { redirect } from 'next/navigation';

// /admin → Produits en premier (cœur de l'app)
export default function AdminRoot() {
  redirect('/admin/products');
}
