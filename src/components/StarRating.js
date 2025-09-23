import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating, reviewCount }) => (
  <div className="flex items-center">
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
    {reviewCount && <span className="ml-2 text-sm text-gray-500">({reviewCount})</span>}
  </div>
);

export default StarRating;