import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import Loader from '../components/Loader.jsx';
import { CATEGORIES } from '../utils/format.js';
import useDebounce from '../hooks/useDebounce.js';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setLoading(true);
    api
      .get('/products', { params: { search: debouncedSearch, category, sort } })
      .then(({ data }) => setProducts(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [debouncedSearch, category, sort]);

  return (
    <section>
      <div className="hero">
        <h1>Everything you need, in one sphere.</h1>
        <p className="muted">Electronics, fashion, books and more — delivered across India.</p>
      </div>

      <div className="filters">
        <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <p className="muted">No products found.</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
