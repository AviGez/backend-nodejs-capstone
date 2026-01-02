import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { urlConfig } from "../../config"
import { useAppContext } from '../../context/AppContext';
import ChatModal from '../ChatModal/ChatModal';
import PaymentModal from '../PaymentModal/PaymentModal';

import './DetailsPage.css';

const cityOptions = [
    'Jerusalem',
    'Tel Aviv-Yafo',
    'Haifa',
    'Rishon LeZion',
    'Petah Tikva',
    'Ashdod',
    'Netanya',
    'Beer Sheva',
    'Holon',
    'Bnei Brak',
    'Rehovot',
    'Bat Yam',
    'Herzliya',
    'Kfar Saba',
    'Raanana',
    'Ramat Gan',
    'Modiin',
    'Hadera',
    'Ashkelon',
    'Nazareth',
    'Tiberias',
    'Eilat',
    'Safed',
    'Kiryat Ono',
    'Givatayim'
];
// דף פרטי פריט/מתנה
function DetailsPage() {
    const navigate = useNavigate();
    const { itemId } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [secureData, setSecureData] = useState(null);
    const [actionMessage, setActionMessage] = useState('');
    const [chatModal, setChatModal] = useState({ open: false, chatId: null });
    const [chatError, setChatError] = useState('');
    const [pickupError] = useState('');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    // shipping/delivery removed — price is item price only
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const { isLoggedIn, currentUserId } = useAppContext();

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/app/login')
        }

        // גלילה למעלה בעת טעינת הקומפוננטה
        window.scrollTo(0, 0);

        // שליפת הפריט שיוצג בדף הפרטים
        const fetchItem = async () => {
            try {
                const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/${itemId}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setGift(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
        window.scrollTo(0, 0);
    }, [itemId, isLoggedIn, navigate, currentUserId]);

    useEffect(() => {
        setActiveImageIndex(0);
    }, [gift?.id]);

    useEffect(() => {
        const fetchSecure = async () => {
            if (!isLoggedIn) {
                return;
            }
            const token = sessionStorage.getItem('auth-token');
            if (!token) {
                return;
            }
            try {
                const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/${itemId}/secure`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    setSecureData(null);
                    return;
                }
                const data = await response.json();
                setSecureData(data);
            } catch (e) {
                setSecureData(null);
            }
        };

        fetchSecure();
    }, [itemId, isLoggedIn]);
// חישוב רשימת תמונות הגלריה
    const galleryImages = useMemo(() => {
        if (!gift) {
            return [];
        }
        let sources = [];
        const raw = gift.galleryImages ?? gift.images ?? [];
        if (Array.isArray(raw)) {
            sources = raw.slice();
        } else if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    sources = parsed;
                }
            } catch (err) {
                sources = [raw];
            }
        }
        if (gift.image) {
            sources.unshift(gift.image);
        }
        const cleaned = sources.filter(Boolean);
        return Array.from(new Set(cleaned));
    }, [gift]);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    // חישוב מרחק בין שתי נקודות קואורדינטות (נוסחת האברסין)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // רדיוס כדור הארץ בק"מ
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // מרחק בק"מ
    };

    // shipping-related calculations removed

    const handleBackClick = () => {
        navigate(-1); // חזרה לעמוד הקודם
    };

    // פתיחת מודאל תשלום
    const handleBuyNow = () => {
        setShowPaymentModal(true);
    };

    // טיפול בהצלחת תשלום
    const handlePaymentSuccess = (result) => {
        setShowPaymentModal(false);
        setActionMessage('Payment successful! Item purchased.');
        // update local state to show item as sold
        setGift((prev) => (prev ? { ...prev, status: 'sold' } : prev));
        // clear message after a short delay
        setTimeout(() => {
            setActionMessage('');
        }, 4000);
    };

    // ביטול תשלום
    const handlePaymentCancel = () => {
        setShowPaymentModal(false);
    };

// בקשת אישור לאיסוף הפריט
    const requestApproval = async () => {
        try {
            setActionMessage('');
            const token = sessionStorage.getItem('auth-token');
            const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/${gift.id}/request-approval`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to request approval');
            }
            setActionMessage('Approval requested. Waiting for seller response.');
            setTimeout(() => setActionMessage(''), 3000);
            const secureResponse = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/${gift.id}/secure`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (secureResponse.ok) {
                setSecureData(await secureResponse.json());
            }
        } catch (e) {
            setActionMessage(e.message);
        }
    };
// אישור קונה על ידי המוכר
    const approveBuyer = async (buyerId) => {
        try {
            const token = sessionStorage.getItem('auth-token');
            const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/${gift.id}/approve-buyer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ buyerId }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to approve buyer');
            }
            const data = await response.json();
            setActionMessage('Buyer approved successfully');
            setTimeout(() => setActionMessage(''), 2500);
            setSecureData((prev) => {
                if (!prev) return prev;
                const approvals = prev.approvals?.map((approval) =>
                    approval.buyerId === buyerId
                        ? { ...approval, status: 'approved', chatId: data.chatId, updatedAt: data.approval.updatedAt }
                        : approval
                );
                return { ...prev, approvals };
            });
        } catch (e) {
            setActionMessage(e.message);
        }
    };
// פתיחת חלון צ'אט
    const openChat = async (existingChatId = null) => {
        try {
            setChatError('');
            let chatIdentifier = existingChatId;
            if (!chatIdentifier) {
                const token = sessionStorage.getItem('auth-token');
                const response = await fetch(`${urlConfig.backendUrl}/api/chats/${gift.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error || 'Unable to open chat');
                }
                const chat = await response.json();
                chatIdentifier = chat.id;
            }
            setChatModal({ open: true, chatId: chatIdentifier });
        } catch (e) {
            setChatError(e.message);
            setTimeout(() => setChatError(''), 4000);
        }
    };
// בדיקת הרשאות לצפייה בפרטי מיקום האיסוף המלאים
    const canViewFullPickupDetails =
        secureData?.role === 'seller' || secureData?.approvalStatus === 'approved';
// רינדור פרטי מיקום האיסוף
    const renderPickupLocation = () => {
        const location = secureData?.pickupLocations?.[0];
        if (!location && !(gift.city || gift.area || gift.mapUrl)) {
            return null;
        }
        const showAddress = location && canViewFullPickupDetails;
        return (
            <div className="details-card">
                <h3>Pickup location</h3>
                {location ? (
                    <>
                        <p className="text-muted">{location.label}</p>
                        <p className="text-strong">{location.city}{location.area ? ` · ${location.area}` : ''}</p>
                        {showAddress ? (
                            <p className="text-strong">{location.address}</p>
                        ) : (
                            <p className="text-muted">Full address unlocks once approved.</p>
                        )}
                    </>
                ) : (
                    <>
                        {(gift.city || gift.area) && (
                            <p>
                                <strong>City:</strong> {gift.city || 'Unknown'}, {gift.area || 'Area not specified'}
                            </p>
                        )}
                        {gift.mapUrl && (
                            <a href={gift.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-modern-secondary btn-sm">
                                Open in Maps
                            </a>
                        )}
                    </>
                )}
            </div>
        );
    };
// רינדור פאנל קונה
    const renderBuyerPanel = () => {
        if (!secureData || secureData.role === 'seller') {
            return null;
        }
        return (
            <div className="details-card">
                <h3>Pickup approval</h3>
                {secureData.approvalStatus ? (
                    <p>Status: <strong>{secureData.approvalStatus}</strong></p>
                ) : (
                    <p>No approval request yet.</p>
                )}
                {secureData.approvalStatus !== 'approved' && (
                    <button
                        className="btn btn-modern-secondary"
                        onClick={requestApproval}
                        disabled={secureData.approvalStatus === 'pending'}
                    >
                        {secureData.approvalStatus === 'pending' ? 'Waiting for seller' : 'Request pickup approval'}
                    </button>
                )}
                {secureData.approvalStatus === 'approved' && (
                    <button className="btn btn-modern-secondary" onClick={() => openChat(secureData.chatId)}>
                        Open chat
                    </button>
                )}
            </div>
        );
    };
// רינדור פאנל מוכר
    const renderSellerPanel = () => {
        if (secureData?.role !== 'seller') {
            return null;
        }
        return (
            <div className="details-card">
                <h3>Buyers awaiting pickup</h3>
                {secureData.approvals?.length ? (
                    <div className="seller-approvals">
                        {secureData.approvals.map((approval) => (
                            <div key={approval.buyerId} className="seller-approval-row">
                                <div>
                                    <strong>{approval.buyerName || approval.buyerId}</strong>
                                    <small className="d-block text-muted">{approval.status}</small>
                                </div>
                                <div className="d-flex gap-2">
                                    {approval.status === 'pending' && (
                                        <button
                                            className="btn btn-modern-secondary btn-sm"
                                            onClick={() => approveBuyer(approval.buyerId)}
                                        >
                                            Approve
                                        </button>
                                    )}
                                    {approval.status === 'approved' && (
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => openChat(approval.chatId)}
                                        >
                                            Open chat
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted">No buyers have requested approval yet.</p>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="details-page-loader">
                <div className="loader-container">
                    <div className="loader-spinner"></div>
                    <p className="loader-text">Loading item details...</p>
                </div>
            </div>
        );
    }
    if (error) return <div className="details-page-error">Error: {error}</div>;
    if (!gift) return <div className="details-page-error">Gift not found</div>;

    return (
        <div className="page-shell">
            <button className="btn btn-ghost-modern mb-4" onClick={handleBackClick}>← Back</button>
            <div className="details-panel">
                <div className="details-wrapper">
                    <div className="details-media">
                    <div className="details-media__main">
                        {galleryImages.length ? (
                            <img
                                src={urlConfig.backendUrl + galleryImages[activeImageIndex]}
                                alt={gift.name}
                            />
                        ) : (
                            <div className="details-media__placeholder">No image available</div>
                        )}
                    </div>
                    {galleryImages.length > 1 && (
                        <div className="details-thumbs">
                            {galleryImages.map((img, index) => (
                                <button
                                    key={`${img}-${index}`}
                                    className={`details-thumb ${index === activeImageIndex ? 'is-active' : ''}`}
                                    onClick={() => setActiveImageIndex(index)}
                                    type="button"
                                >
                                    <img src={urlConfig.backendUrl + img} alt={`${gift.name} ${index + 1}`} />
                                </button>
                            ))}
                        </div>
                    )}
                    </div>
                    <div className="details-info">
                        <div className="details-info__header">
                            <span className="chip">{gift.category}</span>
                            <h2>{gift.name}</h2>
                            <p className="muted">{gift.condition}</p>
                        </div>
                        <div className="details-info__grid">
                            <div className="details-card compact">
                                <span className="label">Price</span>
                                <strong>{gift.status === 'sold' ? 'Sold' : (gift.price && Number(gift.price) > 0 ? `$${Number(gift.price).toFixed(2)}` : 'Free')}</strong>
                                {gift.status === 'available' && Number(gift.price || 0) > 0 && (
                                    <button className="btn btn-modern-secondary btn-sm" onClick={() => openChat()}>
                                        Message seller
                                    </button>
                                )}
                                {gift.status === 'available' && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}>
                                        {(Number(gift.price || 0) > 0) && (
                                            <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                                                Total: ${Number(gift.price || 0).toFixed(2)}
                                            </div>
                                        )}
                                        <button 
                                            className="btn btn-modern-secondary btn-sm"
                                            style={{ 
                                                background: 'linear-gradient(135deg, #0070ba 0%, #003087 100%)',
                                                color: 'white',
                                                border: 'none',
                                                width: '100%',
                                                marginTop: '0.5rem'
                                            }}
                                            onClick={handleBuyNow}
                                        >
                                            Buy Now with PayPal
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="details-card compact">
                                <span className="label">Status</span>
                                <strong>{gift.status || 'available'}</strong>
                                {gift.status === 'reserved' && gift.reservedUntil && (
                                    <small className="muted">Until {new Date(gift.reservedUntil).toLocaleString()}</small>
                                )}
                            </div>
                            <div className="details-card compact">
                                <span className="label">Location</span>
                                <strong>{gift.city || 'Unknown city'}</strong>
                                <small className="muted">{gift.area || 'Area not specified'}</small>
                            </div>
                            <div className="details-card compact">
                                <span className="label">Date added</span>
                                <strong>{formatDate(gift.date_added)}</strong>
                            </div>
                        </div>
                        <div className="details-card">
                            <h3>Description</h3>
                            <p>{gift.description || 'No description provided.'}</p>
                        </div>
                    </div>
                </div>
                {actionMessage && <div className="alert alert-info mt-3">{actionMessage}</div>}
                {chatError && <div className="alert alert-danger mt-3">{chatError}</div>}
                <div className="details-grid">
                    {renderBuyerPanel()}
                    {renderSellerPanel()}
                    {pickupError && <div className="alert alert-danger">{pickupError}</div>}
                    {renderPickupLocation()}
                </div>
            </div>
            {chatModal.open && (
                <ChatModal
                    chatId={chatModal.chatId}
                    itemName={gift.name}
                    onClose={() => setChatModal({ open: false, chatId: null })}
                />
            )}
            {showPaymentModal && (
                <PaymentModal
                    item={{ id: gift.id, name: gift.name, price: Number(gift.price || 0) }}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                />
            )}
        </div>
    );
}

export default DetailsPage;
