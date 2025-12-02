import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import { useAppContext } from '../../context/AppContext';
import './MyReservations.css';

const MAX_ROUTE_ITEMS = 5;

const MyReservations = () => {
  const { isLoggedIn } = useAppContext();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [routeResult, setRouteResult] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/app/login');
      return;
    }
    fetchReservations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

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
      setSelectedItems({});
      setRouteResult(null);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatReservedUntil = (reservedUntil) => {
    if (!reservedUntil) return '';
    const date = new Date(reservedUntil);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const selectedIds = Object.keys(selectedItems).filter((id) => selectedItems[id]);
  const selectedCount = selectedIds.length;

  const toggleItemSelection = (itemId) => {
    setRouteError('');
    setRouteResult(null);
    setSelectedItems((prev) => {
      const isSelected = !!prev[itemId];
      if (!isSelected) {
        const currentCount = Object.values(prev).filter(Boolean).length;
        if (currentCount >= MAX_ROUTE_ITEMS) {
          setRouteError(`Select up to ${MAX_ROUTE_ITEMS} items for a single route.`);
          return prev;
        }
      }
      return {
        ...prev,
        [itemId]: !isSelected,
      };
    });
  };

  const handleUseMyLocation = () => {
    setRouteError('');
    if (!navigator.geolocation) {
      setRouteError('Geolocation is not supported in this browser. Please enter coordinates manually.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStartLat(position.coords.latitude.toFixed(6));
        setStartLng(position.coords.longitude.toFixed(6));
      },
      () => {
        setRouteError('Unable to fetch your location. Please enter the coordinates manually.');
      }
    );
  };

  const handlePlanRoute = async () => {
    setRouteError('');
    setRouteResult(null);
    if (!selectedIds.length) {
      setRouteError('Select at least one item to plan a pickup route.');
      return;
    }
    const latNum = Number(startLat);
    const lngNum = Number(startLng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setRouteError('Enter a valid starting latitude and longitude.');
      return;
    }
    setRouteLoading(true);
    try {
      const token = sessionStorage.getItem('auth-token');
      const response = await fetch(`${urlConfig.backendUrl}/api/routes/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          start: { lat: latNum, lng: lngNum },
          itemIds: selectedIds,
        }),
      });
      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Unable to plan route');
      }
      const data = await response.json();
      setRouteResult(data);
    } catch (err) {
      setRouteError(err.message);
    } finally {
      setRouteLoading(false);
    }
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
          <small className="text-muted d-block mb-1">
            Selected for pickup: {selectedCount}/{MAX_ROUTE_ITEMS}
          </small>
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
              <div className="route-select form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`route-select-${item.id}`}
                  checked={!!selectedItems[item.id]}
                  onChange={() => toggleItemSelection(item.id)}
                />
                <label className="form-check-label" htmlFor={`route-select-${item.id}`}>
                  Route
                </label>
              </div>
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

      {items.length > 0 && (
        <div className="route-planner-panel mt-4">
          <div className="d-flex justify-content-between flex-wrap gap-3 align-items-center">
            <div>
              <h3 className="mb-1">Pickup route planner</h3>
              <p className="text-muted mb-0">Choose up to {MAX_ROUTE_ITEMS} items and get the fastest pickup order.</p>
            </div>
          </div>
          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <label className="form-label text-muted">Starting latitude</label>
              <input
                type="number"
                step="0.000001"
                className="form-control"
                placeholder="e.g. 32.0853"
                value={startLat}
                onChange={(e) => setStartLat(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">Starting longitude</label>
              <input
                type="number"
                step="0.000001"
                className="form-control"
                placeholder="e.g. 34.7818"
                value={startLng}
                onChange={(e) => setStartLng(e.target.value)}
              />
            </div>
          </div>
          <div className="d-flex gap-3 flex-wrap mt-3">
            <button
              className="btn btn-primary"
              onClick={handlePlanRoute}
              disabled={routeLoading}
            >
              {routeLoading ? 'Calculating route...' : 'Plan pickup route'}
            </button>
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={handleUseMyLocation}
            >
              Use my current location
            </button>
          </div>

          {routeError && <div className="alert alert-danger mt-3">{routeError}</div>}
          {routeLoading && !routeError && (
            <div className="alert alert-info mt-3">Crunching every possible route...</div>
          )}
          {routeResult && (
            <div className="route-results mt-4">
              <p className="text-muted mb-2">
                Total route distance:{' '}
                <strong>{Number(routeResult.totalDistanceKm || 0).toFixed(2)} km</strong>
              </p>
              <ul className="route-stop-list list-group">
                {routeResult.stops?.map((stop) => (
                  <li key={`${stop.type}-${stop.order}-${stop.itemId || 'start'}`} className="list-group-item route-stop">
                    <div className="route-stop-index">{stop.order}</div>
                    <div>
                      <div className="route-stop-title">
                        {stop.type === 'start' ? 'Start here' : `Pickup ${stop.name}`}
                      </div>
                      <div className="route-stop-meta text-muted">
                        {stop.type === 'start'
                          ? 'Your starting point'
                          : `${stop.city || 'Unknown city'}${stop.area ? ` • ${stop.area}` : ''}`}
                        {stop.distanceFromPreviousKm != null && stop.order > 1 && (
                          <span className="ms-2">
                            {Number(stop.distanceFromPreviousKm).toFixed(2)} km from previous stop
                          </span>
                        )}
                      </div>
                      {stop.type === 'item' && (
                        <div className="route-stop-coords text-muted">
                          ({stop.lat?.toFixed ? stop.lat.toFixed(4) : stop.lat},{' '}
                          {stop.lng?.toFixed ? stop.lng.toFixed(4) : stop.lng})
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {routeResult.googleMapsUrl && (
                <a
                  href={routeResult.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-modern-secondary mt-3"
                >
                  Open route in Google Maps
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyReservations;

