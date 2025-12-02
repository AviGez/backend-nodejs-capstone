import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {urlConfig} from '../../config';
import { useAppContext } from '../../context/AppContext';
import RatingStars from '../RatingStars/RatingStars';
import NewArrivalsCarousel from '../NewArrivalsCarousel/NewArrivalsCarousel';
import { getStripe } from '../../utils/stripeClient';

function MainPage() {
    const [items, setItems] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [sortOption, setSortOption] = useState('');
    const [buyingItemId, setBuyingItemId] = useState(null);
    const [personalItems, setPersonalItems] = useState([]);
    const [personalError, setPersonalError] = useState('');
    const [trendingItems, setTrendingItems] = useState([]);
    const [trendingError, setTrendingError] = useState('');
    const navigate = useNavigate();
    const { isLoggedIn } = useAppContext();

    const fetchItems = useCallback(async () => {
        try {
            let url = `${urlConfig.backendUrl}/api/secondchance/items`;
            const params = new URLSearchParams();
            if (sortOption) {
                params.append('sort', sortOption);
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error; ${response.status}`);
            }
            const data = await response.json();
            setItems(data);
        } catch (error) {
            setErrorMessage(error.message);
        }
    }, [sortOption]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const fetchPersonalRecommendations = useCallback(async () => {
        if (!isLoggedIn) {
            setPersonalItems([]);
            setPersonalError('');
            return;
        }
        const token = sessionStorage.getItem('auth-token');
        if (!token) {
            setPersonalItems([]);
            return;
        }
        try {
            const response = await fetch(`${urlConfig.backendUrl}/api/recommendations/personal`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Unable to load personal picks');
            }
            setPersonalItems(await response.json());
            setPersonalError('');
        } catch (err) {
            setPersonalError(err.message);
            setPersonalItems([]);
        }
    }, [isLoggedIn]);

    const fetchTrending = useCallback(async () => {
        try {
            const response = await fetch(`${urlConfig.backendUrl}/api/recommendations/trending`);
            if (!response.ok) {
                throw new Error('Unable to load trending items');
            }
            setTrendingItems(await response.json());
            setTrendingError('');
        } catch (err) {
            setTrendingError(err.message);
            setTrendingItems([]);
        }
    }, []);

    useEffect(() => {
        fetchTrending();
    }, [fetchTrending]);

    useEffect(() => {
        fetchPersonalRecommendations();
    }, [fetchPersonalRecommendations]);

    const recordInteraction = async (itemId, action = 'click') => {
        try {
            const token = sessionStorage.getItem('auth-token');
            if (!token || !itemId) {
                return;
            }
            await fetch(`${urlConfig.backendUrl}/api/recommendations/record`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ itemId, action }),
            });
        } catch (error) {
            // ignore
        }
    };

    const goToDetailsPage = (itemId) => {
        recordInteraction(itemId, 'click');
        navigate(`/app/item/${itemId}`);
    };

    const handleAddItem = () => {
        navigate(`/app/addItem`);
    };

    const handleReserve = async (itemId) => {
        if (!isLoggedIn) {
            navigate('/app/login');
            return;
        }

        const token = sessionStorage.getItem('auth-token');
        try {
            const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/${itemId}/reserve`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorJson = await response.json().catch(() => ({}));
                throw new Error(errorJson.error || 'Unable to reserve item');
            }

            const updatedItem = await response.json();
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
            setStatusMessage(`Reserved ${updatedItem.name} until ${new Date(updatedItem.reservedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            setErrorMessage('');
            setTimeout(() => setStatusMessage(''), 4000);
        } catch (error) {
            setErrorMessage(error.message);
            setTimeout(() => setErrorMessage(''), 4000);
        }
    };

    const handleBuy = async (item) => {
        if (!isLoggedIn) {
            navigate('/app/login');
            return;
        }
        if (!item?.price || Number(item.price) <= 0) {
            setErrorMessage('This item is free. Reserve it instead.');
            setTimeout(() => setErrorMessage(''), 4000);
            return;
        }
        setBuyingItemId(item.id);
        const token = sessionStorage.getItem('auth-token');
        try {
            const response = await fetch(`${urlConfig.backendUrl}/api/payments/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ itemId: item.id }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Unable to start checkout');
            }
            const data = await response.json();
            if (data.sessionId) {
                const stripe = await getStripe();
                if (stripe) {
                    const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
                    if (error) {
                        throw new Error(error.message);
                    }
                    return;
                }
            }
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
                return;
            }
            throw new Error('Unexpected Stripe response. Missing session URL.');
        } catch (err) {
            setErrorMessage(err.message);
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setBuyingItemId(null);
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getConditionClass = (condition) => {
        return condition === "New" ? "list-group-item-success" : "list-group-item-warning";
    };

    const renderStatus = (item) => {
        const status = item.status || 'available';
        if (status === 'reserved') {
            const reservedUntil = item.reservedUntil ? new Date(item.reservedUntil) : null;
            return (
                <div className="d-flex flex-column">
                    <span className="badge bg-warning text-dark mb-2">Reserved</span>
                    {reservedUntil && (
                        <small className="text-muted">Reserved until {reservedUntil.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    )}
                </div>
            );
        }
        if (status === 'sold') {
            return <span className="badge bg-secondary">Sold</span>;
        }
        return <span className="badge bg-success">Available</span>;
    };

    const renderPrice = (item) => {
        if (item.status === 'sold') {
            return <span className="badge bg-secondary">Sold</span>;
        }
        if (!item.price || Number(item.price) === 0) {
            return <span className="badge bg-info text-dark">Free</span>;
        }
        return <span className="badge bg-light text-dark">${Number(item.price).toFixed(2)}</span>;
    };

    return (
        <div className="page-shell">
            <div className="hero-panel">
                <h1>Give every item a second chance.</h1>
                <p>
                    Discover curated second-hand pieces with transparent histories, condition tags, and now real-time reservations.
                    Rate what you love, keep track of your finds, and help great items find new homes.
                </p>
                <div className="hero-actions">
                    <button className="btn-primary-modern" onClick={handleAddItem}>Post an Item</button>
                    <button className="btn-ghost-modern" onClick={() => navigate('/app/search')}>Explore catalog</button>
                </div>
            </div>
            <NewArrivalsCarousel />
            <div className="recommendation-section">
                <div className="recommendation-header">
                    <h2>For You</h2>
                    {personalError && <small className="text-danger">{personalError}</small>}
                </div>
                {isLoggedIn ? (
                    personalItems.length ? (
                        <div className="recommendation-cards">
                            {personalItems.map((item) => (
                                <div key={`personal-${item.id}`} className="recommendation-card">
                                    <div className="recommendation-card-image">
                                        {item.image ? (
                                            <img src={urlConfig.backendUrl + item.image} alt={item.name} />
                                        ) : (
                                            <div className="no-image-available">No Image</div>
                                        )}
                                    </div>
                                    <div className="recommendation-card-body">
                                        <h5>{item.name}</h5>
                                        <p className="text-muted mb-1">{item.category}</p>
                                        <strong>{item.price ? `$${Number(item.price).toFixed(2)}` : 'Free'}</strong>
                                        <button
                                            className="btn btn-modern-secondary btn-sm w-100 mt-2"
                                            onClick={() => goToDetailsPage(item.id)}
                                        >
                                            View item
                                        </button>
                                        <small className="text-muted">
                                            Because you like {item.category || 'similar finds'}
                                        </small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">Tell us what you like by exploring the catalog, and we’ll tailor picks for you.</p>
                    )
                ) : (
                    <p className="text-muted">Login to see personalized picks.</p>
                )}
            </div>
            <div className="recommendation-section">
                <div className="recommendation-header">
                    <h2>What's hot now</h2>
                    {trendingError && <small className="text-danger">{trendingError}</small>}
                </div>
                {trendingItems.length ? (
                    <div className="trending-strip">
                        {trendingItems.map((item) => (
                            <div key={`trend-${item.id}`} className="trending-card" onClick={() => goToDetailsPage(item.id)}>
                                <div className="trending-image">
                                    {item.image ? (
                                        <img src={urlConfig.backendUrl + item.image} alt={item.name} />
                                    ) : (
                                        <div className="no-image-available">No Image</div>
                                    )}
                                </div>
                                <div className="mt-2">
                                    <strong>{item.name}</strong>
                                    <p className="mb-0 text-muted">{item.category}</p>
                                    <small>🔥 {Math.max(item.ratingCount || 0, 1)} interested</small>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted">No trending items right now.</p>
                )}
            </div>
        <div className="container-fluid px-0">
            <div className="d-flex justify-content-between align-items-center mb-3">
                {isLoggedIn ? (
                    <button className="btn btn-outline-secondary" onClick={handleAddItem}>Add Item</button>
                ) : (
                    <div />
                )}
                <div className="d-flex align-items-center gap-2">
                    <label htmlFor="sortSelect" className="me-2 mb-0">Sort:</label>
                    <select
                        id="sortSelect"
                        className="form-select form-select-sm"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                    >
                        <option value="">Default</option>
                        <option value="rating_desc">Top Rated</option>
                    </select>
                    <button className="btn btn-link" onClick={fetchItems}>Refresh</button>
                </div>
            </div>
            {statusMessage && <div className="alert alert-success">{statusMessage}</div>}
            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
            <div className="row">
                {items.map((item) => (
                    <div key={item.id} className="col-md-4 mb-4">
                        <div className="card product-card h-100 d-flex flex-column">
                            <div className="image-placeholder">
                                {item.image ? (
                                    <img src={urlConfig.backendUrl+item.image} alt={item.name} />
                                ) : (
                                    <div className="no-image-available">No Image Available</div>
                                )}
                            </div>
                            <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                                    <h5 className="card-title mb-0">{item.name}</h5>
                                    {renderStatus(item)}
                                </div>
                                <RatingStars
                                    value={item.averageRating || 0}
                                    count={item.ratingCount || 0}
                                    readOnly
                                    size="sm"
                                />
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <p className={`card-text ${getConditionClass(item.condition)}`}>
                                    {item.condition}
                                    </p>
                                    {renderPrice(item)}
                                </div>
                                <p className="card-text date-added">
                                    {formatDate(item.date_added)}
                                </p>
                                {(item.city || item.area) && (
                                    <p className="card-text">
                                        <strong>Location:</strong> {item.city || 'Unknown city'}, {item.area || 'Area not specified'}
                                    </p>
                                )}
                            </div>
                            <div className="card-footer bg-white border-0">
                                <button onClick={() => goToDetailsPage(item.id)} className="btn btn-primary w-100 mb-2">
                                    View Details
                                </button>
                                {(item.status || 'available') === 'available' && Number(item.price || 0) === 0 && (
                                    <button
                                        onClick={() => handleReserve(item.id)}
                                        className="btn btn-outline-success w-100"
                                    >
                                        Reserve for 10 hours
                                    </button>
                                )}
                                {(item.status || 'available') === 'available' && Number(item.price || 0) > 0 && (
                                    <button
                                        onClick={() => handleBuy(item)}
                                        className="btn btn-modern-secondary w-100"
                                        disabled={buyingItemId === item.id}
                                    >
                                        {buyingItemId === item.id ? 'Redirecting…' : 'Buy now'}
                                    </button>
                                )}
                                {(item.status) === 'reserved' && (
                                    <small className="text-muted">Reserved until {item.reservedUntil ? new Date(item.reservedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                                )}
                                {item.mapUrl && (
                                    <a href={item.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-link w-100">
                                        Open in Maps
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </div>
    );
}

export default MainPage;
