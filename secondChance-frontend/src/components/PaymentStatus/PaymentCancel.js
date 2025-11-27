import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './PaymentStatus.css';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('item_id');

  return (
    <div className="page-shell">
      <div className="glass-panel payment-status-panel">
        <h2>Payment canceled</h2>
        <p className="text-muted">
          The checkout session was canceled. Your card was not charged.
        </p>
        <div className="mt-4 d-flex flex-column flex-sm-row gap-2">
          <Link to="/app" className="btn btn-primary">
            Back to catalog
          </Link>
          {itemId && (
            <Link to={`/app/item/${itemId}`} className="btn btn-outline-secondary">
              Return to item
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;

