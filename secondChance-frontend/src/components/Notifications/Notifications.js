import React, { useState, useEffect } from 'react';
import { urlConfig } from '../../config';
import './Notifications.css';

export default function Notifications({ onClose, onUpdateCount }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = sessionStorage.getItem('auth-token');
            if (!token) {
                setError('Not authenticated');
                setLoading(false);
                return;
            }

            const response = await fetch(`${urlConfig.backendUrl}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const contentType = response.headers.get('content-type') || '';
            const isJson = contentType.includes('application/json');
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText} – ${text.slice(0, 200)}`);
            }
            if (!isJson) {
                const text = await response.text();
                throw new Error(`Unexpected response (not JSON): ${text.slice(0, 200)}`);
            }

            const data = await response.json();
            setNotifications(data);
            // Update count if callback provided
            if (onUpdateCount) {
                const unread = data.filter(n => !n.readAt).length;
                onUpdateCount(unread);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (ids) => {
        try {
            const token = sessionStorage.getItem('auth-token');
            const response = await fetch(`${urlConfig.backendUrl}/api/notifications/mark-read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids }),
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev => {
                    const updated = prev.map(notif => 
                        ids.includes(notif._id) 
                            ? { ...notif, readAt: new Date() }
                            : notif
                    );
                    // Update count if callback provided
                    if (onUpdateCount) {
                        const unread = updated.filter(n => !n.readAt).length;
                        onUpdateCount(unread);
                    }
                    return updated;
                });
            }
        } catch (err) {
            console.error('Error marking notifications as read:', err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const token = sessionStorage.getItem('auth-token');
            const response = await fetch(`${urlConfig.backendUrl}/api/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setNotifications(prev => {
                    const filtered = prev.filter(notif => notif._id !== id);
                    // Update count if callback provided
                    if (onUpdateCount) {
                        const unread = filtered.filter(n => !n.readAt).length;
                        onUpdateCount(unread);
                    }
                    return filtered;
                });
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const markAllAsRead = async () => {
        await markAsRead(notifications.filter(n => !n.readAt).map(n => n._id));
    };

    const unreadCount = notifications.filter(n => !n.readAt).length;

    if (loading) {
        return (
            <div className="notifications-dropdown">
                <div className="notifications-header">
                    <h3>Notifications</h3>
                    {onClose && <button className="close-btn" onClick={onClose}>×</button>}
                </div>
                <div className="notifications-loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="notifications-dropdown">
                <div className="notifications-header">
                    <h3>Notifications</h3>
                    {onClose && <button className="close-btn" onClick={onClose}>×</button>}
                </div>
                <div className="notifications-error">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="notifications-dropdown">
            <div className="notifications-header">
                <h3>Notifications {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h3>
                <div className="notifications-actions">
                    {unreadCount > 0 && (
                        <button className="mark-all-read-btn" onClick={markAllAsRead}>
                            Mark all as read
                        </button>
                    )}
                    {onClose && <button className="close-btn" onClick={onClose}>×</button>}
                </div>
            </div>
            <div className="notifications-list">
                {notifications.length === 0 ? (
                    <div className="no-notifications">No notifications yet</div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`notification-item ${!notification.readAt ? 'unread' : ''}`}
                            onClick={() => {
                                if (!notification.readAt) {
                                    markAsRead([notification._id]);
                                }
                            }}
                        >
                            <div className="notification-content">
                                <div className="notification-title">{notification.title}</div>
                                <div className="notification-message">{notification.message}</div>
                                <div className="notification-time">
                                    {new Date(notification.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <button
                                className="delete-notification-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification._id);
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

