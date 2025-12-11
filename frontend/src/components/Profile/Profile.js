import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import './Profile.css';
import { urlConfig } from '../../config';
import { useAppContext } from '../../context/AppContext';
// קומפוננטת עמוד הפרופיל של המשתמש
const Profile = () => {
  const [userDetails, setUserDetails] = useState({});
  const [updatedDetails, setUpdatedDetails] = useState({});
  const { setUserName } = useAppContext();
  const [changed, setChanged] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [uploadedItems, setUploadedItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState('');
  const [itemActionLoading, setItemActionLoading] = useState(null);
  const [itemActionError, setItemActionError] = useState('');
  const [itemActionSuccess, setItemActionSuccess] = useState('');

  const navigate = useNavigate();
// פונקציה לאתחול טעינת פרטי המשתמש ותוכן הפרופיל
  useEffect(() => {
    const authtoken = sessionStorage.getItem("auth-token");
    if (!authtoken) {
      navigate("/app/login");
      return;
    }
    fetchUserProfile();
    fetchUserContent(authtoken);
  }, [navigate]);
// פונקציה לטעינת פרטי המשתמש מהאחסון המקומי
  const fetchUserProfile = () => {
    try {
      const email = sessionStorage.getItem("email");
      const name = sessionStorage.getItem("name");
      if (name || email) {
        const storedUserDetails = {
          name,
          email,
        };
        setUserDetails(storedUserDetails);
        setUpdatedDetails(storedUserDetails);
      }
    } catch (error) {
      console.error(error);
    }
  };
// פונקציה לטעינת התוכן של המשתמש - פריטים שהעלה והזמנות
  const fetchUserContent = async (token) => {
    try {
      setContentLoading(true);
      const [itemsRes, reservationsRes] = await Promise.all([
        fetch(`${urlConfig.backendUrl}/api/secondchance/items/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${urlConfig.backendUrl}/api/secondchance/items/reservations/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!itemsRes.ok) {
        const err = await itemsRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load your items');
      }
      if (!reservationsRes.ok) {
        const err = await reservationsRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load your reservations');
      }

      const [itemsData, reservationsData] = await Promise.all([
        itemsRes.json(),
        reservationsRes.json(),
      ]);
      setUploadedItems(itemsData);
      setReservations(reservationsData);
      setContentError('');
    } catch (err) {
      setContentError(err.message || 'Unable to load profile content');
    } finally {
      setContentLoading(false);
    }
  };
// פונקציה לטיפול בעריכת פרטי המשתמש
  const handleEdit = () => {
    setEditMode(true);
  };
// פונקציה לטיפול בשינויי השדות בטופס העריכה
  const handleInputChange = (e) => {
    setUpdatedDetails({
      ...updatedDetails,
      [e.target.name]: e.target.value,
    });
  };
// פונקציה לטיפול בשליחת טופס העדכון
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const authtoken = sessionStorage.getItem("auth-token");
      const email = sessionStorage.getItem("email");

      if (!authtoken || !email) {
        navigate("/app/login");
        return;
      }

      const payload = { ...updatedDetails };
      const response = await fetch(`${urlConfig.backendUrl}/api/auth/update`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authtoken}`,
          "Content-Type": "application/json",
          "Email": email,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        sessionStorage.setItem("name", updatedDetails.name);
        setUserDetails(updatedDetails);
        setEditMode(false);
        setUserName(updatedDetails.name);
        setChanged("Name Changed Successfully!");
        setTimeout(() => {
          setChanged("");
          navigate("/");
        }, 1000);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewItem = (itemId) => {
    navigate(`/app/item/${itemId}`);
  };
// פונקציה לעדכון מחיר של פריט
  const handleUpdatePrice = async (item) => {
    const authtoken = sessionStorage.getItem("auth-token");
    if (!authtoken) {
      navigate("/app/login");
      return;
    }
    const currentPrice = Number(item.price || 0);
    const input = window.prompt(
      "Enter the new price for this item (0 to make it free):",
      Number.isFinite(currentPrice) ? currentPrice.toString() : "0"
    );
    if (input === null) {
      return;
    }
    const parsed = Number(input);
    if (Number.isNaN(parsed) || parsed < 0) {
      window.alert("Price must be a number greater than or equal to 0.");
      return;
    }
    try {
      setItemActionLoading(item.id);
      setItemActionError('');
      setItemActionSuccess('price');
      const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/${item.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authtoken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ price: parsed }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update price');
      }
      await fetchUserContent(authtoken);
      setItemActionSuccess('Price updated successfully.');
      setTimeout(() => setItemActionSuccess(''), 2500);
    } catch (error) {
      setItemActionError(error.message || 'Unable to update price');
    } finally {
      setItemActionLoading(null);
    }
  };
// פונקציה למחיקת פריט
  const handleDeleteItem = async (item) => {
    const authtoken = sessionStorage.getItem("auth-token");
    if (!authtoken) {
      navigate("/app/login");
      return;
    }
    const confirmed = window.confirm("Are you sure you want to delete this item? This action cannot be undone.");
    if (!confirmed) {
      return;
    }
    try {
      setItemActionLoading(item.id);
      setItemActionError('');
      setItemActionSuccess('delete');
      const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/${item.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authtoken}`,
        },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete item');
      }
      setUploadedItems((prev) => prev.filter((existing) => existing.id !== item.id));
      await fetchUserContent(authtoken);
      setItemActionSuccess('Item deleted successfully.');
      setTimeout(() => setItemActionSuccess(''), 2500);
    } catch (error) {
      setItemActionError(error.message || 'Unable to delete item');
    } finally {
      setItemActionLoading(null);
    }
  };
// פונקציה לרינדור כרטיס פריט
  const renderItemCard = (item) => (
    <div key={item.id} className="profile-item-card">
      <div>
        <strong>{item.name}</strong>
        <p className="text-muted mb-1">{item.category}</p>
        <small>Status: {item.status || 'available'}</small>
      </div>
      <div className="profile-item-actions">
        <span className="badge bg-secondary">
          {item.price && Number(item.price) > 0 ? `$${Number(item.price).toFixed(2)}` : 'Free'}
        </span>
        <button className="btn btn-link" onClick={() => handleViewItem(item.id)}>View</button>
        <button
          className="btn btn-link text-primary"
          disabled={itemActionLoading === item.id}
          onClick={() => handleUpdatePrice(item)}
        >
          {itemActionLoading === item.id ? 'Saving...' : 'Edit price'}
        </button>
        <button
          className="btn btn-link text-danger"
          disabled={itemActionLoading === item.id}
          onClick={() => handleDeleteItem(item)}
        >
          {itemActionLoading === item.id ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
// פונקציה לרינדור כרטיס הזמנה
  const renderReservationCard = (item) => (
    <div key={item.id} className="profile-item-card">
      <div>
        <strong>{item.name}</strong>
        <p className="text-muted mb-1">{item.category}</p>
        <small>Reserved until {item.reservedUntil ? new Date(item.reservedUntil).toLocaleString() : 'N/A'}</small>
      </div>
      <div className="profile-item-actions">
        <span className="badge bg-warning text-dark">Reserved</span>
        <button className="btn btn-link" onClick={() => handleViewItem(item.id)}>View</button>
      </div>
    </div>
  );

  return (
    <div className="page-shell">
      <div className="profile-container">
        {editMode ? (
          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={userDetails.email}
                disabled
              />
            </label>
            <label>
              Name
              <input
                type="text"
                name="name"
                value={updatedDetails.name || ''}
                onChange={handleInputChange}
              />
            </label>

            <button type="submit">Save</button>
          </form>
        ) : (
          <>
            <div className="profile-details">
              <h1>Hi, {userDetails.name}</h1>
              <p><b>Email:</b> {userDetails.email}</p>
              <button onClick={handleEdit}>Edit</button>
              {changed && (
                <span style={{color:'green',height:'.5cm',display:'block',fontStyle:'italic',fontSize:'12px'}}>{changed}</span>
              )}
            </div>
            <div className="profile-content">
              {contentLoading ? (
                <p className="text-muted" style={{textAlign: 'center', padding: '2rem'}}>Loading your items...</p>
              ) : contentError ? (
                <div className="alert alert-danger">{contentError}</div>
              ) : (
                <>
                  {itemActionError && (
                    <div className="alert alert-danger">{itemActionError}</div>
                  )}
                  {itemActionSuccess && (
                    <div className="alert alert-success">{itemActionSuccess}</div>
                  )}
                  <section>
                    <h2>My Listings</h2>
                    {uploadedItems.length ? (
                      uploadedItems.map(renderItemCard)
                    ) : (
                      <p className="text-muted">You haven't posted any items yet.</p>
                    )}
                  </section>
                  <section>
                    <h2>My Reservations</h2>
                    {reservations.length ? (
                      reservations.map(renderReservationCard)
                    ) : (
                      <p className="text-muted">You have no active reservations.</p>
                    )}
                  </section>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
