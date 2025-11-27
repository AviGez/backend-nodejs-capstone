import React from 'react';
import './RatingStars.css';

const RatingStars = ({
  value = 0,
  count = 0,
  onRate,
  readOnly = false,
  size = 'md',
  showCount = true,
}) => {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (star) => {
    if (readOnly || !onRate) return;
    onRate(star);
  };

  const renderStar = (star) => {
    const isActive = value >= star - 0.1;
    return (
      <button
        key={star}
        type="button"
        className={`rating-star ${isActive ? 'active' : ''}`}
        onClick={() => handleClick(star)}
        title={`${star} star${star > 1 ? 's' : ''}`}
        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
      >
        ★
      </button>
    );
  };

  return (
    <div className={`rating-stars ${readOnly ? 'read-only' : ''} size-${size}`}>
      {stars.map(renderStar)}
      {showCount && (
        <span className="rating-count">
          {count > 0 ? `${value.toFixed(1)} • ${count} rating${count === 1 ? '' : 's'}` : 'No ratings yet'}
        </span>
      )}
    </div>
  );
};

export default RatingStars;

