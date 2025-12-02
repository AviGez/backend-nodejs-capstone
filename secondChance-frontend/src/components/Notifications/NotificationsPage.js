import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import './NotificationsPage.css';

const formatDate = (dateString) => {
  if (!dateString) {
    return 'Just now';
  }
  return new Date(dateString).toLocaleString();
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingIds, setMarkingIds] = useState([]);
  const navigate = useNavigate();

  const notifyNavbar = () => {
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('auth-token');
      if (!token) {
        navigate('/app/login');
        return;
      }
      const response = await fetch(`${urlConfig.backendUrl}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load notifications');
      }
      const data = await response.json();
      setNotifications(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      const token = sessionStorage.getItem('auth-token');
      if (!token) {
        navigate('/app/login');
        return;
      }
      setMarkingIds((prev) => [...prev, id]);
      const response = await fetch(`${urlConfig.backendUrl}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [id] }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to mark notification');
      }
      await fetchNotifications();
      notifyNavbar();
    } catch (err) {
      setError(err.message);
    } finally {
      setMarkingIds((prev) => prev.filter((nid) => nid !== id));
    }
  };

  const markAllRead = async () => {
    try {
      const token = sessionStorage.getItem('auth-token');
      if (!token) {
        navigate('/app/login');
        return;
      }
      const response = await fetch(`${urlConfig.backendUrl}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [] }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to mark notifications');
      }
      await fetchNotifications();
      notifyNavbar();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAction = (notification) => {
    if (!notification.readAt) {
      markRead(notification._id);
    }
    const { context = {} } = notification;
    if (context.itemId) {
      navigate(`/app/item/${context.itemId}`);
      return;
    }
    if (context.chatId) {
      navigate(`/app/item/${context.itemId}`);
      return;
    }
  };

  return (
    <div className="page-shell">
      <div className="glass-panel notifications-panel">
        <div className="notifications-header">
          <div>
            <h2>Notifications</h2>
            <p className="text-muted mb-0">
              Stay on top of purchases, approvals, and new activity.
            </p>
          </div>
          <button
            className="btn btn-modern-secondary"
            onClick={markAllRead}
            disabled={!notifications.some((n) => !n.readAt)}
          >
            Mark all as read
          </button>
        </div>

        {loading ? (
          <p>Loading notifications...</p>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="text-muted">No notifications yet.</div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-card ${notification.readAt ? '' : 'notification-unread'}`}
              >
                <div>
                  <h5>{notification.title}</h5>
                  <p className="text-muted mb-1">{notification.message}</p>
                  <small className="text-muted">{formatDate(notification.createdAt)}</small>
                </div>
                <div className="notification-actions">
                  {notification.context?.itemId && (
                    <button
                      className="btn btn-link"
                      onClick={() => handleAction(notification)}
                    >
                      View item
                    </button>
                  )}
                  {!notification.readAt && (
                    <button
                      className="btn btn-outline-light"
                      onClick={() => markRead(notification._id)}
                      disabled={markingIds.includes(notification._id)}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

