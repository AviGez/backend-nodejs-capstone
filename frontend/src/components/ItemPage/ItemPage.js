import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from "../../config";
import { useAppContext } from '../../context/AppContext';
import './ItemPage.css';

const MAX_IMAGES = 5;
const CATEGORY_OPTIONS = [
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
const cityOptions = [
    'Jerusalem',
    'Tel Aviv-Yafo',
    'Haifa',
    'Rishon LeZion',
    'Petah Tikva',
    'Ashdod',
    'Netanya',
    'Beer Sheva',
    'Holon',
    'Bnei Brak',
    'Rehovot',
    'Bat Yam',
    'Herzliya',
    'Kfar Saba',
    'Raanana',
    'Ramat Gan',
    'Modiin',
    'Hadera',
    'Ashkelon',
    'Nazareth',
    'Tiberias',
    'Eilat',
    'Safed',
    'Kiryat Ono',
    'Givatayim'
];
// קומפוננטת עמוד הוספת פריט חדש
function ItemPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
    const [condition, setCondition] = useState('New');
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [price, setPrice] = useState(0);
    const [message, setMessage] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const [imageTip, setImageTip] = useState('Upload at least 2 clear photos to boost trust.');
    const [enableShipping, setEnableShipping] = useState(false);
    const [pickupAddress, setPickupAddress] = useState('');
    const [pickupCity, setPickupCity] = useState('');
    const [pickupArea, setPickupArea] = useState('');
    const [shippingBasePrice, setShippingBasePrice] = useState(10);
    const [shippingPricePerKm, setShippingPricePerKm] = useState(2);
    const { isLoggedIn } = useAppContext();

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/app/login');
        }
    }, [isLoggedIn, navigate]);
// טיפול בשינוי קבצי תמונות שנבחרו
    const handleImageChange = (event) => {
        const incoming = Array.from(event.target.files || []);
        if (!incoming.length) {
            return;
        }
        setSelectedImages((prev) => {
            const merged = [...prev];
            const seen = new Set(prev.map((file) => `${file.name}-${file.lastModified}`));
            incoming.forEach((file) => {
                const key = `${file.name}-${file.lastModified}`;
                if (merged.length < MAX_IMAGES && !seen.has(key)) {
                    merged.push(file);
                    seen.add(key);
                }
            });
            const count = merged.length;
            if (!count) {
                setImageTip('Upload at least 2 clear photos to boost trust.');
            } else if (count === 1) {
                setImageTip('Tip: add another photo so buyers can see more angles.');
            } else if (count >= MAX_IMAGES) {
                setImageTip(`Showing the best ${MAX_IMAGES} photos.`);
            } else {
                setImageTip(`${count} photos selected.`);
            }
            return merged;
        });
        event.target.value = '';
    };
// טיפול בהוספת פריט חדש
    const handleAddItem = async () => {
      const authToken = sessionStorage.getItem('auth-token');
      if (!authToken) {
        navigate('/app/login');
        return;
      }

      if (!selectedImages.length) {
        setMessage('Please upload at least one image.');
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      const formData = new FormData();
      selectedImages.slice(0, MAX_IMAGES).forEach((file, index) => {
        formData.append('images', file);
        if (index === 0) {
          formData.append('image', `/images/${file.name}`);
        }
      });
      formData.append('name', name);
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('zipcode', '');
      formData.append('age_days', 0);
      formData.append('age_years', 0);
      formData.append('description', description);
      formData.append('comments', []);
      formData.append('city', city);
      formData.append('area', area);
      formData.append('mapUrl', '');
      formData.append('price', price);
      formData.append('enableShipping', enableShipping);
      formData.append('pickupAddress', pickupAddress);
      formData.append('pickupCity', pickupCity);
      formData.append('pickupArea', pickupArea);
      formData.append('shippingBasePrice', shippingBasePrice);
      formData.append('shippingPricePerKm', shippingPricePerKm);

          try {
            let url = `${urlConfig.backendUrl}/api/secondchance/items`;
            console.log(url);
              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });
    
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              const data = await response.json();
              if (data) {
                setMessage("Item added!");
                setSelectedImages([]);
                setImageTip('Upload at least 2 clear photos to boost trust.');
                setTimeout(() => {
                    setMessage("");
                    navigate("/");
                }, 500);
              }
          } catch (error) {
            setMessage(error.message);
          }
  }

    return (
      <div className="add-item-page">
        <section className="add-item-hero">
          <div>
            <p className="eyebrow">Share your find</p>
            <h1>Add a new item</h1>
            <p>Give it a short description, set a fair price (0 for free) and help it find a new home.</p>
          </div>
        </section>

      <div className="add-item-form">
        <div className="add-item-sections">
          <div className="form-column">
            <div className="column-grid">
              <div className="form-group">
                <label htmlFor="name">Item name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter item name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="condition">Condition</label>
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Older">Older</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="price">Price (0 = Free)</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  list="city-options"
                  placeholder="Select or type a city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <datalist id="city-options">
                  {cityOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label htmlFor="area">Area / neighborhood</label>
                <input
                  id="area"
                  type="text"
                  placeholder="Optional area or neighborhood"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>
              <div className="form-group form-full">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  rows="4"
                  placeholder="Tell buyers about the item"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="form-group form-full">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={enableShipping}
                    onChange={(e) => setEnableShipping(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span>Enable shipping (delivery available)</span>
                </label>
              </div>
              {enableShipping && (
                <>
                  <div className="form-group form-full">
                    <label htmlFor="pickupAddress">Pickup Address (Full address)</label>
                    <input
                      id="pickupAddress"
                      type="text"
                      placeholder="Enter full pickup address"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pickupCity">Pickup City</label>
                    <input
                      id="pickupCity"
                      type="text"
                      list="pickup-city-options"
                      placeholder="Pickup city"
                      value={pickupCity}
                      onChange={(e) => setPickupCity(e.target.value)}
                    />
                    <datalist id="pickup-city-options">
                      {cityOptions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label htmlFor="pickupArea">Pickup Area / Neighborhood</label>
                    <input
                      id="pickupArea"
                      type="text"
                      placeholder="Pickup area"
                      value={pickupArea}
                      onChange={(e) => setPickupArea(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="shippingBasePrice">Base Shipping Price ($)</label>
                    <input
                      id="shippingBasePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Base price"
                      value={shippingBasePrice}
                      onChange={(e) => setShippingBasePrice(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="shippingPricePerKm">Price Per Kilometer ($)</label>
                    <input
                      id="shippingPricePerKm"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price per km"
                      value={shippingPricePerKm}
                      onChange={(e) => setShippingPricePerKm(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="form-column form-column-secondary">
            <h3>Photos</h3>
            <p>Add up to 5 clear photos. Show different angles so buyers can trust you.</p>
            <label className="form-label" htmlFor="images">Upload photos</label>
            <input
              type="file"
              id="images"
              multiple
              accept=".jpg, .jpeg, .png, .gif"
              onChange={handleImageChange}
            />
            {imageTip && <small className="image-tip">{imageTip}</small>}
            {selectedImages.length > 0 && (
              <ul className="image-preview-list">
                {selectedImages.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

          <div className="form-actions">
            <button type="button" onClick={handleAddItem}>
              Publish item
            </button>
            {message && <span className="form-message">{message}</span>}
          </div>
        </div>
      </div>
    );
}

export default ItemPage;
