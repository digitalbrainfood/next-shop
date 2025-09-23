import React from 'react';
import StarRating from './StarRating';

const ProductCard = ({ product, setView }) => (
  <div
    className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer"
    onClick={() => setView({ page: 'product', id: product.id })}
  >
    <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
    <div className="p-4">
      <p className="text-sm text-gray-500">{product.vendor}</p>
      <h3 className="font-semibold text-gray-800 truncate mt-1">{product.name}</h3>
      <p className="text-sm text-gray-600 truncate">{product.subtitle}</p>
      <div className="mt-2">
        <StarRating rating={product.rating} reviewCount={product.reviewCount} />
      </div>
      <p className="text-xl font-bold text-gray-900 mt-2">${product.price.toFixed(2)}</p>
      <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors">
        Add to cart
      </button>
    </div>
  </div>
);

export default ProductCard;