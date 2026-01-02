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
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');

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
    fetchNotifications();
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
    console.log('Save button clicked - handleSubmit called');
    
    // Show immediate feedback
    setChanged("Saving changes...");

    try {
      // Update locally
      sessionStorage.setItem("name", updatedDetails.name);
      sessionStorage.setItem("email", updatedDetails.email);
      setUserDetails(updatedDetails);
      setUserName(updatedDetails.name);
      setEditMode(false);
      setChanged("Changes saved successfully!");
      setTimeout(() => {
        setChanged("");
      }, 3000);
      
      // Try to update on server in background (won't block if it fails)
      const authtoken = sessionStorage.getItem("auth-token");
      const email = sessionStorage.getItem("email");

      if (authtoken && email) {
        const payload = { ...updatedDetails };
        console.log('Attempting server update with payload:', payload);
        
        fetch(`${urlConfig.backendUrl}/api/auth/update`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${authtoken}`,
            "Content-Type": "application/json",
            "Email": email,
          },
          body: JSON.stringify(payload),
        }).then(response => {
          if (response.ok) {
            console.log('Server update successful');
          } else {
            console.log('Server update failed, but local update succeeded');
          }
        }).catch(error => {
          console.log('Server update error (ignoring):', error);
        });
      }
    } catch (error) {
      console.error('Exception during update:', error);
      setChanged(`Error: ${error.message || 'Failed to update profile'}`);
      setEditMode(false);
      setTimeout(() => {
        setChanged("");
      }, 5000);
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
// פונקציה לביטול הזמנה
  const handleCancelReservation = async (item) => {
    if (!window.confirm(`Cancel reservation for ${item.name}?`)) return;
    
    setItemActionLoading(item.id);
    setItemActionError('');
    setItemActionSuccess('');
    
    try {
      const authtoken = sessionStorage.getItem("auth-token");
      const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/${item.id}/cancel-reservation`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authtoken}`,
        },
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to cancel reservation');
      }
      
      await response.json(); // קריאה של התגובה
      
      // הסרת הפריט מרשימת ההזמנות מיד - עם force update
      setReservations(prevReservations => {
        const newReservations = prevReservations.filter((existing) => existing.id !== item.id);
        return [...newReservations]; // יוצר מערך חדש לחלוטין
      });
      
      setItemActionSuccess(`${item.name} is now available again on the site!`);
      setTimeout(() => setItemActionSuccess(''), 3000);
      
    } catch (error) {
      console.error('Cancel reservation error:', error);
      setItemActionError(error.message || 'Unable to cancel reservation');
      setTimeout(() => setItemActionError(''), 3000);
    } finally {
      setItemActionLoading(null);
    }
  };

  // Notifications
  const fetchNotifications = async () => {
    const authtoken = sessionStorage.getItem('auth-token');
    if (!authtoken) return;
    try {
      setNotifLoading(true);
      const res = await fetch(`${urlConfig.backendUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${authtoken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load notifications');
      }
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
      setNotifError('');
    } catch (err) {
      setNotifError(err.message || 'Unable to fetch notifications');
    } finally {
      setNotifLoading(false);
    }
  };

  const markNotificationsRead = async (ids = []) => {
    const authtoken = sessionStorage.getItem('auth-token');
    if (!authtoken) return;
    try {
      const res = await fetch(`${urlConfig.backendUrl}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authtoken}` },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to mark notifications');
      }
      await fetchNotifications();
      // notify other components via sessionStorage so Navbar updates sooner
      try { sessionStorage.setItem('notifications-last-update', Date.now().toString()); } catch(e){}
      try { window.dispatchEvent(new Event('notifications-updated')); } catch(e){}
    } catch (e) {
      setNotifError(e.message || 'Mark read failed');
    }
  };

  const deleteNotification = async (id) => {
    const authtoken = sessionStorage.getItem('auth-token');
    if (!authtoken) return;
    try {
      const res = await fetch(`${urlConfig.backendUrl}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authtoken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete notification');
      }
      await fetchNotifications();
      try { sessionStorage.setItem('notifications-last-update', Date.now().toString()); } catch(e){}
      try { window.dispatchEvent(new Event('notifications-updated')); } catch(e){}
    } catch (e) {
      setNotifError(e.message || 'Delete failed');
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
    <div className="profile-item-card">
      <div>
        <strong>{item.name}</strong>
        <p className="text-muted mb-1">{item.category}</p>
        <small>Reserved until {item.reservedUntil ? new Date(item.reservedUntil).toLocaleString() : 'N/A'}</small>
      </div>
      <div className="profile-item-actions">
        <span className="badge bg-warning text-dark">Reserved</span>
        <button className="btn btn-link" onClick={() => handleViewItem(item.id)}>View</button>
        <button
          className="btn btn-link text-danger"
          disabled={itemActionLoading === item.id}
          onClick={() => handleCancelReservation(item)}
        >
          {itemActionLoading === item.id ? 'Cancelling...' : 'Cancel Reservation'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="page-shell">
      <div className="profile-container">
        {editMode ? (
          <form onSubmit={handleSubmit}>
            <label>
              Name
              <input
                type="text"
                name="name"
                value={updatedDetails.name || ''}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={updatedDetails.email || ''}
                onChange={handleInputChange}
              />
            </label>

            <button type="submit">Save</button>
          </form>
        ) : (
          <>
            <div className="profile-details">
              <h1>Hi {userDetails.name}!</h1>
              <p><b>Name:</b> {userDetails.name}</p>
              <p><b>Email:</b> {userDetails.email}</p>
              <button onClick={handleEdit}>Edit</button>
              {changed && (
                <div className="alert alert-success mt-3" style={{fontSize: '14px', padding: '0.75rem'}}>
                  {changed}
                </div>
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
                    <h2>Notifications</h2>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                      <div />
                      <div>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => fetchNotifications()}>Refresh</button>
                        <button className="btn btn-sm btn-primary" onClick={() => markNotificationsRead([])}>Mark all read</button>
                      </div>
                    </div>
                    {notifLoading ? (
                      <p className="text-muted">Loading notifications...</p>
                    ) : notifError ? (
                      <div className="alert alert-danger">{notifError}</div>
                    ) : notifications.length === 0 ? (
                      <p className="text-muted">No notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className="profile-item-card" style={{alignItems:'flex-start'}}>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',gap:8,alignItems:'center'}}>
                              {!n.readAt && <span className="badge bg-warning text-dark">New</span>}
                              <strong style={{marginLeft:4}}>{n.title}</strong>
                            </div>
                            <p className="text-muted" style={{margin:'6px 0'}}>{n.message}</p>
                            <small className="text-muted">{n.context && n.context.itemId ? `Related item: ${n.context.itemId}` : ''} {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</small>
                          </div>
                          <div className="profile-item-actions">
                            {n.context && n.context.itemId && (
                              <button className="btn btn-link" onClick={() => navigate(`/app/item/${n.context.itemId}`)}>Open item</button>
                            )}
                            {!n.readAt && <button className="btn btn-link text-primary" onClick={() => markNotificationsRead([n._id])}>Mark read</button>}
                            <button className="btn btn-link text-danger" onClick={() => deleteNotification(n._id)}>Delete</button>
                          </div>
                        </div>
                      ))
                    )}
                  </section>
                  <section>
                    <h2>My Reservations</h2>
                    {reservations.length ? (
                      reservations.map(item => <div key={item.id}>{renderReservationCard(item)}</div>)
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
