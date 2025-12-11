import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import { useAppContext } from '../../context/AppContext';
import './MyReservations.css';
// קומפוננטת עמוד ההזמנות שלי
const MyReservations = () => {
  const { isLoggedIn } = useAppContext();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/app/login');
      return;
    }
    fetchReservations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);
// פונקציה לטעינת ההזמנות מהשרת
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/reservations/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Failed to load reservations');
      }
      const data = await response.json();
      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
// פונקציה לעיצוב תאריך התפוגה של ההזמנה
  const formatReservedUntil = (reservedUntil) => {
    if (!reservedUntil) return '';
    const date = new Date(reservedUntil);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="container mt-5 my-reservations">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
        <div>
          <h2>My Reservations</h2>
          <p className="text-muted mb-0">Everything you've got on hold right now.</p>
        </div>
        <div className="text-end">
          <button className="btn btn-outline-primary" onClick={fetchReservations}>Refresh</button>
        </div>
      </div>

      {loading && <div className="alert alert-info">Loading reservations...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && items.length === 0 && !error && (
        <div className="alert alert-secondary">You have no active reservations.</div>
      )}

      <div className="row">
        {items.map((item) => (
          <div key={item.id} className="col-md-4 mb-4">
            <div className="card shadow-sm h-100 reservation-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title mb-0">{item.name}</h5>
                  <span className="badge bg-warning text-dark">Reserved</span>
                </div>
                <p className="card-text">{item.description ? item.description.slice(0, 100) : 'No description provided'}</p>
                <p className="text-muted mb-1"><strong>Category:</strong> {item.category}</p>
                <p className="text-muted mb-1"><strong>Condition:</strong> {item.condition}</p>
                {(item.city || item.area) && (
                  <p className="text-muted mb-1">
                    <strong>Location:</strong> {item.city || 'Unknown city'}, {item.area || 'Area not specified'}
                  </p>
                )}
              </div>
              <div className="card-footer bg-white">
                <small className="text-muted d-block">
                  Reserved until {formatReservedUntil(item.reservedUntil)}
                </small>
                {item.mapUrl && (
                  <div>
                    <a href={item.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-link p-0">
                      Open in Maps
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyReservations;

