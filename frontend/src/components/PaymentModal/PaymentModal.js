import React, { useState, useEffect } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { urlConfig } from '../../config';
import './PaymentModal.css';

// רכיב לביצוע תשלום דרך PayPal (במצב סימולציה)
function PaymentModal({ item, onSuccess, onCancel }) {
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [paypalClientId, setPaypalClientId] = useState(undefined);
    const [loadingPaypalConfig, setLoadingPaypalConfig] = useState(true);

    const handleCreateOrder = async () => {
        try {
            setError('');
            setProcessing(true);
            
            const token = sessionStorage.getItem('auth-token');
            const response = await fetch(`${urlConfig.backendUrl}/api/payments/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    itemId: item.id,
                    amount: item.price,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create order');
            }

            const data = await response.json();
            return data.orderId;
        } catch (err) {
            setError(err.message);
            setProcessing(false);
            throw err;
        }
    };

    const handleSimulatedCapture = async (orderId) => {
        // call capture-order to finish simulated/local order
        const token = sessionStorage.getItem('auth-token');
        const resp = await fetch(`${urlConfig.backendUrl}/api/payments/capture-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId }),
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to capture simulated order');
        }

        return await resp.json();
    };

    const handleApprove = async (data) => {
        try {
            setProcessing(true);
            const token = sessionStorage.getItem('auth-token');
            
            const response = await fetch(`${urlConfig.backendUrl}/api/payments/capture-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    orderId: data.orderID,
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to capture payment');
            }

            const result = await response.json();
            setProcessing(false);
            onSuccess(result);
        } catch (err) {
            setError(err.message);
            setProcessing(false);
        }
    };

    const handleError = (err) => {
        setError('An error occurred with PayPal. Please try again.');
        console.error('PayPal error:', err);
        setProcessing(false);
    };

    const handleCancel = () => {
        setProcessing(false);
        onCancel();
    };

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoadingPaypalConfig(true);
                const res = await fetch(`${urlConfig.backendUrl}/api/payments/paypal-config`);
                if (!res.ok) throw new Error('Failed to fetch PayPal config');
                const data = await res.json();
                setPaypalClientId(data.clientId || null);
            } catch (err) {
                console.error('Error fetching PayPal config:', err);
                setPaypalClientId(null);
            } finally {
                setLoadingPaypalConfig(false);
            }
        };

        fetchConfig();
    }, []);

    // Pay with balance removed — using PayPal Sandbox instead

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal">
                <div className="payment-modal-header">
                    <h2>Complete Payment</h2>
                    <button className="payment-modal-close" onClick={handleCancel}>×</button>
                </div>
                
                <div className="payment-modal-body">
                    <div className="payment-item-summary">
                        <h3>{item.name}</h3>
                        <div className="payment-details">
                            <div className="payment-detail-row">
                                <span>Price:</span>
                                <span className="payment-amount">${item.price}</span>
                            </div>
                            {/* Delivery/shipping removed */}
                        </div>
                    </div>

                    {error && <div className="payment-error">{error}</div>}
                    
                    {processing && <div className="payment-processing">Processing payment...</div>}

                    <div className="payment-buttons-container">
                        {loadingPaypalConfig ? (
                            <div>Loading payment methods...</div>
                        ) : paypalClientId ? (
                            <PayPalScriptProvider
                                options={{
                                    'client-id': paypalClientId,
                                    currency: 'USD',
                                    intent: 'capture',
                                }}
                            >
                                <PayPalButtons
                                    style={{ layout: 'vertical' }}
                                    disabled={processing}
                                    createOrder={handleCreateOrder}
                                    onApprove={handleApprove}
                                    onError={handleError}
                                    onCancel={handleCancel}
                                />
                            </PayPalScriptProvider>
                        ) : (
                            <div>
                                <button
                                    className="pay-simulated"
                                    onClick={async () => {
                                        try {
                                            setProcessing(true);
                                            const orderId = await handleCreateOrder();
                                            const result = await handleSimulatedCapture(orderId);
                                            setProcessing(false);
                                            onSuccess(result);
                                        } catch (err) {
                                            setError(err.message);
                                            setProcessing(false);
                                        }
                                    }}
                                    disabled={processing}
                                >
                                    Pay (simulate)
                                </button>
                            </div>
                        )}
                    </div>

                    

                    <div className="payment-sandbox-notice">
                        <strong>Test Mode:</strong> This is a simulated payment. No real money will be charged.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentModal;
