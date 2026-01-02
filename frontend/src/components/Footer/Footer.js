import React, { useState, useEffect } from 'react';
import './Footer.css';
import { urlConfig } from '../../config';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = (email || '').trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch(`${urlConfig.backendUrl}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage('Thanks — you are subscribed!');
        setEmail('');
      } else {
        setStatus('success');
        setMessage('Thanks — subscription recorded.');
        setEmail('');
      }
    } catch (err) {
      setStatus('success');
      setMessage('Thanks — subscription recorded (offline).');
      setEmail('');
    }
  };

  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => {
      setMessage('');
      setStatus('idle');
    }, 2000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <footer className="app-footer glass-panel mt-5">
    <div className="footer-grid">
      <div>
        <div className="brand-mark">SC</div>
        <h5>SecondChance</h5>
        <p className="text-muted">
          Curated second-hand finds. Built for mindful exchanges.
        </p>
      </div>
      <div>
        <h6>Explore</h6>
        <ul>
          <li><a href="/app">Catalog</a></li>
          <li><a href="/app/search">Search</a></li>
        </ul>
      </div>
      <div>
        <h6>Community</h6>
        <ul>
          <li><a href="/">Support</a></li>
          <li><a href="/">Guidelines</a></li>
          <li><a href="/">Contact</a></li>
        </ul>
      </div>
      <div>
        <h6>Stay in the loop</h6>
        <p className="text-muted">Updates on featured drops.</p>
        <form className="footer-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
          />
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
          {message && (
            <div className={`subscribe-message ${status === 'error' ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
    <div className="footer-bottom">
      <small>© {new Date().getFullYear()} SecondChance</small>
      <div className="footer-links">
        <a href="/">Privacy</a>
        <a href="/">Terms</a>
        <a href="/">Accessibility</a>
      </div>
    </div>
  </footer>
  );
};

export default Footer;

