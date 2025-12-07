import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { urlConfig } from "../../config"
import { useAppContext } from '../../context/AppContext';
import ChatModal from '../ChatModal/ChatModal';

import './DetailsPage.css';

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
    const [sellerStats, setSellerStats] = useState(null);
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
        if (gift && gift.ownerId) {
            fetchSellerStats(gift.ownerId);
        }
    }, [gift]);

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

    const fetchSellerStats = async (ownerId) => {
        try {
            const token = sessionStorage.getItem('auth-token');
            if (!token || !ownerId) {
                return;
            }
            const response = await fetch(`${urlConfig.backendUrl}/api/user-stats/${ownerId}/public`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSellerStats(data);
            }
        } catch (err) {
            // ignore
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
        return date.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
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

    const canViewFullPickupDetails =
        secureData?.role === 'seller' || secureData?.approvalStatus === 'approved';

    const renderPickupLocation = () => {
        const location = secureData?.pickupLocations?.[0];
        if (!location && !(gift.city || gift.area || gift.mapUrl)) {
            return null;
        }
        const showAddress = location && canViewFullPickupDetails;
        return (
            <div className="glass-panel mt-4">
                <h3 className="mb-3">Pickup location</h3>
                {location ? (
                    <>
                        <p><strong>Label:</strong> {location.label}</p>
                        <p><strong>City:</strong> {location.city}</p>
                        {location.area && <p><strong>Area:</strong> {location.area}</p>}
                        {showAddress ? (
                            <>
                                <p><strong>Address:</strong> {location.address}</p>
                                {typeof location.lat === 'number' && typeof location.lng === 'number' && (
                                    <p><strong>Coordinates:</strong> {location.lat}, {location.lng}</p>
                                )}
                            </>
                        ) : (
                            <p className="text-muted">Full address unlocks once the seller approves you.</p>
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
                                onClick={() => openChat()}
                            >
                                Message seller to buy
                            </button>
                        )}
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
                        {sellerStats?.sellerLevelLabel && (
                            <p><strong>Seller level:</strong> {sellerStats.sellerLevelLabel}</p>
                        )}
                    </div>
                </div>
            </div>
            {actionMessage && <div className="alert alert-info mt-3">{actionMessage}</div>}
            {chatError && <div className="alert alert-danger mt-3">{chatError}</div>}
            {renderBuyerPanel()}
            {renderSellerPanel()}
            {pickupError && <div className="alert alert-danger">{pickupError}</div>}
            {renderPickupLocation()}
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
