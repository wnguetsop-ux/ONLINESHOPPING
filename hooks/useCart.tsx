'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/types';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  shopSlug: string | null;
  addToCart: (product: Product, shopSlug: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('cart');
    const savedSlug = localStorage.getItem('cartShopSlug');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
        setShopSlug(savedSlug);
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('cart', JSON.stringify(items));
      if (shopSlug) {
        localStorage.setItem('cartShopSlug', shopSlug);
      }
    }
  }, [items, shopSlug, mounted]);

  const addToCart = (product: Product, newShopSlug: string, quantity = 1) => {
    // Si le panier contient des produits d'une autre boutique, le vider
    if (shopSlug && shopSlug !== newShopSlug) {
      setItems([]);
    }
    
    setShopSlug(newShopSlug);
    
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.product.id !== productId);
      if (newItems.length === 0) {
        setShopSlug(null);
        localStorage.removeItem('cartShopSlug');
      }
      return newItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, item.product.stock) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setShopSlug(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('cartShopSlug');
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      shopSlug, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      totalItems, 
      subtotal 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
