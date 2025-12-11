import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { urlConfig } from "../../config"
import { useAppContext } from '../../context/AppContext';
import ChatModal from '../ChatModal/ChatModal';

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
    const [deliveryMethod, setDeliveryMethod] = useState('pickup'); // 'pickup' or 'shipping'
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerCity, setCustomerCity] = useState('');
    const [customerArea, setCustomerArea] = useState('');
    const [shippingCost, setShippingCost] = useState(0);
    const [distance, setDistance] = useState(0);
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

    // קבלת קואורדינטות משם עיר (פשטני - בייצור יש להשתמש ב-API גאוקודינג)
    const getCityCoordinates = (cityName) => {
        // קואורדינטות ערים מפושטות לישראל
        const cityCoords = {
            'Jerusalem': [31.7683, 35.2137],
            'Tel Aviv-Yafo': [32.0853, 34.7818],
            'Haifa': [32.7940, 34.9896],
            'Rishon LeZion': [31.9730, 34.7925],
            'Petah Tikva': [32.0871, 34.8878],
            'Ashdod': [31.8044, 34.6553],
            'Netanya': [32.3320, 34.8597],
            'Beer Sheva': [31.2457, 34.7925],
            'Holon': [32.0103, 34.7795],
            'Bnei Brak': [32.0807, 34.8338],
            'Rehovot': [31.8947, 34.8093],
            'Bat Yam': [32.0238, 34.7519],
            'Herzliya': [32.1624, 34.8447],
            'Kfar Saba': [32.1719, 34.9069],
            'Raanana': [32.1842, 34.8718],
            'Ramat Gan': [32.0822, 34.8103],
            'Modiin': [31.8986, 35.0069],
            'Hadera': [32.4340, 34.9197],
            'Ashkelon': [31.6688, 34.5743],
            'Nazareth': [32.6996, 35.3035],
            'Tiberias': [32.7959, 35.5310],
            'Eilat': [29.5577, 34.9519],
            'Safed': [32.9646, 35.4960],
            'Kiryat Ono': [32.0622, 34.8563],
            'Givatayim': [32.0702, 34.8083]
        };
        return cityCoords[cityName] || null;
    };

    // חישוב עלות משלוח
    const calculateShippingCost = () => {
        if (!gift?.enableShipping || deliveryMethod !== 'shipping') {
            setShippingCost(0);
            setDistance(0);
            return;
        }

        if (!customerCity || !gift.pickupCity) {
            setShippingCost(0);
            setDistance(0);
            return;
        }

        const pickupCoords = getCityCoordinates(gift.pickupCity);
        const customerCoords = getCityCoordinates(customerCity);

        if (!pickupCoords || !customerCoords) {
            setShippingCost(0);
            setDistance(0);
            return;
        }

        const dist = calculateDistance(
            pickupCoords[0], pickupCoords[1],
            customerCoords[0], customerCoords[1]
        );
        setDistance(dist);

        const basePrice = gift.shippingBasePrice || 10;
        const pricePerKm = gift.shippingPricePerKm || 2;
        const cost = basePrice + (dist * pricePerKm);
        setShippingCost(cost);
    };

    useEffect(() => {
        if (gift) {
            calculateShippingCost();
        }
    }, [deliveryMethod, customerCity, gift?.enableShipping, gift?.pickupCity, gift?.shippingBasePrice, gift?.shippingPricePerKm, gift]);

    const handleBackClick = () => {
        navigate(-1); // חזרה לעמוד הקודם
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
                                {gift.enableShipping && gift.status === 'available' && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}>
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                                                <input
                                                    type="radio"
                                                    name="deliveryMethod"
                                                    value="pickup"
                                                    checked={deliveryMethod === 'pickup'}
                                                    onChange={(e) => setDeliveryMethod(e.target.value)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <span>Pickup</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="deliveryMethod"
                                                    value="shipping"
                                                    checked={deliveryMethod === 'shipping'}
                                                    onChange={(e) => setDeliveryMethod(e.target.value)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <span>Shipping</span>
                                            </label>
                                        </div>
                                        {deliveryMethod === 'shipping' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Your address"
                                                    value={customerAddress}
                                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.6)' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Your city"
                                                    value={customerCity}
                                                    onChange={(e) => setCustomerCity(e.target.value)}
                                                    list="customer-city-options"
                                                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.6)' }}
                                                />
                                                <datalist id="customer-city-options">
                                                    {cityOptions.map((option) => (
                                                        <option key={option} value={option} />
                                                    ))}
                                                </datalist>
                                                <input
                                                    type="text"
                                                    placeholder="Your area/neighborhood"
                                                    value={customerArea}
                                                    onChange={(e) => setCustomerArea(e.target.value)}
                                                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(203, 213, 225, 0.6)' }}
                                                />
                                                {distance > 0 && (
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                                                        Distance: {distance.toFixed(1)} km
                                                    </div>
                                                )}
                                                {shippingCost > 0 && (
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '600', marginTop: '0.5rem' }}>
                                                        Shipping: ${shippingCost.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {(deliveryMethod === 'pickup' ? Number(gift.price || 0) : Number(gift.price || 0) + shippingCost) > 0 && (
                                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                                                    Total: ${(deliveryMethod === 'pickup' ? Number(gift.price || 0) : Number(gift.price || 0) + shippingCost).toFixed(2)}
                                                </div>
                                                {deliveryMethod === 'shipping' && customerCity && (
                                                    <button 
                                                        className="btn btn-modern-secondary btn-sm"
                                                        style={{ 
                                                            background: 'linear-gradient(135deg, #0070ba 0%, #003087 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            width: '100%',
                                                            marginTop: '0.5rem'
                                                        }}
                                                        onClick={() => {
                                                            // PayPal integration would go here
                                                            alert('PayPal payment integration - Total: $' + (Number(gift.price || 0) + shippingCost).toFixed(2));
                                                        }}
                                                    >
                                                        Pay with PayPal
                                                    </button>
                                                )}
                                            </div>
                                        )}
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
        </div>
    );
}

export default DetailsPage;
