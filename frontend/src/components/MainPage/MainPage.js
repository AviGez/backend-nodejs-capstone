import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {urlConfig} from '../../config';
import { useAppContext } from '../../context/AppContext';
import NewArrivalsCarousel from '../NewArrivalsCarousel/NewArrivalsCarousel';

const categoryOptions = [
    'Furniture',
    'Tools',
    'Electronics',
    'Clothing & Accessories',
    'Toys',
    'Vehicles & Transportation',
    'Books & Media',
    'Pets & Pet Supplies',
    'Other',
];

const conditionOptions = ['New', 'Like New', 'Older'];
// קומפוננטת עמוד ראשי
function MainPage() {
    const [items, setItems] = useState([]);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedCondition, setSelectedCondition] = useState('');
    const [selectedPrice, setSelectedPrice] = useState('');
    const [ageRange, setAgeRange] = useState(6);
    const [searchCity, setSearchCity] = useState('');
    const [searchArea, setSearchArea] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [reservedItems, setReservedItems] = useState(new Set());
    const [showSearchModal, setShowSearchModal] = useState(false);
    const navigate = useNavigate();
    const { isLoggedIn } = useAppContext();
    const searchSectionRef = useRef(null);

    const filterAvailableItems = useCallback(
        (list = []) => list.filter((item) => (item.status || 'available') === 'available'),
        []
    );
// פונקציה לטעינת פריטי עמוד ראשי
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
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);
// טיפול בחיפוש מתקדם של פריטים
    const handleSearch = async () => {
        setSearchLoading(true);
        setSearchError('');
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('name', searchQuery.trim());
            if (selectedCategory) params.append('category', selectedCategory);
            if (selectedCondition) params.append('condition', selectedCondition);
            if (selectedPrice) {
                if (selectedPrice === 'free') params.append('price', 'free');
                else params.append('price_max', selectedPrice);
            }
            if (searchCity.trim()) params.append('city', searchCity.trim());
            if (searchArea.trim()) params.append('area', searchArea.trim());

            const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/search?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Search failed');
            }
            const data = await response.json();
            setItems(filterAvailableItems(data));
            setSearchError('');
            setShowSearchModal(false); // Close modal after successful search
        } catch (error) {
            setSearchError(error.message || 'Unable to search items right now.');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedCondition('');
        setSelectedPrice('');
        setSearchCity('');
        setSearchArea('');
        setSearchError('');
        fetchItems();
        setShowSearchModal(false); // Close modal after reset
    };

    const scrollToSearch = () => {
        setShowSearchModal(true);
    };

    const goToDetailsPage = (itemId) => {
        navigate(`/app/item/${itemId}`);
    };

    const handleAddItem = () => {
        navigate(`/app/addItem`);
    };
// טיפול בהזמנת פריט
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
            setReservedItems((prev) => new Set([...prev, itemId]));
            setStatusMessage(`Reserved ${updatedItem.name} until ${new Date(updatedItem.reservedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            setErrorMessage('');
            setTimeout(() => setStatusMessage(''), 4000);
        } catch (error) {
            setErrorMessage(error.message);
            setTimeout(() => setErrorMessage(''), 4000);
        }
    };
// פונקציה לעיצוב תאריך
    const formatDate = (timestamp) => {
        if (!timestamp) {
            return 'Unknown date';
        }
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        });
    };

    const getConditionClass = (condition) => {
        return condition === "New" ? "list-group-item-success" : "list-group-item-warning";
    };
// רינדור סטטוס פריט
    const renderStatus = (item) => {
        const status = item.status || 'available';
        if (status === 'sold') {
            return <span className="badge bg-secondary">Sold</span>;
        }
        if (status === 'reserved') {
            return <span className="badge bg-warning text-dark">Reserved</span>;
        }
        return <span className="badge bg-success">Available</span>;
    };
// רינדור מחיר פריט
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
                    Keep track of your finds, and help great items find new homes.
                </p>
                <div className="hero-actions">
                    <button className="btn-primary-modern" onClick={handleAddItem}>Post an Item</button>
                    <button className="btn-secondary-modern" onClick={scrollToSearch}>Advanced search</button>
                </div>
            </div>
            <NewArrivalsCarousel />
            {showSearchModal && (
                <div className="search-modal-overlay" onClick={() => setShowSearchModal(false)}>
                    <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="search-modal-close" onClick={() => setShowSearchModal(false)}>×</button>
            <section className="search-panel glass-panel mb-0" ref={searchSectionRef}>
                <div className="search-panel-header">
                    <div>
                        <h2 className="mb-1">Find exactly what you need</h2>
                        <p className="text-muted mb-0">Filter by category, condition, or location.</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-modern-secondary"
                            onClick={handleResetFilters}
                            disabled={searchLoading}
                        >
                            Reset
                        </button>
                        <button
                            className="btn btn-primary-modern"
                            onClick={handleSearch}
                            disabled={searchLoading}
                        >
                            {searchLoading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </div>
                {searchError && <div className="alert alert-danger mb-3">{searchError}</div>}
                <div className="search-grid">
                    <div className="form-group">
                        <label htmlFor="searchQuery">Item name</label>
                        <input
                            id="searchQuery"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by item name..."
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="categorySelect">Category</label>
                        <select
                            id="categorySelect"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">All categories</option>
                            {categoryOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="conditionSelect">Condition</label>
                        <select
                            id="conditionSelect"
                            value={selectedCondition}
                            onChange={(e) => setSelectedCondition(e.target.value)}
                        >
                            <option value="">All conditions</option>
                            {conditionOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="priceSelect">Price</label>
                        <select
                            id="priceSelect"
                            value={selectedPrice}
                            onChange={(e) => setSelectedPrice(e.target.value)}
                        >
                            <option value="">Any</option>
                            <option value="free">Free</option>
                            <option value="50">Up to $50</option>
                            <option value="100">Up to $100</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="searchCity">City</label>
                        <input
                            id="searchCity"
                            type="text"
                            value={searchCity}
                            onChange={(e) => setSearchCity(e.target.value)}
                            placeholder="Enter city name..."
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="searchArea">Area / neighborhood</label>
                        <input
                            id="searchArea"
                            type="text"
                            value={searchArea}
                            onChange={(e) => setSearchArea(e.target.value)}
                            placeholder="Optional: neighborhood or area"
                        />
                    </div>
                </div>
            </section>
                    </div>
                </div>
            )}
            <div className="recommendation-section">
                <div className="recommendation-header">
                    <h2>Featured picks</h2>
                    <p className="text-muted mb-0">Browse what’s new and interesting right now.</p>
                </div>
            </div>
        <div className="container-fluid px-0">
            {statusMessage && <div className="alert alert-success">{statusMessage}</div>}
            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
            <div className="row g-3">
                {items.map((item) => (
                    <div key={item.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
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
                            <div className="card-footer border-0">
                                <button onClick={() => goToDetailsPage(item.id)} className="btn btn-primary-modern w-100 mb-2">
                                    View Details
                                </button>
                                {(item.status || 'available') === 'available' && Number(item.price || 0) === 0 && (
                                    <button
                                        onClick={() => handleReserve(item.id)}
                                        className="btn btn-ghost-modern w-100"
                                    >
                                        Reserve for 10 hours
                                    </button>
                                )}
                                {(item.status || 'available') === 'available' && Number(item.price || 0) > 0 && (
                                    <small className="text-subtle d-block text-center">
                                        Message the seller to arrange payment.
                                    </small>
                                )}
                                {(item.status) === 'reserved' && (
                                    <div className="alert alert-success mb-0 py-2 text-center fw-bold" style={{fontSize: '0.9rem'}}>
                                        Reserved until {item.reservedUntil ? new Date(item.reservedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </div>
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
