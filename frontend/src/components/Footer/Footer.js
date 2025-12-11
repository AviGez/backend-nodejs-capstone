import React from 'react';
import './Footer.css';

const Footer = () => (
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
          <li><a href="/app/reservations">My reservations</a></li>
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
        <form className="footer-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Email address" />
          <button type="submit">Subscribe</button>
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

export default Footer;

