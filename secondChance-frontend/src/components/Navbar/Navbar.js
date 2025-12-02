import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { urlConfig } from '../../config';

export default function Navbar() {
    const {
        isLoggedIn,
        setIsLoggedIn,
        userName,
        setUserName,
        userRole,
        setUserRole,
        setCurrentUserId,
        userStats,
        setUserStats,
    } = useAppContext();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showBadgePanel, setShowBadgePanel] = useState(false);

    const navigate = useNavigate();
    const loadUnread = useCallback(async () => {
        const token = sessionStorage.getItem('auth-token');
        if (!token) {
            setUnreadCount(0);
            return;
        }
        try {
            const response = await fetch(`${urlConfig.backendUrl}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                return;
            }
            const data = await response.json();
            const unread = data.filter((notif) => !notif.readAt).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchUserStats = useCallback(async () => {
        const token = sessionStorage.getItem('auth-token');
        if (!token) {
            setUserStats(null);
            return;
        }
        try {
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
        const authTokenFromSession = sessionStorage.getItem('auth-token');
        const nameFromSession = sessionStorage.getItem('name') || '';
        const roleFromSession = sessionStorage.getItem('role') || 'user';
        const userIdFromSession = sessionStorage.getItem('user-id') || '';

        if (authTokenFromSession) {
            setIsLoggedIn(true);
            setUserName(nameFromSession);
            setUserRole(roleFromSession);
            setCurrentUserId(userIdFromSession);
        } else {
            setIsLoggedIn(false);
            setUserName('');
            setUserRole('user');
            setCurrentUserId('');
        }
    }, [setIsLoggedIn, setUserName, setUserRole, setCurrentUserId]);

    useEffect(() => {
        const handler = () => {
            loadUnread();
            fetchUserStats();
        };
        window.addEventListener('notifications-updated', handler);
        return () => window.removeEventListener('notifications-updated', handler);
    }, [loadUnread, fetchUserStats]);

    useEffect(() => {
        if (isLoggedIn) {
            loadUnread();
            fetchUserStats();
        } else {
            setUnreadCount(0);
            setUserStats(null);
        }
    }, [isLoggedIn, loadUnread, fetchUserStats, setUserStats]);

    const handleLogout = () => {
        sessionStorage.removeItem('auth-token');
        sessionStorage.removeItem('name');
        sessionStorage.removeItem('email');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('user-id');
        setIsLoggedIn(false);
        setUserName('');
        setUserRole('user');
        setCurrentUserId('');
        navigate(`/app`);

    };
    const profileSecton = () => {
        navigate(`/app/profile`);
    };
    return (
        <>
            <nav className="navbar navbar-expand-lg sticky-top" id='navbar_container'>
                <Link className="navbar-brand" to={`/app`}>
                    <span className="brand-mark">SC</span>
                    <div className="d-flex flex-column">
                        <span>SecondChance</span>
                        <small className="text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.12em' }}>Give items a second life</small>
                    </div>
                </Link>

                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav align-items-lg-center gap-2">
                        <li className="nav-item">
                            <Link className="nav-link nav-pill" to="/app">Items</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link nav-pill" to="/app/search">Search</Link>
                        </li>
                        {isLoggedIn && (
                            <li className="nav-item">
                                <Link className="nav-link nav-pill" to="/app/reservations">
                                    My Reservations
                                </Link>
                            </li>
                        )}
                        {isLoggedIn && (
                            <li className="nav-item position-relative">
                                <Link className="nav-link nav-pill nav-notification-link" to="/app/notifications">
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="nav-notification-dot">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        )}
                        {isLoggedIn && userRole === 'admin' && (
                            <li className="nav-item">
                                <Link className="nav-link nav-pill nav-pill-active" to="/app/admin">
                                    Admin Panel
                                </Link>
                            </li>
                        )}
                        {isLoggedIn && userStats && (
                            <li className="nav-item">
                                <button
                                    type="button"
                                    className="btn btn-link nav-pill badge-pill"
                                    onClick={() => setShowBadgePanel(true)}
                                >
                                    {userStats.sellerLevelLabel || 'Rookie Seller'}
                                </button>
                            </li>
                        )}
                        {isLoggedIn ? (
                            <>
                                <li className="nav-item d-flex align-items-center">
                                    <span className="nav-link nav-pill" style={{ cursor: "pointer" }} onClick={profileSecton}>
                                        Hey {userName || 'Friend'}
                                    </span>
                                    {userRole === 'admin' && (
                                        <span className="chip-admin">Admin</span>
                                    )}
                                </li>
                                <li className="nav-item">
                                    <button className="btn btn-outline-light nav-cta" onClick={handleLogout}>Logout</button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="btn btn-modern-secondary nav-cta" to="/app/login">Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="btn btn-primary-modern nav-cta" to="/app/register">Join</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </nav>
            {showBadgePanel && (
                <div className="badge-panel-backdrop" onClick={() => setShowBadgePanel(false)}>
                    <div className="badge-panel" onClick={(e) => e.stopPropagation()}>
                        <h4>Your badges</h4>
                        <p className="text-muted mb-3">{userStats?.sellerLevelLabel}</p>
                        {userStats?.badges?.length ? (
                            <div className="badge-list">
                                {userStats.badges.map((badge) => (
                                    <span key={badge} className="badge-chip">
                                        {badge.replace(/-/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No badges yet. Keep sharing items to earn more.</p>
                        )}
                        <button className="btn btn-modern-secondary w-100 mt-3" onClick={() => setShowBadgePanel(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
