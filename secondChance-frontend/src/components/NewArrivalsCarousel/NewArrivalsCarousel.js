import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import './NewArrivalsCarousel.css';

const NewArrivalsCarousel = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items`);
        if (!response.ok) {
          throw new Error('Unable to load new arrivals');
        }
        const data = await response.json();
        const sorted = [...data]
          .sort((a, b) => (b.date_added || 0) - (a.date_added || 0))
          .slice(0, 10);
        setItems(sorted);
      } catch (e) {
        setError(e.message);
      }
    };

    fetchNewArrivals();
  }, []);

  useEffect(() => {
    if (!autoScroll) return;
    const track = trackRef.current;
    if (!track) return;
    const interval = setInterval(() => {
      track.scrollBy({ left: 260, behavior: 'smooth' });
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 5) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [autoScroll]);

  const startDrag = (event) => {
    setAutoScroll(false);
    setIsDragging(true);
    const pageX = event.pageX || event.touches?.[0]?.pageX;
    setStartX(pageX - trackRef.current.offsetLeft);
    setScrollLeft(trackRef.current.scrollLeft);
  };

  const handleDrag = (event) => {
    if (!isDragging) return;
    const pageX = event.pageX || event.touches?.[0]?.pageX;
    event.preventDefault();
    const x = pageX - trackRef.current.offsetLeft;
    const walk = (x - startX) * 1.2;
    trackRef.current.scrollLeft = scrollLeft - walk;
  };

  const stopDrag = () => {
    setIsDragging(false);
    setTimeout(() => setAutoScroll(true), 3000);
  };

  const scrollByOffset = (offset) => {
    setAutoScroll(false);
    trackRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(() => setAutoScroll(true), 4000);
  };

  if (error || items.length === 0) {
    return null;
  }

  return (
    <section className="new-arrivals glass-panel mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 className="mb-1">New Arrivals</h3>
          <p className="text-muted mb-0">Fresh drops from the last few days.</p>
        </div>
        <div className="carousel-controls">
          <button onClick={() => scrollByOffset(-300)} aria-label="Scroll left">‹</button>
          <button onClick={() => scrollByOffset(300)} aria-label="Scroll right">›</button>
        </div>
      </div>
      <div
        className="carousel-track"
        ref={trackRef}
        onMouseDown={startDrag}
        onMouseLeave={stopDrag}
        onMouseUp={stopDrag}
        onMouseMove={handleDrag}
        onTouchStart={startDrag}
        onTouchMove={handleDrag}
        onTouchEnd={stopDrag}
      >
        {items.map((item) => (
          <div key={item.id} className="carousel-card" onClick={() => navigate(`/app/item/${item.id}`)}>
            <div className="carousel-image">
              {item.image ? (
                <img src={urlConfig.backendUrl + item.image} alt={item.name} />
              ) : (
                <span>No image</span>
              )}
            </div>
            <div className="carousel-body">
              <strong>{item.name}</strong>
              <small className="text-muted d-block">
                {item.category} · {item.condition}
              </small>
              <small className="text-highlight">
                Added {item.date_added ? new Date(item.date_added * 1000).toLocaleDateString() : 'recently'}
              </small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NewArrivalsCarousel;

