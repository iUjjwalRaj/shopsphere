import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Toast from '../components/Toast.jsx';

const CartContext = createContext(null);
const STORAGE_KEY = 'shopsphere_cart';

// The cart lives only in localStorage for now.
// See issue: "Persist cart on the server for logged-in users".
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [toast, setToast] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showToast = (message) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(message);
    timerRef.current = setTimeout(() => {
      setToast('');
    }, 2000);
  };

  const addToCart = (product, quantity = 1) => {
    if (!product || !product._id) return;
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
    showToast(`${product.name} added to cart`);
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
      value={{ items, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice, showToast }}
    >
      {children}
      <Toast message={toast} />
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
