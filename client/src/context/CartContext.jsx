import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
const STORAGE_KEY = 'shopsphere_cart';

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const initialSyncRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!user) {
      initialSyncRef.current = false;
      return;
    }

    let isMounted = true;
    api
      .get('/cart')
      .then(({ data }) => {
        if (!isMounted) return;
        setItems((currentLocal) => {
          const serverItems = Array.isArray(data) ? data : [];
          const merged = [...serverItems];
          for (const localItem of currentLocal) {
            const existing = merged.find(
              (s) => String(s.product) === String(localItem.product)
            );
            if (existing) {
              existing.quantity = Math.max(existing.quantity, localItem.quantity);
            } else {
              merged.push(localItem);
            }
          }
          api.put('/cart', { items: merged }).catch(() => {});
          initialSyncRef.current = true;
          return merged;
        });
      })
      .catch(() => {
        initialSyncRef.current = true;
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (user && initialSyncRef.current) {
      api.put('/cart', { items }).catch(() => {});
    }
  }, [items, user]);

  const addToCart = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product === product._id);
      if (existing) {
        return prev.map((i) =>
          i.product === product._id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        { product: product._id, name: product.name, price: product.price, image: product.image, quantity },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    setItems((prev) => prev.map((i) => (i.product === productId ? { ...i, quantity } : i)));
  };

  const removeFromCart = (productId) =>
    setItems((prev) => prev.filter((i) => i.product !== productId));

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
