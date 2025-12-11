import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { urlConfig } from '../../config';
import './Navbar.css';
// קומפוננטת הניווט העליונה
export default function Navbar() {
    const {
        isLoggedIn,
        setIsLoggedIn,
        userName,
        setUserName,
        userRole,
        setUserRole,
        setCurrentUserId,
    } = useAppContext();

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
// טיפול בהתנתקות המשתמש
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
            <nav className="navbar navbar-expand-lg navbar-container" id='navbar_container'>
                <Link className="navbar-brand" to={`/app`}>
                    <span className="brand-mark">SC</span>
                    <div className="brand-text">
                        <span className="brand-title">SecondChance</span>
                        <span className="brand-subtitle">Give items a second life</span>
                    </div>
                </Link>

                <button 
                    className="navbar-toggler" 
                    type="button" 
                    data-toggle="collapse" 
                    data-target="#navbarNav" 
                    aria-controls="navbarNav" 
                    aria-expanded="false" 
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <Link className="nav-link nav-pill" to="/app">Home</Link>
                        </li>
                        {isLoggedIn && userRole === 'admin' && (
                            <li className="nav-item">
                                <Link className="nav-link nav-pill nav-pill-active" to="/app/admin">
                                    Admin Panel
                                </Link>
                            </li>
                        )}
                        {isLoggedIn ? (
                            <>
                                <li className="nav-item">
                                    <span className="nav-link nav-pill user-greeting" style={{ cursor: "pointer" }} onClick={profileSecton}>
                                        Hey {userName || 'Friend'}
                                        {userRole === 'admin' && (
                                            <span className="chip-admin">Admin</span>
                                        )}
                                    </span>
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
