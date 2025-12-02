import React, { useEffect, useState } from 'react';
import {useNavigate } from 'react-router-dom';
import { urlConfig } from "../../config"
import { useAppContext } from '../../context/AppContext';

function ItemPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Living');
    const [condition, setCondition] = useState('New');
    const [zipcode, setZipcode] = useState('10110');
    const [age_days, setAge_days] = useState(0);
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [area, setArea] = useState('');
    const [mapUrl, setMapUrl] = useState('');
    const [price, setPrice] = useState(0);
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [pickupLocations, setPickupLocations] = useState([
        { label: '', city: '', area: '', address: '', lat: '', lng: '' },
    ]);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [message, setMessage] = useState(null);
    const { isLoggedIn } = useAppContext();

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/app/login')
        }
    });

    const handleAddItem = async () => {
      const authToken = sessionStorage.getItem('auth-token');
      if (!authToken) {
        navigate('/app/login');
        return;
      }

      // Get the form data
      const formData = new FormData();
      const file = document.getElementById('file').files[0];
      if (file) {
        formData.append('file', file);
        formData.append('image', `/images/${file.name}`);
      }
      formData.append('name', document.getElementById('name').value);
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('zipcode', document.getElementById('zipcode').value);
      let age_days = document.getElementById('age_days').value;
      formData.append('age_days', age_days);
      formData.append('age_years', (age_days/365).toFixed(2));
      formData.append('description', document.getElementById('description').value);
      formData.append('comments', []);
      formData.append('city', city);
      formData.append('area', area);
      formData.append('mapUrl', mapUrl);
      if (lat !== '' && lat !== null && lat !== undefined) {
        formData.append('lat', lat);
      }
      if (lng !== '' && lng !== null && lng !== undefined) {
        formData.append('lng', lng);
      }
      formData.append('price', price);
      const cleanedPickupLocations = pickupLocations
          .map((loc) => ({
              label: loc.label.trim(),
              city: loc.city.trim(),
              area: loc.area.trim(),
              address: loc.address.trim(),
              lat: loc.lat,
              lng: loc.lng,
          }))
          .filter((loc) => loc.label && loc.city && loc.address)
          .slice(0, 3)
          .map((loc) => ({
              ...loc,
              lat: loc.lat ? Number(loc.lat) : undefined,
              lng: loc.lng ? Number(loc.lng) : undefined,
          }));
      if (cleanedPickupLocations.length) {
        formData.append('pickupLocations', JSON.stringify(cleanedPickupLocations));
      }

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
              if(data){
                setMessage("Item added!")
                setTimeout(() => {
                    setMessage("")
                    navigate("/");
                }, 500);
              }
          } catch (error) {
            setMessage(error.message);
          }
  }

    const handlePickupLocationChange = (index, field, value) => {
        setPickupLocations((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: value,
            };
            return updated;
        });
    };

    const addPickupLocation = () => {
        if (pickupLocations.length >= 3) {
            return;
        }
        setPickupLocations((prev) => [
            ...prev,
            { label: '', city: '', area: '', address: '', lat: '', lng: '' },
        ]);
    };

    const removePickupLocation = (index) => {
        setPickupLocations((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleGenerateDescription = async () => {
        if (!name?.trim()) {
            setMessage('Please provide a name before generating a description.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        setIsGeneratingDescription(true);
        try {
            const response = await fetch(`${urlConfig.backendUrl}/api/ai/describe-item`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: name,
                    category,
                    details: `Condition: ${condition}, Existing description: ${description || 'N/A'}`,
                }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to generate description');
            }
            const data = await response.json();
            if (data.description) {
                setDescription(data.description);
            }
        } catch (error) {
            console.error('AI description generation failed', error);
            setMessage(error.message || 'AI generation failed');
            setTimeout(() => setMessage(''), 4000);
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    return (
      <div className="container mt-5">
      <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
              <div className="register-card p-4 border rounded">
                  <h2 className="text-center mb-4 font-weight-bold">Add Item</h2>
                  <div className="mb-3">
                      <label htmlFor="name" className="form-label">Name</label>
                      <input
                          id="name"
                          type="text"
                          className="form-control"
                          placeholder="Enter Item Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                      />
                  </div>

                  <div className="d-flex flex-column">
                            {/* Category Dropdown */}
                            <label htmlFor="category">Category</label>
                            <select id="category" className="form-control my-1" onChange={(e) => setCategory(e.target.value)}>

                                <option key="Living" value="Living">Living</option>
                                <option key="Bedroom" value="Bedroom">Bedroom</option>
                                <option key="Bathroom" value="Bathroom">Bathroom</option>
                                <option key="Kitchen" value="Kitchen">Kitchen</option>
                                <option key="Office" value="Office">Office</option>
                            </select>

                            {/* Condition Dropdown */}
                            <label htmlFor="condition">Condition</label>
                            <select id="condition" className="form-control my-1" onChange={(e) => setCondition(e.target.value)}>
                                <option key="New" value="New">New</option>
                                <option key="Like New" value="Like New">Like New</option>
                                <option key="Older" value="Older">Older</option>
                            </select>
                  </div>

                  <div className="mb-3">
                      <label htmlFor="zipcode" className="form-label">Zipcode</label>
                      <input
                          id="zipcode"
                          type="text"
                          className="form-control"
                          placeholder="Enter the Zipcode"
                          value={zipcode}
                          onChange={(e) => setZipcode(e.target.value)}
                      />
                  </div>

                  <div className="mb-3">
                      <label htmlFor="age_days" className="form-label">Age in days</label>
                      <input
                          id="age_days"
                          type="text"
                          className="form-control"
                          placeholder="Enter the  Age in days"
                          value={age_days}
                          onChange={(e) => setAge_days(e.target.value)}
                      />
                  </div>

                  <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                          <label htmlFor="description" className="form-label mb-0">Description</label>
                          <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={handleGenerateDescription}
                              disabled={isGeneratingDescription || !name?.trim()}
                          >
                              {isGeneratingDescription ? 'Generating…' : 'Generate with AI'}
                          </button>
                      </div>
                      <textarea
                          id="description"
                          cols="2"
                          className="form-control mt-2"
                          placeholder="Enter the description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                      />
                  </div>
                  <div className="mb-3">
                      <label htmlFor="price" className="form-label">Price (0 = Free)</label>
                      <input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-control"
                          placeholder="Enter the price"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                      />
                  </div>
                  <div className="mb-3">
                      <label htmlFor="city" className="form-label">City</label>
                      <input
                          id="city"
                          type="text"
                          className="form-control"
                          placeholder="Enter the city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                      />
                  </div>
                  <div className="mb-3">
                      <label htmlFor="area" className="form-label">Area/Neighborhood</label>
                      <input
                          id="area"
                          type="text"
                          className="form-control"
                          placeholder="Enter the area"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                      />
                  </div>
                  <div className="mb-3">
                      <label htmlFor="mapUrl" className="form-label">Map Link (optional)</label>
                      <input
                          id="mapUrl"
                          type="url"
                          className="form-control"
                          placeholder="https://maps.google.com/..."
                          value={mapUrl}
                          onChange={(e) => setMapUrl(e.target.value)}
                      />
                  </div>
                  <div className="row">
                      <div className="col">
                          <div className="mb-3">
                              <label htmlFor="item-latitude" className="form-label">Latitude (optional)</label>
                              <input
                                  id="item-latitude"
                                  type="number"
                                  step="0.000001"
                                  className="form-control"
                                  placeholder="32.0853"
                                  value={lat}
                                  onChange={(e) => setLat(e.target.value)}
                              />
                          </div>
                      </div>
                      <div className="col">
                          <div className="mb-3">
                              <label htmlFor="item-longitude" className="form-label">Longitude (optional)</label>
                              <input
                                  id="item-longitude"
                                  type="number"
                                  step="0.000001"
                                  className="form-control"
                                  placeholder="34.7818"
                                  value={lng}
                                  onChange={(e) => setLng(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>
                  <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label mb-0">Pickup locations (up to 3)</label>
                          <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={addPickupLocation}
                              disabled={pickupLocations.length >= 3}
                          >
                              Add location
                          </button>
                      </div>
                      {pickupLocations.map((location, index) => (
                          <div key={index} className="border rounded p-3 mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                  <strong>Location {index + 1}</strong>
                                  {pickupLocations.length > 1 && (
                                      <button
                                          type="button"
                                          className="btn btn-link btn-sm text-danger"
                                          onClick={() => removePickupLocation(index)}
                                      >
                                          Remove
                                      </button>
                                  )}
                              </div>
                              <div className="mb-2">
                                  <label className="form-label">Label</label>
                                  <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Home, Work, Storage..."
                                      value={location.label}
                                      onChange={(e) => handlePickupLocationChange(index, 'label', e.target.value)}
                                  />
                              </div>
                              <div className="mb-2">
                                  <label className="form-label">City</label>
                                  <input
                                      type="text"
                                      className="form-control"
                                      value={location.city}
                                      onChange={(e) => handlePickupLocationChange(index, 'city', e.target.value)}
                                  />
                              </div>
                              <div className="mb-2">
                                  <label className="form-label">Area / Neighborhood</label>
                                  <input
                                      type="text"
                                      className="form-control"
                                      value={location.area}
                                      onChange={(e) => handlePickupLocationChange(index, 'area', e.target.value)}
                                  />
                              </div>
                              <div className="mb-2">
                                  <label className="form-label">Address</label>
                                  <input
                                      type="text"
                                      className="form-control"
                                      placeholder="123 Main St"
                                      value={location.address}
                                      onChange={(e) => handlePickupLocationChange(index, 'address', e.target.value)}
                                  />
                              </div>
                              <div className="row">
                                  <div className="col">
                                      <label className="form-label">Latitude (optional)</label>
                                      <input
                                          type="number"
                                          step="0.000001"
                                          className="form-control"
                                          value={location.lat}
                                          onChange={(e) => handlePickupLocationChange(index, 'lat', e.target.value)}
                                      />
                                  </div>
                                  <div className="col">
                                      <label className="form-label">Longitude (optional)</label>
                                      <input
                                          type="number"
                                          step="0.000001"
                                          className="form-control"
                                          value={location.lng}
                                          onChange={(e) => handlePickupLocationChange(index, 'lng', e.target.value)}
                                      />
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
                  <input style={{padding:'.5cm'}} type="file" id="file" name="file" accept=".jpg, .png, .gif"/>

                  <button className="btn btn-primary w-100 mb-3" onClick={handleAddItem}>Add Item</button>

                  <span style={{color:'green',height:'.5cm',display:'block',fontStyle:'italic',fontSize:'12px'}}>{message}</span>

              </div>
          </div>
      </div>
  </div>      
    );
}

export default ItemPage;
