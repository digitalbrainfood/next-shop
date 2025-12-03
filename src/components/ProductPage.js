import React, { useState } from 'react';
import { Star, ArrowLeft, Video } from 'lucide-react';
import StarRating from './StarRating';
import { mockReviews } from '../lib/mockData';

const ProductPage = ({ product, setView }) => {
    const [mainImage, setMainImage] = useState(product.images[0]);
    const reviews = mockReviews[product.id] || [];

    return (
        <div className="container mx-auto px-4 py-8">
            <button onClick={() => setView({ page: 'home' })} className="flex items-center text-blue-600 hover:underline mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to products
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                    <img src={mainImage} alt={product.name} className="w-full rounded-lg shadow-md mb-4" />
                    <div className="flex space-x-2">
                       {product.images.map(img => (
                           <img key={img} src={img} onClick={() => setMainImage(img)} className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${mainImage === img ? 'border-blue-500' : 'border-transparent'}`} />
                       ))}
                       {product.videoUrl && (
                           <div onClick={() => setMainImage(product.videoUrl)} className={`w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center cursor-pointer border-2 ${mainImage === product.videoUrl ? 'border-blue-500' : 'border-transparent'}`}>
                               <Video className="h-8 w-8 text-gray-600"/>
                           </div>
                       )}
                    </div>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                    <p className="text-lg text-gray-600 mt-1">{product.subtitle}</p>
                    <p className="text-md text-gray-500 mt-2">Sold by <span className="font-semibold text-blue-600">{product.vendor}</span></p>
                    <div className="my-4">
                        <StarRating rating={product.rating} reviewCount={product.reviewCount} />
                    </div>
                    <p className="text-4xl font-extrabold text-gray-900">${product.price.toFixed(2)}</p>
                    <p className="mt-6 text-gray-700 leading-relaxed">{product.longDescription}</p>
                    
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {product.tags.map(tag => (
                                <span key={tag} className="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">{tag}</span>
                            ))}
                        </div>
                    </div>

                    <button className="w-full mt-8 bg-blue-600 text-white py-3 rounded-full font-semibold text-lg hover:bg-blue-700 transition-colors">
                        Add to cart
                    </button>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Customer Reviews</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add Review Form */}
                    <div className="bg-white p-6 rounded-lg border">
                        <h3 className="font-semibold text-lg mb-4">Write a review</h3>
                        <div className="flex items-center space-x-1 mb-4">
                            {[...Array(5)].map((_, i) => <Star key={i} className="h-8 w-8 text-gray-300 cursor-pointer hover:text-yellow-400"/>)}
                        </div>
                        <textarea className="w-full p-2 border rounded-md" rows="4" placeholder="Share your thoughts..."></textarea>
                        <button className="mt-4 bg-gray-800 text-white py-2 px-6 rounded-full font-semibold hover:bg-gray-900 transition-colors">Submit Review</button>
                    </div>

                    {/* Existing Reviews */}
                    <div className="space-y-6">
                        {reviews.length > 0 ? reviews.map((review, index) => (
                            <div key={index} className="bg-white p-6 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold">{review.user}</h4>
                                    <StarRating rating={review.rating} />
                                </div>
                                <p className="text-gray-600 mt-2">{review.comment}</p>
                            </div>
                        )) : (
                            <div className="bg-white p-6 rounded-lg border text-center text-gray-500">
                                No reviews yet. Be the first!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;