'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getAdmin, getShopByOwnerId } from '@/lib/firestore';
import { Admin, Shop } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  shop: Shop | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshShop: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  admin: null,
  shop: null,
  loading: true,
  logout: async () => {},
  refreshShop: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadAdminData = async (firebaseUser: User) => {
    try {
      const adminData = await getAdmin(firebaseUser.uid);
      setAdmin(adminData);
      
      if (adminData) {
        const shopData = await getShopByOwnerId(firebaseUser.uid);
        setShop(shopData);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await loadAdminData(firebaseUser);
      } else {
        setAdmin(null);
        setShop(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setAdmin(null);
    setShop(null);
    router.push('/login');
  };

  const refreshShop = async () => {
    if (user) {
      const shopData = await getShopByOwnerId(user.uid);
      setShop(shopData);
    }
  };

  return (
    <AuthContext.Provider value={{ user, admin, shop, loading, logout, refreshShop }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
