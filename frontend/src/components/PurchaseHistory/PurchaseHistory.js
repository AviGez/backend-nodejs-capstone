import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import './PurchaseHistory.css';

function PurchaseHistory() {
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'sales'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('auth-token');
            
            const [purchasesRes, salesRes] = await Promise.all([
                fetch(`${urlConfig.backendUrl}/api/payments/my-purchases`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${urlConfig.backendUrl}/api/payments/my-sales`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (purchasesRes.ok) {
                const purchasesData = await purchasesRes.json();
                setPurchases(purchasesData);
            }

            if (salesRes.ok) {
                const salesData = await salesRes.json();
                setSales(salesData);
            }

            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            pending: 'status-badge-pending',
            completed: 'status-badge-completed',
            cancelled: 'status-badge-cancelled',
        };
        return (
            <span className={`status-badge ${statusColors[status]}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="purchase-history-page">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="purchase-history-page">
                <div className="error">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="purchase-history-page">
            <div className="purchase-history-header">
                <h1>Transaction History</h1>
                <button className="btn-back" onClick={() => navigate(-1)}>
                    ← Back
                </button>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'purchases' ? 'active' : ''}`}
                    onClick={() => setActiveTab('purchases')}
                >
                    My Purchases ({purchases.length})
                </button>
                <button
                    className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sales')}
                >
                    My Sales ({sales.length})
                </button>
            </div>

            <div className="transactions-container">
                {activeTab === 'purchases' ? (
                    purchases.length > 0 ? (
                        <div className="transactions-list">
                            {purchases.map((purchase) => (
                                <div key={purchase._id} className="transaction-card">
                                    <div className="transaction-header">
                                        <span className="order-id">Order #{purchase.orderId}</span>
                                        {getStatusBadge(purchase.status)}
                                    </div>
                                    <div className="transaction-body">
                                        <div className="transaction-detail">
                                            <span className="label">Item ID:</span>
                                            <span className="value">{purchase.itemId}</span>
                                        </div>
                                        <div className="transaction-detail">
                                            <span className="label">Amount:</span>
                                            <span className="value amount">${purchase.amount.toFixed(2)}</span>
                                        </div>
                                        {/* delivery/shipping removed */}
                                        <div className="transaction-detail">
                                            <span className="label">Date:</span>
                                            <span className="value">{formatDate(purchase.createdAt)}</span>
                                        </div>
                                        {purchase.completedAt && (
                                            <div className="transaction-detail">
                                                <span className="label">Completed:</span>
                                                <span className="value">{formatDate(purchase.completedAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No purchases yet</p>
                        </div>
                    )
                ) : (
                    sales.length > 0 ? (
                        <div className="transactions-list">
                            {sales.map((sale) => (
                                <div key={sale._id} className="transaction-card">
                                    <div className="transaction-header">
                                        <span className="order-id">Order #{sale.orderId}</span>
                                        {getStatusBadge(sale.status)}
                                    </div>
                                    <div className="transaction-body">
                                        <div className="transaction-detail">
                                            <span className="label">Item ID:</span>
                                            <span className="value">{sale.itemId}</span>
                                        </div>
                                        <div className="transaction-detail">
                                            <span className="label">Amount:</span>
                                            <span className="value amount">${sale.amount.toFixed(2)}</span>
                                        </div>
                                        {/* delivery/shipping removed */}
                                        <div className="transaction-detail">
                                            <span className="label">Date:</span>
                                            <span className="value">{formatDate(sale.createdAt)}</span>
                                        </div>
                                        {sale.completedAt && (
                                            <div className="transaction-detail">
                                                <span className="label">Completed:</span>
                                                <span className="value">{formatDate(sale.completedAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No sales yet</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default PurchaseHistory;
