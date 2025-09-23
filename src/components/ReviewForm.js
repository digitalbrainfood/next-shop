"use client";

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { db } from '../lib/firebase'; // Import the centralized db instance
import { getFirestore, collection, addDoc, doc, updateDoc, getDocs, serverTimestamp } from "firebase/firestore";


const ReviewForm = ({ productId, user }) => {
    const [ratings, setRatings] = useState({ attention: 0, persuasion: 0, brandedRecall: 0, liking: 0 });
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const criteria = ['attention', 'persuasion', 'brandedRecall', 'liking'];

    const handleRatingChange = (criterion, value) => {
        setRatings(prev => ({ ...prev, [criterion]: value }));
    };
    
    // This function re-calculates the product's average rating after a new review is submitted.
    const updateProductRatingAfterSubmission = async () => {
         const reviewsRef = collection(db, "products", productId, "reviews");
         const reviewsSnapshot = await getDocs(reviewsRef); // re-fetch to ensure we have the latest data
         const newReviewCount = reviewsSnapshot.size;
         let totalRating = 0;
         reviewsSnapshot.forEach(doc => {
            totalRating += doc.data().overallRating;
         });
         const newAverageRating = newReviewCount > 0 ? totalRating / newReviewCount : 0;
         const productRef = doc(db, "products", productId);
         await updateDoc(productRef, {
            rating: newAverageRating,
            reviewCount: newReviewCount
        });
    }

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (Object.values(ratings).some(r => r === 0) || !text) {
            setError('Please provide a rating for all criteria and write a review.');
            return;
        }

        const overallRating = Object.values(ratings).reduce((a, b) => a + b, 0) / criteria.length;

        try {
            const reviewsRef = collection(db, "products", productId, "reviews");
            await addDoc(reviewsRef, {
                userId: user.uid,
                username: user.email.split('@')[0],
                ...ratings,
                overallRating,
                text,
                createdAt: serverTimestamp()
            });
            
            await updateProductRatingAfterSubmission();

            setSuccess('Thank you for your review!');
            setRatings({ attention: 0, persuasion: 0, brandedRecall: 0, liking: 0 });
            setText('');
        } catch (err) {
            setError('Failed to submit review. ' + err.message);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Leave a Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
                {criteria.map(criterion => (
                    <div key={criterion} className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <span className="capitalize text-gray-700 mb-2 sm:mb-0">{criterion.replace(/([A-Z])/g, ' $1')}</span>
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-6 w-6 cursor-pointer ${i < ratings[criterion] ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    onClick={() => handleRatingChange(criterion, i + 1)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                <div>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} rows="4" placeholder="Share your thoughts..." className="w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                {success && <p className="text-sm text-green-500 text-center">{success}</p>}
                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700">Submit Review</button>
            </form>
        </div>
    );
};

export default ReviewForm;