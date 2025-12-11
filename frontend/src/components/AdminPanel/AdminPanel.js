import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import { useAppContext } from '../../context/AppContext';
import './AdminPanel.css';
// לוח בקרה למנהלים: AdminPanel.js
const AdminPanel = () => {
  const { isLoggedIn, userRole } = useAppContext();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const authToken = sessionStorage.getItem('auth-token');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/app/login');
      return;
    }
    if (userRole !== 'admin') {
      setLoading(false);
      setError('Only admins can view this page.');
      return;
    }
    fetchItems();
    fetchStats();
    
  }, [isLoggedIn, userRole]);

// פונקציה לשליפת כל הפריטים למנהלים
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/admin/all`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Failed to load admin data');
      }
      const data = await response.json();
      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to reach the admin endpoint');
    } finally {
      setLoading(false);
    }
  };
// פונקציה לשליפת סטטיסטיקות למנהלים
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/admin/stats`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Failed to load statistics');
      }
      const data = await response.json();
      setStats(data);
      setStatsError('');
    } catch (err) {
      setStatsError(err.message || 'Unable to fetch stats');
    } finally {
      setStatsLoading(false);
    }
  };
// פונקציה למחיקת פריט על ידי מנהל
  const handleAdminDelete = async (itemId) => {
    if (!window.confirm(`Delete item ${itemId}? This cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/admin/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Failed to delete item');
      }
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setStatusMessage(`Item ${itemId} deleted by admin.`);
      setError('');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="admin-panel container mt-5">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2>Admin Control Center</h2>
          <p className="text-muted mb-0">You are viewing privileged data straight from the server.</p>
        </div>
        <span className="badge bg-warning text-dark fs-6 px-3 py-2">Admin</span>
      </div>

      {(loading || statsLoading) && <div className="alert alert-info">Loading admin data...</div>}
      {(error || statsError) && !(loading || statsLoading) && (
        <div className="alert alert-danger">{error || statsError}</div>
      )}
      {statusMessage && <div className="alert alert-success">{statusMessage}</div>}

      {!loading && userRole === 'admin' && (
        <>
          {stats && (
            <>
              <div className="admin-stats-grid mb-4">
                <div className="stat-card glass-panel">
                  <span>Total Users</span>
                  <strong>{stats?.summaries?.totalUsers ?? 0}</strong>
                  <small>{stats?.summaries?.newUsersLast30Days ?? 0} joined in last 30 days</small>
                </div>
                <div className="stat-card glass-panel">
                  <span>Total Items</span>
                  <strong>{stats?.summaries?.totalItems ?? items.length}</strong>
                  <small>{stats?.summaries?.availableItems ?? 0} available now</small>
                </div>
                <div className="stat-card glass-panel">
                  <span>Active Reservations</span>
                  <strong>{stats?.summaries?.activeReservations ?? 0}</strong>
                  <small>{stats?.summaries?.pendingItems ?? 0} pending approvals</small>
                </div>
                <div className="stat-card glass-panel">
                  <span>Sold Items</span>
                  <strong>{stats?.summaries?.soldItems ?? 0}</strong>
                  <small>Completed transactions so far</small>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-lg-6 mb-3">
                  <div className="chart-card glass-panel">
                    <h5>Status distribution</h5>
                    {stats.statusBreakdown && stats.statusBreakdown.length > 0 ? (
                      <ul className="status-list">
                        {stats.statusBreakdown.map((item) => (
                          <li key={item.status}>
                            <span>{item.status}</span>
                            <div className="bar-track">
                              <div
                                className="bar-fill"
                                style={{
                                  width: `${stats.summaries.totalItems ? (item.count / stats.summaries.totalItems) * 100 : 0}%`
                                }}
                              />
                            </div>
                            <strong>{item.count}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted mb-0">No data available</p>
                    )}
                  </div>
                </div>
                <div className="col-lg-6 mb-3">
                  <div className="chart-card glass-panel">
                    <h5>Top categories</h5>
                    {stats.topCategories && stats.topCategories.length > 0 ? (
                      <ul className="category-list">
                        {stats.topCategories.map((cat) => (
                          <li key={cat.label}>
                            <span>{cat.label}</span>
                            <strong>{cat.count}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted mb-0">No category data</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-lg-7 mb-3">
                  <div className="chart-card glass-panel">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0">Items added (last 6 months)</h5>
                      <button className="btn btn-outline-primary btn-sm" onClick={() => { fetchItems(); fetchStats(); }}>Refresh</button>
                    </div>
                    {stats.monthlyItems && stats.monthlyItems.length > 0 ? (
                      <div className="monthly-bars">
                        {stats.monthlyItems.map((bucket) => (
                          <div key={bucket.label} className="monthly-bar">
                            <span>{bucket.label}</span>
                            <div className="bar-track">
                              <div
                                className="bar-fill"
                                style={{ width: `${bucket.count * 10}%` }}
                              />
                            </div>
                            <strong>{bucket.count}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No recent activity</p>
                    )}
                  </div>
                </div>
                <div className="col-lg-5 mb-3">
                  <div className="chart-card glass-panel">
                    <h5>Newest items</h5>
                    {stats.recentItems && stats.recentItems.length > 0 ? (
                      <ul className="recent-list">
                        {stats.recentItems.map((item) => (
                          <li key={item.id}>
                            <div>
                              <strong>{item.name}</strong>
                              <small className="d-block text-muted">{item.category} · {item.status}</small>
                            </div>
                            <span>{item.dateAdded ? new Date(item.dateAdded * 1000).toLocaleDateString() : ''}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted mb-0">No recent items</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {items.length === 0 ? (
            <div className="alert alert-secondary">No items in the catalogue yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th scope="col">Item ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Category</th>
                    <th scope="col">Status</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Location</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item._id || item.id}>
                      <td>{item.id}</td>
                      <td>
                        <div className="fw-bold">{item.name}</div>
                        <small className="text-muted">{item.condition}</small>
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <span className={`badge ${item.status === 'reserved' ? 'bg-warning text-dark' : item.status === 'sold' ? 'bg-secondary' : 'bg-success'}`}>
                          {item.status || 'available'}
                        </span>
                        {item.status === 'reserved' && item.reservedUntil && (
                          <div className="small text-muted">
                            until {new Date(item.reservedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td>
                        {item.owner ? (
                          <>
                            <div>{item.owner.firstName} {item.owner.lastName}</div>
                            <small className="text-muted">{item.owner.email}</small>
                          </>
                        ) : (
                          <span className="text-muted">Unknown</span>
                        )}
                      </td>
                      <td>
                        {(item.city || item.area) ? (
                          <>
                            <div>{item.city || 'Unknown city'}</div>
                            <small className="text-muted">{item.area || 'Area not specified'}</small>
                            {item.mapUrl && (
                              <div>
                                <a href={item.mapUrl} target="_blank" rel="noopener noreferrer">
                                  Map
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-muted">No location</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleAdminDelete(item.id)}
                        >
                          Delete as Admin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;

