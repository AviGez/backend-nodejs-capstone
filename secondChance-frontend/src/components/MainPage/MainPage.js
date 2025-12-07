import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {urlConfig} from '../../config';
import { useAppContext } from '../../context/AppContext';
import NewArrivalsCarousel from '../NewArrivalsCarousel/NewArrivalsCarousel';

function MainPage() {
    const [items, setItems] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const { isLoggedIn } = useAppContext();

    const filterAvailableItems = useCallback(
        (list = []) => list.filter((item) => (item.status || 'available') === 'available'),
        []
    );

    const fetchItems = useCallback(async () => {
        try {
            const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items`);
            if (!response.ok) {
                throw new Error(`HTTP error; ${response.status}`);
            }
            const data = await response.json();
            setItems(filterAvailableItems(data));
        } catch (error) {
            setErrorMessage(error.message);
        }
    }, [filterAvailableItems]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const goToDetailsPage = (itemId) => {
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
                filterAvailableItems(prevItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
            );
            setStatusMessage(`Reserved ${updatedItem.name} until ${new Date(updatedItem.reservedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            setErrorMessage('');
            setTimeout(() => setStatusMessage(''), 4000);
        } catch (error) {
            setErrorMessage(error.message);
            setTimeout(() => setErrorMessage(''), 4000);
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
                    <h2>Featured picks</h2>
                    <p className="text-muted mb-0">Browse what’s new and interesting right now.</p>
                </div>
            </div>
        <div className="container-fluid px-0">
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
                                    <small className="text-muted d-block text-center">
                                        Message the seller to arrange payment.
                                    </small>
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
