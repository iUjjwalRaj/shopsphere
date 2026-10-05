import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function Wishlist() {
  const { wishlist, loading, error, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (loading && wishlist.length === 0) return <Loader />;

  if (wishlist.length === 0) {
    return (
      <section className="empty">
        <h2>Your wishlist is empty</h2>
        <p className="muted" style={{ marginBottom: '16px' }}>Save items you like to view them later.</p>
        <Link to="/" className="btn">Explore products</Link>
      </section>
    );
  }

  return (
    <section>
      <div className="row-between" style={{ marginBottom: '20px' }}>
        <h1>My Wishlist ({wishlist.length})</h1>
        <Link to="/" className="btn btn-ghost">Continue shopping →</Link>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="grid">
        {wishlist.map((product) => {
          const outOfStock = product.stock === 0;
          return (
            <article key={product._id} className="card product-card">
              <Link to={`/product/${product._id}`}>
                <img src={product.image} alt={product.name} />
              </Link>
              <div className="card-body">
                <span className="tag">{product.category}</span>
                <Link to={`/product/${product._id}`} className="product-name">
                  {product.name}
                </Link>
                <div className="row-between">
                  <strong>{formatINR(product.price)}</strong>
                  <span className="muted">★ {product.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="row">
                  <button
                    className="btn grow"
                    disabled={outOfStock}
                    onClick={() => addToCart(product)}
                  >
                    {outOfStock ? 'Out of stock' : 'Add to cart'}
                  </button>
                  <button
                    className="btn btn-ghost btn-danger-hover"
                    onClick={() => removeFromWishlist(product._id)}
                    title="Remove from wishlist"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
