import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export default function Navbar() {
    const { isLoggedIn, setIsLoggedIn, userName, setUserName, userRole, setUserRole, setCurrentUserId } = useAppContext();

    const navigate = useNavigate();
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

                <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
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
                        {isLoggedIn && userRole === 'admin' && (
                            <li className="nav-item">
                                <Link className="nav-link nav-pill nav-pill-active" to="/app/admin">
                                    Admin Panel
                                </Link>
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
        </>
    );
}
