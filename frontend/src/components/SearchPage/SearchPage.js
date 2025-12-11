import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import {urlConfig} from '../../config';

const filterAvailableItems = (list = []) =>
    list.filter((item) => (item.status || 'available') === 'available');
// קומפוננטת עמוד חיפוש פריטים
function SearchPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [ageRange, setAgeRange] = useState(6); // Initialize with minimum value
    const [searchResults, setSearchResults] = useState([]);
    const [searchCity, setSearchCity] = useState('');
    const [searchArea, setSearchArea] = useState('');
           const categories = [
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
    const conditions = ['New', 'Like New', 'Older'];
// פונקציה לטעינת כל הפריטים הזמינים מהשרת בעת טעינת הקומפוננטה
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
                setSearchResults(filterAvailableItems(data));
            } catch (error) {
                console.log('Fetch error: ' + error.message);
            }
        };

        fetchProducts();
    }, []);

// פונקציה לטיפול בחיפוש פריטים עם סינון
    const handleSearch = async () => {
        // Construct the search URL based on user input
        const baseUrl = `${urlConfig.backendUrl}/api/secondchance/search?`;
        const params = new URLSearchParams({
            name: searchQuery,
            age_years: ageRange,
            category: document.getElementById('categorySelect').value,
            condition: document.getElementById('conditionSelect').value,
        });
        if (searchCity.trim()) {
            params.append('city', searchCity.trim());
        }
        if (searchArea.trim()) {
            params.append('area', searchArea.trim());
        }
        const queryParams = params.toString();

        try {
            const response = await fetch(`${baseUrl}${queryParams}`);
            if (!response.ok) {
                throw new Error('Search failed');
            }
            const data = await response.json();
            setSearchResults(filterAvailableItems(data));
        } catch (error) {
            console.error('Failed to fetch search results:', error);
        }
    };

    const navigate = useNavigate();

    const goToDetailsPage = (productId) => {
        navigate(`/app/item/${productId}`);
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
                    <div className="row g-2 mb-2">
                        <div className="col-md-6">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="City"
                                value={searchCity}
                                onChange={(e) => setSearchCity(e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Area / neighborhood"
                                value={searchArea}
                                onChange={(e) => setSearchArea(e.target.value)}
                            />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleSearch}>Search</button>
                    <div className="search-results mt-4">
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
                                            <small className="text-muted text-center d-block">
                                                Contact the seller to arrange pickup and payment.
                                            </small>
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
