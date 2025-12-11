import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { urlConfig } from '../../config';
import './NewArrivalsCarousel.css';
// קומפוננטת קרוסלת פריטים חדשים
const NewArrivalsCarousel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skeletonCount, setSkeletonCount] = useState(6);
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const navigate = useNavigate();
// פונקציה לטעינת הפריטים החדשים מהשרת
  useEffect(() => {
    const fetchNewArrivals = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items/carousel`);
        if (!response.ok) {
          throw new Error('Unable to load new arrivals');
        }
        const data = await response.json();
        const itemsArray = Array.isArray(data) ? data : [];
        setItems(itemsArray);
        // Update skeleton count to match actual items count
        if (itemsArray.length > 0) {
          setSkeletonCount(itemsArray.length);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
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
// פונקציות לטיפול בגרירה וגלילה של הקרוסלה
  const startDrag = (event) => {
    setAutoScroll(false);
    setIsDragging(true);
    const pageX = event.pageX || event.touches?.[0]?.pageX;
    setStartX(pageX - trackRef.current.offsetLeft);
    setScrollLeft(trackRef.current.scrollLeft);
  };
// פונקציה לטיפול בגרירה
  const handleDrag = (event) => {
    if (!isDragging) return;
    const pageX = event.pageX || event.touches?.[0]?.pageX;
    event.preventDefault();
    const x = pageX - trackRef.current.offsetLeft;
    const walk = (x - startX) * 1.2;
    trackRef.current.scrollLeft = scrollLeft - walk;
  };
// פונקציה לסיום הגרירה
  const stopDrag = () => {
    setIsDragging(false);
    setTimeout(() => setAutoScroll(true), 3000);
  };
// פונקציה לגלילה על ידי לחצני הבקרה
  const scrollByOffset = (offset) => {
    setAutoScroll(false);
    trackRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(() => setAutoScroll(true), 4000);
  };

  if (error) {
    return null;
  }

  return (
    <section className="new-arrivals glass-panel mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 className="mb-1">New Arrivals</h3>
          <p className="text-muted mb-0">Featured for one week, rotating constantly.</p>
        </div>
        {!loading && items.length > 0 && (
        <div className="carousel-controls">
          <button onClick={() => scrollByOffset(-300)} aria-label="Scroll left">‹</button>
          <button onClick={() => scrollByOffset(300)} aria-label="Scroll right">›</button>
        </div>
        )}
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
        {loading ? (
          // Skeleton loaders - show same number as will be rendered
          Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={`skeleton-${index}`} className="carousel-card carousel-skeleton">
              <div className="carousel-image skeleton-image">
                <div className="skeleton-shimmer"></div>
              </div>
              <div className="carousel-body">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-subtitle"></div>
                <div className="skeleton-line skeleton-price"></div>
                <div className="skeleton-line skeleton-date"></div>
              </div>
            </div>
          ))
        ) : (
          items.map((item) => (
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
              <small className="d-block">
                {Number(item.price || 0) > 0 ? `$${Number(item.price).toFixed(2)}` : 'Free'}
              </small>
              <small className="text-highlight">
                Added{' '}
                {item.date_added
                  ? new Date(item.date_added * 1000)
                      .toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })
                  : 'recently'}
              </small>
            </div>
          </div>
          ))
        )}
      </div>
    </section>
  );
};

export default NewArrivalsCarousel;

