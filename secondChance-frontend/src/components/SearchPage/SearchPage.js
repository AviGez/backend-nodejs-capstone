import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import {urlConfig} from '../../config';
import { useAppContext } from '../../context/AppContext';
import { getStripe } from '../../utils/stripeClient';

function SearchPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [ageRange, setAgeRange] = useState(6); // Initialize with minimum value
    const [searchResults, setSearchResults] = useState([]);
    const [buyingId, setBuyingId] = useState(null);
    const [paymentError, setPaymentError] = useState('');
    const categories = ['Living', 'Bedroom', 'Bathroom', 'Kitchen', 'Office'];
    const conditions = ['New', 'Like New', 'Older'];
    const { isLoggedIn } = useAppContext();

    useEffect(() => {
        // fetch all products
        const fetchProducts = async () => {
            try {
                let url = `${urlConfig.backendUrl}/api/secondchance/items`
                console.log(url)
                const response = await fetch(url);
                if (!response.ok) {
                    //something went wrong
                    throw new Error(`HTTP error; ${response.status}`)
                }
                const data = await response.json();
                setSearchResults(data);
            } catch (error) {
                console.log('Fetch error: ' + error.message);
            }
        };

        fetchProducts();
    }, []);


    const handleSearch = async () => {
        // Construct the search URL based on user input
        const baseUrl = `${urlConfig.backendUrl}/api/secondchance/search?`;
        const queryParams = new URLSearchParams({
            name: searchQuery,
            age_years: ageRange,
            category: document.getElementById('categorySelect').value,
            condition: document.getElementById('conditionSelect').value,
        }).toString();

        try {
            const response = await fetch(`${baseUrl}${queryParams}`);
            if (!response.ok) {
                throw new Error('Search failed');
            }
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Failed to fetch search results:', error);
        }
    };

    const navigate = useNavigate();

    const goToDetailsPage = (productId) => {
        navigate(`/app/item/${productId}`);
    };

    const handleBuy = async (product) => {
        if (!isLoggedIn) {
            navigate('/app/login');
            return;
        }
        if (!product || Number(product.price || 0) <= 0) {
            return;
        }
        setPaymentError('');
        setBuyingId(product.id);
        const token = sessionStorage.getItem('auth-token');
        try {
            const response = await fetch(`${urlConfig.backendUrl}/api/payments/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ itemId: product.id }),
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
        } catch (e) {
            setPaymentError(e.message);
            setTimeout(() => setPaymentError(''), 5000);
        } finally {
            setBuyingId(null);
        }
    };




    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="filter-section mb-3 p-3 border rounded">
                        <h5>Filters</h5>
                        <div className="d-flex flex-column">
                            {/* Category Dropdown */}
                            <label htmlFor="categorySelect">Category</label>
                            <select id="categorySelect" className="form-control my-1">
                                <option value="">All</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>

                            {/* Condition Dropdown */}
                            <label htmlFor="conditionSelect">Condition</label>
                            <select id="conditionSelect" className="form-control my-1">
                                <option value="">All</option>
                                {conditions.map(condition => (
                                    <option key={condition} value={condition}>{condition}</option>
                                ))}
                            </select>

                            {/* Age Range Slider */}
                            <label htmlFor="ageRange">Less than {ageRange} years</label>
                            <input
                                type="range"
                                className="form-control-range"
                                id="ageRange"
                                min="1"
                                max="10"
                                value={ageRange}
                                onChange={e => setAgeRange(e.target.value)}
                            />
                        </div>
                    </div>

                    <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Search for items..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>Search</button>
                    <div className="search-results mt-4">
                        {paymentError && (
                            <div className="alert alert-danger">{paymentError}</div>
                        )}
                        {searchResults.length > 0 ? (
                            searchResults.map(product => (
                                <div key={product.id} className="card mb-3">
                                    {/* Check if product has an image and display it */}
                                    <img src={urlConfig.backendUrl+product.image} alt={product.name} className="card-img-top" />
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h5 className="card-title">{product.name}</h5>
                                            <span className={`badge ${product.status === 'sold' ? 'bg-secondary' : 'bg-success'}`}>
                                                {product.status || 'available'}
                                            </span>
                                        </div>
                                        <p className="card-text">{product.description ? `${product.description.slice(0, 100)}...` : 'No description provided'}</p>
                                        <small className="text-highlight">
                                            {product.status === 'sold'
                                                ? 'Sold'
                                                : product.price && Number(product.price) > 0
                                                    ? `$${Number(product.price).toFixed(2)}`
                                                    : 'Free'}
                                        </small>
                                    </div>
                                    <div className="card-footer d-flex flex-column gap-2">
                                        <button onClick={() => goToDetailsPage(product.id)} className="btn btn-primary">
                                            View More
                                        </button>
                                        {(product.status || 'available') === 'available' && Number(product.price || 0) > 0 && (
                                            <button
                                                className="btn btn-modern-secondary"
                                                onClick={() => handleBuy(product)}
                                                disabled={buyingId === product.id}
                                            >
                                                {buyingId === product.id ? 'Redirecting…' : 'Buy now'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="alert alert-info" role="alert">
                                No products found. Please revise your filters.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SearchPage;
