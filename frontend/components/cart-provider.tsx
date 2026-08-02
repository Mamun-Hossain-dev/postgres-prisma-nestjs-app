'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { CartItem, Product } from '@/lib/types';

const CART_STORAGE_KEY = 'devicedock-cart';

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  addItem(product: Product, quantity: number): void;
  updateQuantity(productId: number, quantity: number): void;
  removeItem(productId: number): void;
  removeItems(productIds: number[]): void;
  clear(): void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      if (stored) setItems(parseStoredCart(stored));
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((product: Product, quantity: number) => {
    if (quantity < 1 || product.quantity < 1) return;
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (!existing) {
        return [
          ...current,
          {
            productId: product.id,
            quantity: Math.min(product.quantity, quantity),
            product,
          },
        ];
      }
      return current.map((item) =>
        item.productId === product.id
          ? {
              ...item,
              product,
              quantity: Math.min(product.quantity, item.quantity + quantity),
            }
          : item,
      );
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(item.product.quantity, quantity)),
            }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((current) =>
      current.filter((item) => item.productId !== productId),
    );
  }, []);

  const removeItems = useCallback((productIds: number[]) => {
    const ids = new Set(productIds);
    setItems((current) => current.filter((item) => !ids.has(item.productId)));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const value = useMemo<CartContextValue>(
    () => ({
      items,
      hydrated,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
      addItem,
      updateQuantity,
      removeItem,
      removeItems,
      clear,
    }),
    [addItem, clear, hydrated, items, removeItem, removeItems, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

function parseStoredCart(value: string): CartItem[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem).slice(0, 50);
  } catch {
    return [];
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CartItem>;
  return (
    Number.isInteger(item.productId) &&
    Number.isInteger(item.quantity) &&
    Number(item.quantity) > 0 &&
    Boolean(item.product) &&
    item.product?.id === item.productId
  );
}
