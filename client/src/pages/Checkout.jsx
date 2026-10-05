import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR } from '../utils/format.js';

const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

export const validatePincode = (code) => {
  const trimmed = (code || '').trim();
  if (!trimmed) {
    return 'Pincode is required';
  }
  if (!PINCODE_REGEX.test(trimmed)) {
    return 'Pincode must be exactly 6 digits and cannot start with 0';
  }
  return '';
};

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState(
    user?.address || { line1: '', city: '', state: '', pincode: '' }
  );
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [error, setError] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [placing, setPlacing] = useState(false);

  const update = (key) => (e) => setAddress((a) => ({ ...a, [key]: e.target.value }));

  const handlePincodeChange = (e) => {
    const val = e.target.value;
    setAddress((a) => ({ ...a, pincode: val }));
    if (pincodeError || val.trim().length > 6) {
      setPincodeError(validatePincode(val));
    }
  };

  const handlePincodeBlur = () => {
    if (address.pincode) {
      setPincodeError(validatePincode(address.pincode));
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    const pinErr = validatePincode(address.pincode);
    if (pinErr) {
      setPincodeError(pinErr);
      return;
    }

    setPlacing(true);
    setError('');
    try {
      const { data } = await api.post('/orders', {
        items: items.map(({ product, name, price, quantity }) => ({ product, name, price, quantity })),
        shippingAddress: {
          ...address,
          pincode: address.pincode.trim(),
        },
        paymentMethod,
      });
      clearCart();
      navigate('/orders', { state: { placed: data._id } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) return <p className="muted">Nothing to check out.</p>;

  return (
    <section className="checkout">
      <form className="card form" onSubmit={placeOrder}>
        <h1>Shipping details</h1>
        <input required placeholder="Address line" value={address.line1} onChange={update('line1')} />
        <input required placeholder="City" value={address.city} onChange={update('city')} />
        <input required placeholder="State" value={address.state} onChange={update('state')} />
        <input
          required
          placeholder="Pincode"
          value={address.pincode}
          onChange={handlePincodeChange}
          onBlur={handlePincodeBlur}
          className={pincodeError ? 'input-error' : ''}
        />
        {pincodeError && <p className="error field-error">{pincodeError}</p>}

        <label>Payment method</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="COD">Cash on delivery</option>
          <option value="ONLINE" disabled>Online payment (coming soon)</option>
        </select>

        {error && <p className="error">{error}</p>}
        <button className="btn full" disabled={placing}>
          {placing ? 'Placing order...' : `Place order · ${formatINR(totalPrice)}`}
        </button>
      </form>
    </section>
  );
}
