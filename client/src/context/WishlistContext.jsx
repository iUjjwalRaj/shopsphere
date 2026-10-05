import { createContext, useContext, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      setError('');
      return;
    }

    setLoading(true);
    api
      .get('/wishlist')
      .then(({ data }) => {
        setWishlist(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err) => {
        setError(getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [user]);

  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlist.some((item) => (item._id || item) === productId);
  };

  const addToWishlist = async (productId) => {
    if (!user) return;
    try {
      const { data } = await api.post('/wishlist', { productId });
      setWishlist(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return;
    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      setWishlist(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) return;
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        error,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
