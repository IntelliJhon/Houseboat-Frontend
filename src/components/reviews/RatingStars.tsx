import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showScore?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showScore = false,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const starSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const currentRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, idx) => {
        const starValue = idx + 1;
        const isFull = currentRating >= starValue;
        const isHalf = currentRating > idx && currentRating < starValue;

        return (
          <button
            key={idx}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRatingChange && onRatingChange(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(null)}
            className={`${interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'} focus:outline-none`}
          >
            <Star
              className={`${starSizeClasses[size]} ${
                isFull
                  ? 'fill-amber-400 text-amber-400'
                  : isHalf
                  ? 'fill-amber-200 text-amber-400'
                  : 'fill-slate-100 text-slate-300'
              }`}
            />
          </button>
        );
      })}

      {showScore && (
        <span className="ml-1 text-xs font-bold text-slate-800">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};
