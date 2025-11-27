import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { urlConfig } from "../../config"
import { useAppContext } from '../../context/AppContext';
import RatingStars from '../RatingStars/RatingStars';
import ChatModal from '../ChatModal/ChatModal';
import { getStripe } from '../../utils/stripeClient';

import './DetailsPage.css';

function DetailsPage() {
    const navigate = useNavigate();
    const { itemId } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRating, setUserRating] = useState(null);
    const [ratingMessage, setRatingMessage] = useState('');
    const [secureData, setSecureData] = useState(null);
    const [actionMessage, setActionMessage] = useState('');
    const [chatModal, setChatModal] = useState({ open: false, chatId: null });
    const [chatError, setChatError] = useState('');
    const [buying, setBuying] = useState(false);
    const [buyError, setBuyError] = useState('');
    const { isLoggedIn, currentUserId } = useAppContext();

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/app/login')
        }

        // Scroll to top on component mount
        window.scrollTo(0, 0);

        // get the gift to be rendered on the details page
        const fetchItem = async () => {
            try {
                const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/${itemId}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setGift(data);
                const existing = data?.ratings?.find((rating) => rating.userId === currentUserId);
                setUserRating(existing?.value || null);
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

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
        return date.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const handleRate = async (value) => {
        if (!isLoggedIn) {
            navigate('/app/login');
            return;
        }
        try {
            const token = sessionStorage.getItem('auth-token');
            const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/${gift.id}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ value }),
            });
            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                throw new Error(errJson.error || 'Unable to submit rating');
            }
            const updated = await response.json();
            setGift(updated);
            setUserRating(value);
            setRatingMessage('Thanks! Your rating was saved.');
            setTimeout(() => setRatingMessage(''), 2500);
        } catch (e) {
            setRatingMessage(e.message);
            setTimeout(() => setRatingMessage(''), 3000);
        }
    };

    const handleBackClick = () => {
        navigate(-1); // Navigates back to the previous page
    };

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

    const handleBuyNow = async () => {
        if (!gift || Number(gift.price || 0) <= 0) {
            return;
        }
        if (!isLoggedIn) {
            navigate('/app/login');
            return;
        }
        setBuying(true);
        setBuyError('');
        const token = sessionStorage.getItem('auth-token');
        try {
            const response = await fetch(`${urlConfig.backendUrl}/api/payments/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ itemId: gift.id }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Unable to start checkout');
            }
            const data = await response.json();
            if (data.sessionId) {
                const stripe = await getStripe();
                if (stripe) {
                    const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
                    if (error) {
                        throw new Error(error.message);
                    }
                    return;
                }
            }
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
                return;
            }
            throw new Error('Unexpected Stripe response. Missing session URL.');
        } catch (e) {
            setBuyError(e.message);
            setTimeout(() => setBuyError(''), 6000);
        } finally {
            setBuying(false);
        }
    };

    const renderBuyerPanel = () => {
        if (!secureData || secureData.role === 'seller') {
            return null;
        }
        return (
            <div className="glass-panel mt-4">
                <h3 className="mb-2">Pickup approval</h3>
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

    const renderSellerPanel = () => {
        if (secureData?.role !== 'seller') {
            return null;
        }
        return (
            <div className="glass-panel mt-4">
                <h3 className="mb-3">Buyers awaiting pickup</h3>
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

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!gift) return <div className="container mt-5">Gift not found</div>;

    return (
        <div className="page-shell">
            <button className="btn btn-ghost-modern mb-4" onClick={handleBackClick}>← Back</button>
            <div className="glass-panel mb-4">
                <div className="image-placeholder-large mb-4">
                    {gift.image ? (
                        <img src={urlConfig.backendUrl+gift.image} alt={gift.name} className="product-image-large" />
                    ) : (
                        <div className="no-image-available-large">No Image Available</div>
                    )}
                </div>
                <div className="d-flex flex-column flex-lg-row justify-content-between gap-4">
                    <div>
                        <h2 className="details-title">{gift.name}</h2>
                        <p className="text-muted">Category · {gift.category}</p>
                        <p><strong>Price:</strong> {gift.status === 'sold' ? 'Sold' : (gift.price && Number(gift.price) > 0 ? `$${Number(gift.price).toFixed(2)}` : 'Free')}</p>
                        {gift.status === 'available' && Number(gift.price || 0) > 0 && (
                            <button
                                className="btn btn-modern-secondary mt-2"
                                onClick={handleBuyNow}
                                disabled={buying}
                            >
                                {buying ? 'Redirecting…' : 'Buy now'}
                            </button>
                        )}
                        {buyError && <div className="alert alert-danger mt-3">{buyError}</div>}
                        <p><strong>Condition:</strong> {gift.condition}</p>
                        <p><strong>Status:</strong> {gift.status || 'available'}</p>
                        {gift.status === 'reserved' && gift.reservedUntil && (
                            <p><strong>Reserved Until:</strong> {new Date(gift.reservedUntil).toLocaleString()}</p>
                        )}
                        {(gift.city || gift.area) && (
                            <p>
                                <strong>Location:</strong> {gift.city || 'Unknown city'}, {gift.area || 'Area not specified'}
                            </p>
                        )}
                        {gift.mapUrl && (
                            <p>
                                <a href={gift.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-modern-secondary btn-sm">
                                    Open in Maps
                                </a>
                            </p>
                        )}
                        <p><strong>Date Added:</strong> {formatDate(gift.date_added)}</p>
                        <p><strong>Description:</strong> {gift.description}</p>
                    </div>
                    <div className="glass-panel" style={{ flex: '0 0 320px' }}>
                        <h4 className="mb-2">Community Rating</h4>
                        <RatingStars
                            value={gift.averageRating || 0}
                            count={gift.ratingCount || 0}
                            readOnly
                            size="lg"
                        />
                        {isLoggedIn && (
                            <div className="mt-3">
                                <p className="text-muted mb-1">Tap to rate:</p>
                                <RatingStars
                                    value={userRating || 0}
                                    count={0}
                                    onRate={handleRate}
                                    showCount={false}
                                    size="lg"
                                />
                                {ratingMessage && <small className="text-info d-block mt-2">{ratingMessage}</small>}
                            </div>
                        )}
                        {!isLoggedIn && (
                            <p className="text-muted mt-3">Login to rate this item.</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="glass-panel mt-4">
                <h3 className="mb-3">Comments</h3>
                {gift.comments && gift.comments.length > 0 ? (
                    gift.comments.map((comment, index) => (
                        <div key={index} className="glass-panel mb-3" style={{ background: 'rgba(15,23,42,0.55)' }}>
                            <p className="comment-author"><strong>{comment.author}:</strong></p>
                            <p className="comment-text">{comment.comment}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-muted">No comments yet.</p>
                )}
            </div>
            {actionMessage && <div className="alert alert-info mt-3">{actionMessage}</div>}
            {chatError && <div className="alert alert-danger mt-3">{chatError}</div>}
            {renderBuyerPanel()}
            {renderSellerPanel()}
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
