import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { urlConfig } from '../../config';
import './PaymentStatus.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [item, setItem] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('auth-token');
    if (!sessionId) {
      setError('Missing checkout session identifier.');
      setLoading(false);
      return;
    }
    if (!token) {
      setError('Please sign in again to complete your purchase confirmation.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(
          `${urlConfig.backendUrl}/api/payments/verify-session?session_id=${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Unable to verify payment.');
        }
        const data = await response.json();
        setOrder(data.order);
        setItem(data.item);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [sessionId]);

  const renderBody = () => {
    if (loading) {
      return <p className="text-muted">Verifying payment...</p>;
    }
    if (error) {
      return (
        <div className="alert alert-danger">
          {error}
          <div className="mt-3">
            <Link to="/app" className="btn btn-primary">
              Back to catalog
            </Link>
          </div>
        </div>
      );
    }
    return (
      <>
        <p className="lead">Payment successful! Your receipt will arrive via Stripe email.</p>
        {item && (
          <div className="payment-card glass-panel mb-3">
            <h4>{item.name}</h4>
            <p className="text-muted mb-1">{item.category}</p>
            <p>
              <strong>Status:</strong> {item.status}
            </p>
            {order && (
              <p>
                <strong>Paid:</strong> ${Number(order.amount || 0).toFixed(2)} {order.currency?.toUpperCase()}
              </p>
            )}
          </div>
        )}
        {order && (
          <div className="payment-details glass-panel">
            <h5>Order details</h5>
            <ul>
              <li>
                <span>Order ID:</span>
                <code>{order.id}</code>
              </li>
              <li>
                <span>Provider session:</span>
                <code>{order.providerSessionId}</code>
              </li>
              <li>
                <span>Payment status:</span> {order.paymentStatus}
              </li>
            </ul>
          </div>
        )}
        <div className="mt-4 d-flex gap-2 flex-wrap">
          <Link to="/app" className="btn btn-primary">
            Continue browsing
          </Link>
          {item && (
            <Link to={`/app/item/${item.id}`} className="btn btn-outline-secondary">
              View item
            </Link>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="page-shell">
      <div className="glass-panel payment-status-panel">
        <h2 className="mb-3">Payment confirmation</h2>
        {renderBody()}
      </div>
    </div>
  );
};

export default PaymentSuccess;

