import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  const fetchReviews = () => {
    setReviewsLoading(true);
    api
      .get(`/products/${id}/reviews`)
      .then(({ data }) => setReviews(data))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <Loader />;

  const handleAdd = () => {
    addToCart(product, qty);
    navigate('/cart');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setReviewSubmitting(true);

    try {
      await api.post(`/products/${id}/reviews`, {
        rating: Number(reviewRating),
        comment: reviewComment,
      });
      setReviewSuccess('Your review was submitted successfully!');
      setReviewComment('');
      setReviewRating('5');
      // Refresh product rating and reviews list
      const [productRes] = await Promise.all([api.get(`/products/${id}`)]);
      setProduct(productRes.data);
      fetchReviews();
    } catch (err) {
      setReviewError(getErrorMessage(err));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const wishlisted = isInWishlist(product._id);

  const handleWishlist = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    toggleWishlist(product._id);
  };

  return (
    <section className="detail">
      <img src={product.image} alt={product.name} />
      <div>
        <span className="tag">{product.category}</span>
        <h1>{product.name}</h1>
        <p className="muted">by {product.brand} · ★ {product.rating.toFixed(1)}</p>
        <h2>{formatINR(product.price)}</h2>
        <p>{product.description}</p>
        <p className={product.stock > 0 ? 'success' : 'error'}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </p>
        <div className="row" style={{ marginTop: '16px', flexWrap: 'wrap' }}>
          {product.stock > 0 && (
            <>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="qty"
              />
              <button className="btn" onClick={handleAdd}>Add to cart</button>
            </>
          )}
          <button
            type="button"
            className={`btn ${wishlisted ? 'btn-danger' : 'btn-ghost'}`}
            onClick={handleWishlist}
          >
            {wishlisted ? '♥ In Wishlist' : '♡ Add to Wishlist'}
          </button>
        </div>

        {/* Reviews section */}
        <div className="reviews-section">
          <h3>Customer Reviews ({reviews.length})</h3>

          {reviewsLoading ? (
            <p className="muted">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="muted">No reviews yet. Be the first to review!</p>
          ) : (
            <ul className="review-list">
              {reviews.map((r) => (
                <li key={r._id} className="review-item">
                  <div className="review-header">
                    <span className="review-stars" aria-label={`${r.rating} out of 5 stars`}>
                      {renderStars(r.rating)}
                    </span>
                    <span className="review-author">{r.user?.name ?? 'Anonymous'}</span>
                    <span className="muted review-date">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="review-comment">{r.comment}</p>
                </li>
              ))}
            </ul>
          )}

          {user ? (
            <form className="review-form" onSubmit={handleReviewSubmit} id="review-form">
              <h4>Write a Review</h4>
              {reviewError && <p className="error" role="alert">{reviewError}</p>}
              {reviewSuccess && <p className="success" role="status">{reviewSuccess}</p>}
              <label htmlFor="review-rating">Rating</label>
              <select
                id="review-rating"
                value={reviewRating}
                onChange={(e) => setReviewRating(e.target.value)}
                required
              >
                <option value="5">★★★★★ (5) — Excellent</option>
                <option value="4">★★★★☆ (4) — Good</option>
                <option value="3">★★★☆☆ (3) — Average</option>
                <option value="2">★★☆☆☆ (2) — Poor</option>
                <option value="1">★☆☆☆☆ (1) — Terrible</option>
              </select>
              <label htmlFor="review-comment">Comment</label>
              <textarea
                id="review-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                required
                minLength={3}
              />
              <button
                className="btn"
                type="submit"
                id="submit-review-btn"
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <p className="muted">
              <a href="/login">Log in</a> to leave a review.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
