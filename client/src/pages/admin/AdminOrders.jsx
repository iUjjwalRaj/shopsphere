import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { formatINR } from '../../utils/format.js';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);

  const load = () => {
    api.get('/orders').then(({ data }) => setOrders(data));
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { status });
    load();
  };

  return (
    <section>
      <div className="row-between">
        <h1>Admin · Orders</h1>
        <Link to="/admin/products" className="btn btn-ghost">← Products</Link>
      </div>

      {stats && (
        <div
          className="admin-stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            margin: '20px 0 28px',
          }}
        >
          <div className="card" style={{ padding: '20px' }}>
            <span className="muted" style={{ fontSize: '0.85rem' }}>Total Revenue</span>
            <h2 style={{ margin: '8px 0 0', color: 'var(--primary)' }}>
              {formatINR(stats.totalRevenue)}
            </h2>
            <span className="muted" style={{ fontSize: '0.75rem' }}>Delivered orders</span>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <span className="muted" style={{ fontSize: '0.85rem' }}>Orders Today</span>
            <h2 style={{ margin: '8px 0 0' }}>{stats.ordersToday}</h2>
            <span className="muted" style={{ fontSize: '0.75rem' }}>Placed since midnight</span>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <span className="muted" style={{ fontSize: '0.85rem' }}>Pending Orders</span>
            <h2 style={{ margin: '8px 0 0', color: stats.pendingOrders > 0 ? 'var(--danger)' : 'var(--text)' }}>
              {stats.pendingOrders}
            </h2>
            <span className="muted" style={{ fontSize: '0.75rem' }}>Requires processing</span>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <span className="muted" style={{ fontSize: '0.85rem' }}>Low-Stock Products</span>
            <h2 style={{ margin: '8px 0 0', color: stats.lowStockProducts > 0 ? 'var(--danger)' : 'var(--text)' }}>
              {stats.lowStockProducts}
            </h2>
            <span className="muted" style={{ fontSize: '0.75rem' }}>Stock &lt; 5 units</span>
          </div>
        </div>
      )}
      <table className="table">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>#{o._id.slice(-6).toUpperCase()}</td>
              <td>{o.user?.name}<br /><span className="muted">{o.user?.email}</span></td>
              <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
              <td>{formatINR(o.totalAmount)}</td>
              <td>
                <select value={o.status} onChange={(e) => changeStatus(o._id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
