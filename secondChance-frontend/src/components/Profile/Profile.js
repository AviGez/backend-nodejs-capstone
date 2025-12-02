import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import './Profile.css';
import { urlConfig } from '../../config';
import { useAppContext } from '../../context/AppContext';

const Profile = () => {
  const [userDetails, setUserDetails] = useState({});
  const [updatedDetails, setUpdatedDetails] = useState({});
  const { setUserName, userStats, setUserStats } = useAppContext();
  const [changed, setChanged] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [uploadedItems, setUploadedItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState('');

  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('auth-token');
      if (!token) {
        setUserStats(null);
        return;
      }
      const response = await fetch(`${urlConfig.backendUrl}/api/user-stats/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setUserStats(data);
    } catch (err) {
      console.error(err);
    }
  }, [setUserStats]);

  useEffect(() => {
    const authtoken = sessionStorage.getItem("auth-token");
    if (!authtoken) {
      navigate("/app/login");
      return;
    }
    fetchUserProfile();
    fetchUserContent(authtoken);
    fetchStats();
  }, [navigate, fetchStats]);

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

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleInputChange = (e) => {
    setUpdatedDetails({
      ...updatedDetails,
      [e.target.name]: e.target.value,
    });
  };

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
      </div>
    </div>
  );

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
            <span style={{color:'green',height:'.5cm',display:'block',fontStyle:'italic',fontSize:'12px'}}>{changed}</span>
          </div>
          <div className="profile-content">
            {userStats && (
              <section>
                <h2>Badge showcase</h2>
                <p className="text-muted mb-2">{userStats.sellerLevelLabel || 'Rookie Seller'}</p>
                {userStats.badges?.length ? (
                  <div className="badge-list">
                    {userStats.badges.map((badge) => (
                      <span key={badge} className="badge-chip">
                        {badge.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No badges yet. Keep sharing to unlock new achievements.</p>
                )}
              </section>
            )}
            {contentLoading ? (
              <p>Loading your items...</p>
            ) : contentError ? (
              <div className="alert alert-danger">{contentError}</div>
            ) : (
              <>
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
  );
};

export default Profile;
