"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Store, UserCircle, Star, ArrowLeft, PlusCircle, Video, Trash2, Edit, LogOut, ShieldCheck, GripVertical, ChevronDown, ChevronUp, X, Eye, Search, UserMinus, Users, FolderPlus, EyeOff, RefreshCw, Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import RichTextEditor from '../components/RichTextEditor';
import TagManager from '../components/TagManager';
import RTBImageUploader from '../components/RTBImageUploader';
import { RTB_LABELS, AVATAR_RTB_LABELS, TAG_CONFIG, TAG_CATEGORIES, isViewer as checkIsViewer, isSuperAdmin as checkIsSuperAdmin } from '../lib/constants';
import { auth, db, storage, functions, SUPER_ADMIN_UID } from '../lib/firebase';
import { onIdTokenChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp, getDocs, writeBatch, orderBy, setDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { httpsCallable } from "firebase/functions";


// --- UI COMPONENTS ---

const StarRating = ({ rating, reviewCount }) => (
    <div className="flex items-center">
        <div className="flex items-center">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />))}</div>
        {reviewCount !== undefined && <span className="ml-2 text-sm text-gray-500">({reviewCount})</span>}
    </div>
);

const Header = ({ setView, user, onSignOut, searchQuery, setSearchQuery, activeTab }) => {
    const isSuperAdmin = (user && user.customClaims && user.customClaims.superAdmin === true) || (user && user.uid === SUPER_ADMIN_UID);
    const isViewerUser = user && checkIsViewer(user);
    const searchPlaceholder = activeTab === 'talents' ? "Search by talent name or tag..." : "Search by product name or tag...";
    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center gap-4">
                <div className="flex items-center space-x-2 cursor-pointer flex-shrink-0" onClick={() => setView({ page: 'home' })}><Store className="h-8 w-8 text-blue-600" /><span className="text-2xl font-bold text-gray-800">ShopNext</span></div>

                {user && (
                    <div className="relative w-full max-w-lg">
                        <input
                            type="search"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                )}

                {user && (
                    <div className="flex items-center space-x-4 flex-shrink-0">
                        {isViewerUser && (
                            <span className="flex items-center text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                <Eye className="h-4 w-4 mr-1" />
                                View Only
                            </span>
                        )}
                        {!isViewerUser && (
                            <button onClick={() => setView({ page: 'dashboard' })} className={`flex items-center space-x-2 text-white px-4 py-2 rounded-full transition-colors bg-blue-600 hover:bg-blue-700 cursor-pointer`}>
                                {isSuperAdmin ? <ShieldCheck className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
                                <span>My Dashboard</span>
                            </button>
                        )}
                        <button onClick={onSignOut} title="Sign Out" className="text-gray-500 hover:text-red-600 transition-colors cursor-pointer"><LogOut className="h-6 w-6" /></button>
                    </div>
                )}
            </nav>
        </header>
    );
};

const TabBar = ({ activeTab, setActiveTab, showAvatarTab }) => (
    <div className="container mx-auto px-4 pt-4">
        <div className="flex border-b border-gray-200">
            <button onClick={() => setActiveTab('products')} className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${activeTab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Products</button>
            {showAvatarTab && (<button onClick={() => setActiveTab('talents')} className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${activeTab === 'talents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Hirable Talent</button>)}
        </div>
    </div>
);

const Footer = () => (
    <footer className="bg-gray-800 text-white mt-12"><div className="container mx-auto px-4 py-6 text-center"><p>&copy; 2025 ShopNext. All rights reserved.</p><p className="text-sm text-gray-300">A prototype for educational purposes.</p></div></footer>
);

const ProductCard = ({ product, setView }) => {
    // Only show trigger tags on product cards
    const getDisplayTags = () => {
        // New format - both trigger and solution tags
        const triggerTags = product.displayTags?.trigger || [];
        const solutionTags = product.displayTags?.solution || [];
        return {
            trigger: triggerTags,
            solution: solutionTags
        };
    };

    const displayTags = getDisplayTags();

    return (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col">
            <div className="relative aspect-square">
                <img src={product.imageUrl || 'https://placehold.co/600x600/e2e8f0/4a5568?text=Image'} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-800 truncate">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-2 truncate">{product.subtitle}</p>
                <div className="flex-grow">
                    <div className="flex flex-wrap gap-1 mb-2">
                        {displayTags.trigger.map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"
                            >
                                #{tag}
                            </span>
                        ))}
                        {displayTags.solution.map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex justify-between items-center mt-2"><p className="text-xl font-extrabold text-blue-600">${parseFloat(product.price).toFixed(2)}</p><StarRating rating={product.rating} reviewCount={product.reviewCount} /></div>
                <button onClick={() => setView({ page: 'product', id: product.id })} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-full font-semibold hover:bg-blue-600 transition-colors cursor-pointer">View Details</button>
            </div>
        </div>
    );
};

const ProductGrid = ({ products, setView, sortOrder, setSortOrder }) => {
    return (
        <main className="container mx-auto px-4 pt-8 pb-2">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-3xl font-extrabold text-gray-900">Products</h2>
                 <div className="flex items-center space-x-2">
                    <label htmlFor="sort-order" className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                        id="sort-order"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="p-2 border rounded-md text-sm"
                    >
                        <option value="featured">Featured</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating-desc">Highest Rating</option>
                        <option value="newest">Newest Arrivals</option>
                    </select>
                 </div>
            </div>
            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => (<ProductCard key={product.id} product={product} setView={setView} />))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-gray-500 text-lg">No products found.</p>
                    <p className="text-gray-600 text-sm">Try adjusting your search or filter, or for admins, select a class to view.</p>
                </div>
            )}
        </main>
    );
};

const TalentCard = ({ talent, setView }) => {
    const getDisplayTags = () => {
        const triggerTags = talent.displayTags?.trigger || [];
        const solutionTags = talent.displayTags?.solution || [];
        return {
            trigger: triggerTags,
            solution: solutionTags
        };
    };

    const displayTags = getDisplayTags();

    return (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col">
            <div className="relative aspect-square">
                <img src={talent.imageUrl || 'https://placehold.co/600x600/e2e8f0/4a5568?text=Image'} alt={talent.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-800 truncate">{talent.name}</h3>
                <p className="text-sm text-gray-500 mb-2 truncate">{talent.subtitle}</p>
                <div className="flex-grow">
                    <div className="flex flex-wrap gap-1 mb-2">
                        {displayTags.trigger.map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"
                            >
                                #{tag}
                            </span>
                        ))}
                        {displayTags.solution.map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex justify-between items-center mt-2"><p className="text-xl font-extrabold text-blue-600">${parseFloat(talent.price).toFixed(2)}</p><StarRating rating={talent.rating} reviewCount={talent.reviewCount} /></div>
                <button onClick={() => setView({ page: 'talent', id: talent.id })} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-full font-semibold hover:bg-blue-600 transition-colors cursor-pointer">View Details</button>
            </div>
        </div>
    );
};

const TalentGrid = ({ talents, setView, sortOrder, setSortOrder }) => {
    return (
        <main className="container mx-auto px-4 pt-8 pb-2">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-3xl font-extrabold text-gray-900">Hirable Talent</h2>
                 <div className="flex items-center space-x-2">
                    <label htmlFor="talent-sort-order" className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                        id="talent-sort-order"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="p-2 border rounded-md text-sm"
                    >
                        <option value="featured">Featured</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating-desc">Highest Rating</option>
                        <option value="newest">Newest Arrivals</option>
                    </select>
                 </div>
            </div>
            {talents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {talents.map(talent => (<TalentCard key={talent.id} talent={talent} setView={setView} />))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-gray-500 text-lg">No talent found.</p>
                    <p className="text-gray-600 text-sm">Try adjusting your search or filter, or for admins, select a class to view.</p>
                </div>
            )}
        </main>
    );
};

const ReviewFormComponent = ({ productId, user }) => {
    const [ratings, setRatings] = useState({ attention: 0, persuasion: 0, brandedRecall: 0, liking: 0 });
    const [text, setText] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
    const criteria = ['attention', 'persuasion', 'brandedRecall', 'liking'];
    const handleRatingChange = (criterion, value) => { setRatings(prev => ({ ...prev, [criterion]: value })); };
    const updateProductRatingAfterSubmission = async () => { const reviewsRef = collection(db, "products", productId, "reviews"); const reviewsSnapshot = await getDocs(reviewsRef); const newReviewCount = reviewsSnapshot.size; let totalRating = 0; reviewsSnapshot.forEach(doc => { totalRating += doc.data().overallRating; }); const newAverageRating = newReviewCount > 0 ? totalRating / newReviewCount : 0; await updateDoc(doc(db, "products", productId), { rating: newAverageRating, reviewCount: newReviewCount }); };
    const handleReviewSubmit = async (e) => { e.preventDefault(); setError(''); setSuccess(''); if (Object.values(ratings).some(r => r === 0) || !text) { setError('Please provide a rating for all criteria and write a review.'); return; } const overallRating = Object.values(ratings).reduce((a, b) => a + b, 0) / criteria.length; try { await addDoc(collection(db, "products", productId, "reviews"), { userId: user.uid, username: user.displayName, ...ratings, overallRating, text, createdAt: serverTimestamp() }); await updateProductRatingAfterSubmission(); setSuccess('Thank you for your review!'); setRatings({ attention: 0, persuasion: 0, brandedRecall: 0, liking: 0 }); setText(''); } catch (err) { setError('Failed to submit review. ' + err.message); } };
    return (<div className="bg-white p-6 rounded-lg shadow-md border mt-8"><h3 className="text-xl font-bold text-gray-800 mb-4">Leave a Review</h3><form onSubmit={handleReviewSubmit} className="space-y-4">{criteria.map(criterion => (<div key={criterion} className="flex flex-col sm:flex-row justify-between sm:items-center"><span className="capitalize text-gray-700 mb-2 sm:mb-0">{criterion.replace(/([A-Z])/g, ' $1')}</span><div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-6 w-6 cursor-pointer ${i < ratings[criterion] ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} onClick={() => handleRatingChange(criterion, i + 1)} />))}</div></div>))}<div><textarea value={text} onChange={(e) => setText(e.target.value)} rows="4" placeholder="Share your thoughts..." className="w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}{success && <p className="text-sm text-green-500 text-center">{success}</p>}<button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 cursor-pointer">Submit Review</button></form></div>);
};

const TalentReviewForm = ({ talentId, user }) => {
    const [ratings, setRatings] = useState({ attention: 0, persuasion: 0, brandedRecall: 0, liking: 0 });
    const [text, setText] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
    const criteria = ['attention', 'persuasion', 'brandedRecall', 'liking'];
    const handleRatingChange = (criterion, value) => { setRatings(prev => ({ ...prev, [criterion]: value })); };
    const updateTalentRatingAfterSubmission = async () => { const reviewsRef = collection(db, "avatars", talentId, "reviews"); const reviewsSnapshot = await getDocs(reviewsRef); const newReviewCount = reviewsSnapshot.size; let totalRating = 0; reviewsSnapshot.forEach(doc => { totalRating += doc.data().overallRating; }); const newAverageRating = newReviewCount > 0 ? totalRating / newReviewCount : 0; await updateDoc(doc(db, "avatars", talentId), { rating: newAverageRating, reviewCount: newReviewCount }); };
    const handleReviewSubmit = async (e) => { e.preventDefault(); setError(''); setSuccess(''); if (Object.values(ratings).some(r => r === 0) || !text) { setError('Please provide a rating for all criteria and write a review.'); return; } const overallRating = Object.values(ratings).reduce((a, b) => a + b, 0) / criteria.length; try { await addDoc(collection(db, "avatars", talentId, "reviews"), { userId: user.uid, username: user.displayName, ...ratings, overallRating, text, createdAt: serverTimestamp() }); await updateTalentRatingAfterSubmission(); setSuccess('Thank you for your review!'); setRatings({ attention: 0, persuasion: 0, brandedRecall: 0, liking: 0 }); setText(''); } catch (err) { setError('Failed to submit review. ' + err.message); } };
    return (<div className="bg-white p-6 rounded-lg shadow-md border mt-8"><h3 className="text-xl font-bold text-gray-800 mb-4">Leave a Review</h3><form onSubmit={handleReviewSubmit} className="space-y-4">{criteria.map(criterion => (<div key={criterion} className="flex flex-col sm:flex-row justify-between sm:items-center"><span className="capitalize text-gray-700 mb-2 sm:mb-0">{criterion.replace(/([A-Z])/g, ' $1')}</span><div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-6 w-6 cursor-pointer ${i < ratings[criterion] ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} onClick={() => handleRatingChange(criterion, i + 1)} />))}</div></div>))}<div><textarea value={text} onChange={(e) => setText(e.target.value)} rows="4" placeholder="Share your thoughts..." className="w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}{success && <p className="text-sm text-green-500 text-center">{success}</p>}<button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 cursor-pointer">Submit Review</button></form></div>);
};

const ProductPage = ({ product, setView, user }) => {
    // Handle both old (imageUrls) and new (rtbImages) formats
    const getMediaFromProduct = () => {
        if (product.rtbImages && product.rtbImages.length > 0) {
            return product.rtbImages.filter(img => img.url).map(img => ({
                type: 'image',
                src: img.url,
                rtbLabel: img.rtbLabel,
                rtbId: img.rtbId
            }));
        }
        if (product.imageUrls && product.imageUrls.length > 0) {
            return product.imageUrls.map(src => ({ type: 'image', src }));
        }
        return [{ type: 'image', src: 'https://placehold.co/600x600/e2e8f0/4a5568?text=Image' }];
    };

    const getVideoFromProduct = () => {
        if (product.videoUrls && product.videoUrls.length > 0) {
            return product.videoUrls.map(src => ({ type: 'video', src }));
        }
        if (product.videoUrl) {
            return [{ type: 'video', src: product.videoUrl }];
        }
        return [];
    };

    const imageMedia = getMediaFromProduct();
    const videoMedia = getVideoFromProduct();
    const allMedia = [...imageMedia, ...videoMedia];

    // Filter to only vendor-approved downloadable media
    const allowedDownloads = product.downloadableMedia || { images: [], videos: [] };
    const downloadableMedia = allMedia.filter(m => {
        if (m.src && m.src.includes('placehold.co')) return false;
        if (m.type === 'image' && m.rtbId) return allowedDownloads.images.includes(m.rtbId);
        if (m.type === 'image' && !m.rtbId) return false; // legacy images without rtbId not downloadable by default
        if (m.type === 'video') {
            const videoIndex = videoMedia.indexOf(m);
            return allowedDownloads.videos.includes(videoIndex);
        }
        return false;
    });

    const initialMedia = imageMedia[0] || { type: 'image', src: 'https://placehold.co/600x600/e2e8f0/4a5568?text=Image' };
    const [activeMedia, setActiveMedia] = useState(initialMedia);
    const [reviews, setReviews] = useState([]);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadMedia = async () => {
        if (downloadableMedia.length === 0) return;

        setIsDownloading(true);
        try {
            const zip = new JSZip();
            const imagesFolder = zip.folder('images');
            const videosFolder = zip.folder('videos');
            let addedCount = 0;

            await Promise.all(downloadableMedia.map(async (media, index) => {
                try {
                    const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(media.src)}`;
                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const blob = await response.blob();
                    if (blob.size === 0) throw new Error('Empty response');
                    const ext = media.type === 'video' ? 'mp4' : 'jpg';
                    const label = media.rtbLabel ? `_${media.rtbLabel.replace(/\s+/g, '-')}` : '';
                    const fileName = `${media.type}_${index + 1}${label}.${ext}`;

                    if (media.type === 'video') {
                        videosFolder.file(fileName, blob);
                    } else {
                        imagesFolder.file(fileName, blob);
                    }
                    addedCount++;
                } catch (err) {
                    console.error(`Failed to fetch ${media.src}:`, err);
                }
            }));

            if (addedCount === 0) {
                alert('Failed to download any media files.');
            } else {
                const content = await zip.generateAsync({ type: 'blob' });
                const safeName = (product.name || 'product').replace(/[^a-zA-Z0-9]/g, '_');
                saveAs(content, `${safeName}_media.zip`);
            }
        } catch (err) {
            console.error('Failed to create ZIP:', err);
        }
        setIsDownloading(false);
    };

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, "products", product.id, "reviews"), orderBy("createdAt", "desc")), (snapshot) => {
            setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [product.id]);

    // Get all tags for display (both old and new format)
    const getAllTags = () => {
        if (product.tags && typeof product.tags === 'object' && !Array.isArray(product.tags)) {
            return {
                trigger: product.tags.trigger || [],
                solution: product.tags.solution || []
            };
        }
        // Old format - treat as solution tags
        if (Array.isArray(product.tags)) {
            return { trigger: [], solution: product.tags };
        }
        return { trigger: [], solution: [] };
    };

    const allTags = getAllTags();

    return (
        <main className="container mx-auto px-4 py-8">
            <button onClick={() => setView({ page: 'home' })} className="flex items-center text-blue-600 hover:underline mb-6 cursor-pointer">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to products
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    {/* Main media display with RTB label */}
                    <div className="mb-4 w-full h-auto aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-lg flex items-center justify-center relative">
                        <div className="w-full h-full">
                            {activeMedia.type === 'image' ? (
                                <img src={activeMedia.src} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <video key={activeMedia.src} src={activeMedia.src} controls autoPlay muted className="w-full h-full object-cover"></video>
                            )}
                        </div>
                        {/* RTB Label overlay */}
                        {activeMedia.rtbLabel && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <div className="flex items-center">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-2">
                                        {activeMedia.rtbId}
                                    </span>
                                    <span className="text-white font-medium">{activeMedia.rtbLabel}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Thumbnail strip */}
                    <div className="flex flex-wrap gap-2">
                        {allMedia.map((media, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveMedia(media)}
                                className={`relative w-20 h-20 rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${activeMedia.src === media.src ? 'border-blue-500' : 'border-transparent'}`}
                            >
                                {media.type === 'image' ? (
                                    <img src={media.src} alt={`thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-black flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-black opacity-50"></div>
                                        <Video className="h-8 w-8 text-white z-10" />
                                    </div>
                                )}
                                {/* RTB badge on thumbnail */}
                                {media.rtbId && (
                                    <span className="absolute top-0.5 left-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                        {media.rtbId}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Download Media Button - only shows if vendor has allowed downloads */}
                    {downloadableMedia.length > 0 && (
                        <button
                            onClick={handleDownloadMedia}
                            disabled={isDownloading}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors cursor-pointer disabled:bg-gray-400"
                        >
                            {isDownloading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Preparing download...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    <span>Download Media ({downloadableMedia.length} {downloadableMedia.length === 1 ? 'file' : 'files'})</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mt-1">{product.name}</h1>
                    <p className="text-lg text-gray-600 mt-2">{product.subtitle}</p>
                    <div className="my-4"><StarRating rating={product.rating} reviewCount={product.reviewCount} /></div>
                    <p className="text-3xl font-bold text-blue-600">${parseFloat(product.price).toFixed(2)}</p>

                    {/* All Tags Display (capped at max) */}
                    {(() => {
                        const cappedTriggerTags = allTags.trigger.slice(0, TAG_CONFIG.MAX_TRIGGER_TAGS);
                        const cappedSolutionTags = allTags.solution.slice(0, TAG_CONFIG.MAX_SOLUTION_TAGS);
                        return (cappedTriggerTags.length > 0 || cappedSolutionTags.length > 0) ? (
                            <div className="mt-4 flex flex-wrap gap-1">
                                {cappedTriggerTags.map(tag => (
                                    <span key={tag} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium">#{tag}</span>
                                ))}
                                {cappedSolutionTags.map(tag => (
                                    <span key={tag} className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full text-xs font-medium">#{tag}</span>
                                ))}
                            </div>
                        ) : null;
                    })()}

                    {/* Short Description */}
                    <div className="mt-6 border-t pt-4 short-description">
                        <div className="text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: product.shortDescription }} />
                    </div>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(product.highlights || []).map((highlight, index) => (
                            <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="font-bold text-blue-800">{highlight.title}</p>
                                <p className="text-sm text-blue-700 mt-1">{highlight.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Long Description */}
            <div className="mt-12 max-w-[1100px] mx-auto">
                <div className="border-t">
                    <button onClick={() => setIsDetailsOpen(!isDetailsOpen)} className="w-full flex justify-between items-center py-4 text-left cursor-pointer">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">About this item</h2>
                            <p className="text-sm text-gray-500">Product Details</p>
                        </div>
                        {isDetailsOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                    </button>
                    {isDetailsOpen && (<div className="pb-4 text-gray-600 prose max-w-none long-description" dangerouslySetInnerHTML={{ __html: product.longDescription }}/>)}
                </div>
            </div>

            {/* Reviews */}
            <div className="mt-12 max-w-[1100px] mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Reviews</h2>
                {reviews.length > 0 ? (
                    <div className="space-y-6">
                        {reviews.map(review => (
                            <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border">
                                <div className="flex items-center mb-2">
                                    <StarRating rating={review.overallRating} />
                                    <span className="ml-4 font-bold text-gray-800">{review.username}</span>
                                </div>
                                <p className="text-gray-600">{review.text}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
                )}
                {user && !checkIsViewer(user) && <ReviewFormComponent productId={product.id} user={user} />}
            </div>
        </main>
    );
};

const TalentPage = ({ talent, setView, user }) => {
    const getMediaFromTalent = () => {
        if (talent.rtbImages && talent.rtbImages.length > 0) {
            return talent.rtbImages.filter(img => img.url).map(img => ({
                type: 'image',
                src: img.url,
                rtbLabel: img.rtbLabel,
                rtbId: img.rtbId
            }));
        }
        if (talent.imageUrls && talent.imageUrls.length > 0) {
            return talent.imageUrls.map(src => ({ type: 'image', src }));
        }
        return [{ type: 'image', src: 'https://placehold.co/600x600/e2e8f0/4a5568?text=Image' }];
    };

    const getVideoFromTalent = () => {
        if (talent.videoUrls && talent.videoUrls.length > 0) {
            return talent.videoUrls.map(src => ({ type: 'video', src }));
        }
        if (talent.videoUrl) {
            return [{ type: 'video', src: talent.videoUrl }];
        }
        return [];
    };

    const imageMedia = getMediaFromTalent();
    const videoMedia = getVideoFromTalent();
    const allMedia = [...imageMedia, ...videoMedia];

    const allowedDownloads = talent.downloadableMedia || { images: [], videos: [] };
    const downloadableMedia = allMedia.filter(m => {
        if (m.src && m.src.includes('placehold.co')) return false;
        if (m.type === 'image' && m.rtbId) return allowedDownloads.images.includes(m.rtbId);
        if (m.type === 'image' && !m.rtbId) return false;
        if (m.type === 'video') {
            const videoIndex = videoMedia.indexOf(m);
            return allowedDownloads.videos.includes(videoIndex);
        }
        return false;
    });

    const initialMedia = imageMedia[0] || { type: 'image', src: 'https://placehold.co/600x600/e2e8f0/4a5568?text=Image' };
    const [activeMedia, setActiveMedia] = useState(initialMedia);
    const [reviews, setReviews] = useState([]);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadMedia = async () => {
        if (downloadableMedia.length === 0) return;

        setIsDownloading(true);
        try {
            const zip = new JSZip();
            const imagesFolder = zip.folder('images');
            const videosFolder = zip.folder('videos');
            let addedCount = 0;

            await Promise.all(downloadableMedia.map(async (media, index) => {
                try {
                    const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(media.src)}`;
                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const blob = await response.blob();
                    if (blob.size === 0) throw new Error('Empty response');
                    const ext = media.type === 'video' ? 'mp4' : 'jpg';
                    const label = media.rtbLabel ? `_${media.rtbLabel.replace(/\s+/g, '-')}` : '';
                    const fileName = `${media.type}_${index + 1}${label}.${ext}`;

                    if (media.type === 'video') {
                        videosFolder.file(fileName, blob);
                    } else {
                        imagesFolder.file(fileName, blob);
                    }
                    addedCount++;
                } catch (err) {
                    console.error(`Failed to fetch ${media.src}:`, err);
                }
            }));

            if (addedCount === 0) {
                alert('Failed to download any media files.');
            } else {
                const content = await zip.generateAsync({ type: 'blob' });
                const safeName = (talent.name || 'talent').replace(/[^a-zA-Z0-9]/g, '_');
                saveAs(content, `${safeName}_media.zip`);
            }
        } catch (err) {
            console.error('Failed to create ZIP:', err);
        }
        setIsDownloading(false);
    };

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, "avatars", talent.id, "reviews"), orderBy("createdAt", "desc")), (snapshot) => {
            setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [talent.id]);

    const getAllTags = () => {
        if (talent.tags && typeof talent.tags === 'object' && !Array.isArray(talent.tags)) {
            return {
                trigger: talent.tags.trigger || [],
                solution: talent.tags.solution || []
            };
        }
        if (Array.isArray(talent.tags)) {
            return { trigger: [], solution: talent.tags };
        }
        return { trigger: [], solution: [] };
    };

    const allTags = getAllTags();

    return (
        <main className="container mx-auto px-4 py-8">
            <button onClick={() => setView({ page: 'home' })} className="flex items-center text-blue-600 hover:underline mb-6 cursor-pointer">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to talent
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <div className="mb-4 w-full h-auto aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-lg flex items-center justify-center relative">
                        <div className="w-full h-full">
                            {activeMedia.type === 'image' ? (
                                <img src={activeMedia.src} alt={talent.name} className="w-full h-full object-cover" />
                            ) : (
                                <video key={activeMedia.src} src={activeMedia.src} controls autoPlay muted className="w-full h-full object-cover"></video>
                            )}
                        </div>
                        {activeMedia.rtbLabel && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <div className="flex items-center">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-2">
                                        {activeMedia.rtbId}
                                    </span>
                                    <span className="text-white font-medium">{activeMedia.rtbLabel}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {allMedia.map((media, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveMedia(media)}
                                className={`relative w-20 h-20 rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${activeMedia.src === media.src ? 'border-blue-500' : 'border-transparent'}`}
                            >
                                {media.type === 'image' ? (
                                    <img src={media.src} alt={`thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-black flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-black opacity-50"></div>
                                        <Video className="h-8 w-8 text-white z-10" />
                                    </div>
                                )}
                                {media.rtbId && (
                                    <span className="absolute top-0.5 left-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                                        {media.rtbId}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {downloadableMedia.length > 0 && (
                        <button
                            onClick={handleDownloadMedia}
                            disabled={isDownloading}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors cursor-pointer disabled:bg-gray-400"
                        >
                            {isDownloading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Preparing download...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    <span>Download Media ({downloadableMedia.length} {downloadableMedia.length === 1 ? 'file' : 'files'})</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mt-1">{talent.name}</h1>
                    <p className="text-lg text-gray-600 mt-2">{talent.subtitle}</p>
                    <div className="my-4"><StarRating rating={talent.rating} reviewCount={talent.reviewCount} /></div>
                    <p className="text-3xl font-bold text-blue-600">${parseFloat(talent.price).toFixed(2)}</p>

                    {(() => {
                        const cappedTriggerTags = allTags.trigger.slice(0, TAG_CONFIG.MAX_TRIGGER_TAGS);
                        const cappedSolutionTags = allTags.solution.slice(0, TAG_CONFIG.MAX_SOLUTION_TAGS);
                        return (cappedTriggerTags.length > 0 || cappedSolutionTags.length > 0) ? (
                            <div className="mt-4 flex flex-wrap gap-1">
                                {cappedTriggerTags.map(tag => (
                                    <span key={tag} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium">#{tag}</span>
                                ))}
                                {cappedSolutionTags.map(tag => (
                                    <span key={tag} className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full text-xs font-medium">#{tag}</span>
                                ))}
                            </div>
                        ) : null;
                    })()}

                    <div className="mt-6 border-t pt-4 short-description">
                        <div className="text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: talent.shortDescription }} />
                    </div>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(talent.highlights || []).map((highlight, index) => (
                            <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="font-bold text-blue-800">{highlight.title}</p>
                                <p className="text-sm text-blue-700 mt-1">{highlight.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Long Description */}
            <div className="mt-12 max-w-[1100px] mx-auto">
                <div className="border-t">
                    <button onClick={() => setIsDetailsOpen(!isDetailsOpen)} className="w-full flex justify-between items-center py-4 text-left cursor-pointer">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">About this item</h2>
                            <p className="text-sm text-gray-500">Talent Details</p>
                        </div>
                        {isDetailsOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                    </button>
                    {isDetailsOpen && (<div className="pb-4 text-gray-600 prose max-w-none long-description" dangerouslySetInnerHTML={{ __html: talent.longDescription }}/>)}
                </div>
            </div>

            {/* Reviews */}
            <div className="mt-12 max-w-[1100px] mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Reviews</h2>
                {reviews.length > 0 ? (
                    <div className="space-y-6">
                        {reviews.map(review => (
                            <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border">
                                <div className="flex items-center mb-2">
                                    <StarRating rating={review.overallRating} />
                                    <span className="ml-4 font-bold text-gray-800">{review.username}</span>
                                </div>
                                <p className="text-gray-600">{review.text}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>
                )}
                {user && !checkIsViewer(user) && <TalentReviewForm talentId={talent.id} user={user} />}
            </div>
        </main>
    );
};

const LoginScreen = () => {
    const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [isLoading, setIsLoading] = useState(false);
    const formatEmail = (user) => `${user.trim()}@shopnext.dev`;
    const handleSignIn = async (e) => { e.preventDefault(); setError(''); setIsLoading(true); try { await signInWithEmailAndPassword(auth, formatEmail(username), password); } catch (err) { setError(err.message); } setIsLoading(false); };
    return (<div className="flex items-center justify-center min-h-[80vh] bg-gray-50"><div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border"><div className="flex justify-center"><Store className="h-12 w-12 text-blue-600" /></div><h2 className="text-2xl font-bold text-center text-gray-800">Welcome to ShopNext</h2><p className="text-center text-gray-500">Please sign in to view products.</p><form onSubmit={handleSignIn} className="space-y-4"><div><label className="text-sm font-medium text-gray-700">Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required/></div><div><label className="text-sm font-medium text-gray-700">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required/></div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}<button type="submit" disabled={isLoading} className="w-full py-3 font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-blue-300 cursor-pointer">{isLoading ? 'Signing In...' : 'Sign In'}</button></form></div></div>);
};

const CreateItemForm = ({ setVendorView, user, editingItem, mode }) => {
    const config = mode === 'talent' ? {
        collectionName: 'avatars',
        storagePath: 'avatars',
        videoStoragePath: 'avatar-videos',
        rtbLabels: AVATAR_RTB_LABELS,
        classClaim: 'avatarClass',
        entityName: 'Hirable Talent',
        entityLabel: 'talent',
        imagesSectionTitle: 'Talent Photos',
        videoSectionTitle: 'Talent Videos',
    } : {
        collectionName: 'products',
        storagePath: 'products',
        videoStoragePath: 'product-videos',
        rtbLabels: RTB_LABELS,
        classClaim: 'class',
        entityName: 'Product',
        entityLabel: 'product',
        imagesSectionTitle: undefined,
        videoSectionTitle: undefined,
    };

    const [item, setItem] = useState({ name: '', subtitle: '', shortDescription: '', longDescription: '', price: '', category: '' });
    const [editorLoaded, setEditorLoaded] = useState(false);

    // New categorized tags
    const [triggerTags, setTriggerTags] = useState([]);
    const [solutionTags, setSolutionTags] = useState([]);
    const [displayTriggerTags, setDisplayTriggerTags] = useState([]);
    const [displaySolutionTags, setDisplaySolutionTags] = useState([]);

    const [highlights, setHighlights] = useState([{ title: '', text: '' }]);

    // New RTB Images state
    const [rtbImages, setRtbImages] = useState(config.rtbLabels.map(rtb => ({ rtbId: rtb.id, rtbLabel: rtb.name, url: '' })));
    const [videoUrls, setVideoUrls] = useState([]);
    const [uploadingSlot, setUploadingSlot] = useState(null);
    const [featuredImageId, setFeaturedImageId] = useState(1); // Default to first RTB slot
    const [downloadableImages, setDownloadableImages] = useState([]); // rtbIds allowed for download
    const [downloadableVideos, setDownloadableVideos] = useState([]); // video indices allowed for download

    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDarkModeTip, setShowDarkModeTip] = useState(!editingItem);

    // Initialize form with editing data
    useEffect(() => {
        if (editingItem) {
            setItem({
                name: editingItem.name || '',
                subtitle: editingItem.subtitle || '',
                shortDescription: editingItem.shortDescription || '',
                longDescription: editingItem.longDescription || '',
                price: editingItem.price || '',
                category: editingItem.category || ''
            });

            // Handle both old and new tag formats
            if (editingItem.tags && typeof editingItem.tags === 'object' && !Array.isArray(editingItem.tags)) {
                setTriggerTags(editingItem.tags.trigger || []);
                setSolutionTags(editingItem.tags.solution || []);
            } else if (Array.isArray(editingItem.tags)) {
                // Old format - put all in solution tags
                setSolutionTags(editingItem.tags);
                setTriggerTags([]);
            }

            // Handle display tags
            if (editingItem.displayTags) {
                setDisplayTriggerTags(editingItem.displayTags.trigger || []);
                setDisplaySolutionTags(editingItem.displayTags.solution || []);
            }

            setHighlights(editingItem.highlights && editingItem.highlights.length > 0 ? editingItem.highlights : [{ title: '', text: '' }]);

            // Handle both old and new image formats
            if (editingItem.rtbImages && editingItem.rtbImages.length > 0) {
                setRtbImages(editingItem.rtbImages);
                // Set featured image ID if it exists, otherwise default to first image with URL
                if (editingItem.featuredImageId) {
                    setFeaturedImageId(editingItem.featuredImageId);
                } else {
                    const firstImageWithUrl = editingItem.rtbImages.find(img => img.url);
                    setFeaturedImageId(firstImageWithUrl?.rtbId || 1);
                }
            } else if (editingItem.imageUrls && editingItem.imageUrls.length > 0) {
                // Migrate old format - map images to RTB slots
                const migratedRtbImages = config.rtbLabels.map((rtb, index) => ({
                    rtbId: rtb.id,
                    rtbLabel: rtb.name,
                    url: editingItem.imageUrls[index] || ''
                }));
                setRtbImages(migratedRtbImages);
            }

            // Handle video - load videoUrls array, with backward compat for old single videoUrl
            if (editingItem.videoUrls && editingItem.videoUrls.length > 0) {
                setVideoUrls(editingItem.videoUrls);
            } else if (editingItem.videoUrl) {
                setVideoUrls([editingItem.videoUrl]);
            }

            // Load downloadable media selections
            if (editingItem.downloadableMedia) {
                setDownloadableImages(editingItem.downloadableMedia.images || []);
                setDownloadableVideos(editingItem.downloadableMedia.videos || []);
            }
        } else {
            // Reset form for new item
            setItem({ name: '', subtitle: '', shortDescription: '', longDescription: '', price: '', category: '' });
            setTriggerTags([]);
            setSolutionTags([]);
            setDisplayTriggerTags([]);
            setDisplaySolutionTags([]);
            setHighlights([{ title: '', text: '' }]);
            setRtbImages(config.rtbLabels.map(rtb => ({ rtbId: rtb.id, rtbLabel: rtb.name, url: '' })));
            setVideoUrls([]);
            setDownloadableImages([]);
            setDownloadableVideos([]);
        }
        setEditorLoaded(true);
    }, [editingItem]);

    // Image upload handler
    const handleUploadImage = async (file, rtbId) => {
        setIsUploading(true);
        setUploadingSlot(rtbId);
        setError('');

        const fileRef = storageRef(storage, `${config.storagePath}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed',
            () => {},
            (uploadError) => {
                setError(`Upload failed: ${uploadError.message}`);
                setIsUploading(false);
                setUploadingSlot(null);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setRtbImages(prev => prev.map(img =>
                        img.rtbId === rtbId ? { ...img, url: downloadURL } : img
                    ));
                    setIsUploading(false);
                    setUploadingSlot(null);
                });
            }
        );
    };

    // Video upload handler
    const handleUploadVideo = async (file) => {
        setIsUploading(true);
        setError('');

        const fileRef = storageRef(storage, `${config.videoStoragePath}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed',
            () => {},
            (uploadError) => {
                setError(`Video upload failed: ${uploadError.message}`);
                setIsUploading(false);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setVideoUrls(prev => [...prev, downloadURL]);
                    setIsUploading(false);
                });
            }
        );
    };

    // Remove image handler
    const handleRemoveImage = async (rtbId) => {
        const imageData = rtbImages.find(img => img.rtbId === rtbId);
        if (!imageData?.url) return;

        if (window.confirm("Are you sure you want to remove this image?")) {
            try {
                const fileRef = storageRef(storage, imageData.url);
                await deleteObject(fileRef);
            } catch (err) {
                console.error("Failed to delete from storage:", err);
            }
            setRtbImages(prev => prev.map(img =>
                img.rtbId === rtbId ? { ...img, url: '' } : img
            ));
        }
    };

    // Remove video handler
    const handleRemoveVideo = async (index) => {
        const url = videoUrls[index];
        if (!url) return;

        if (window.confirm("Are you sure you want to remove this video?")) {
            try {
                const fileRef = storageRef(storage, url);
                await deleteObject(fileRef);
            } catch (err) {
                console.error("Failed to delete video from storage:", err);
            }
            setVideoUrls(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setItem(prev => ({ ...prev, [name]: value }));
    };

    const handleHighlightChange = (index, field, value) => {
        const newHighlights = [...highlights];
        newHighlights[index][field] = value;
        setHighlights(newHighlights);
    };

    const addHighlight = () => {
        if (highlights.length < 6) setHighlights([...highlights, { title: '', text: '' }]);
    };

    const removeHighlight = (index) => {
        if (highlights.length > 1 || (highlights.length === 1 && (highlights[0].title || highlights[0].text))) {
            setHighlights(highlights.filter((_, i) => i !== index));
        }
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!item.name || !item.price) {
            setError(`${config.entityName} Name and Price are required.`);
            return;
        }

        // Get first image as featured image
        const firstImage = rtbImages.find(img => img.url);
        const imageUrl = firstImage?.url || '';

        // Also create imageUrls array for backward compatibility
        const imageUrls = rtbImages.filter(img => img.url).map(img => img.url);

        try {
            // Only save tags within the allowed limits
            const validTriggerTags = triggerTags.slice(0, TAG_CONFIG.MAX_TRIGGER_TAGS);
            const validSolutionTags = solutionTags.slice(0, TAG_CONFIG.MAX_SOLUTION_TAGS);
            const validDisplayTriggerTags = displayTriggerTags.filter(t => validTriggerTags.includes(t));
            const validDisplaySolutionTags = displaySolutionTags.filter(t => validSolutionTags.includes(t));

            const commonData = {
                ...item,
                price: parseFloat(item.price),
                // New tag format - only valid tags within limits
                tags: {
                    trigger: validTriggerTags,
                    solution: validSolutionTags
                },
                displayTags: {
                    trigger: validDisplayTriggerTags,
                    solution: validDisplaySolutionTags
                },
                highlights: highlights.filter(h => h.title && h.text),
                // New RTB images format
                rtbImages: rtbImages.filter(img => img.url),
                featuredImageId: featuredImageId,
                videoUrls: videoUrls || [],
                // Download permissions
                downloadableMedia: {
                    images: downloadableImages,
                    videos: downloadableVideos
                },
                // Backward compatibility
                imageUrl,
                imageUrls,
                videoUrl: (videoUrls && videoUrls.length > 0) ? videoUrls[0] : '',
                class: editingItem ? editingItem.class : user.customClaims[config.classClaim]
            };

            if (editingItem) {
                await updateDoc(doc(db, config.collectionName, editingItem.id), {
                    ...commonData,
                    featuredOrder: editingItem.featuredOrder !== undefined ? editingItem.featuredOrder : 999
                });
                setSuccess(`${config.entityName} updated successfully!`);
            } else {
                await addDoc(collection(db, config.collectionName), {
                    ...commonData,
                    vendorId: user.uid,
                    vendor: user.displayName,
                    createdAt: serverTimestamp(),
                    rating: 0,
                    reviewCount: 0,
                    featuredOrder: Date.now()
                });
                setSuccess(`${config.entityName} saved successfully!`);
            }
            setTimeout(() => { setVendorView('dashboard'); }, 1500);
        } catch (err) {
            setError(`Failed to save ${config.entityLabel}. ` + err.message);
        }
    };

    if (!editorLoaded) {
        return <div className="text-center py-8">Loading Editor...</div>;
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md border max-w-4xl mx-auto">
            {showDarkModeTip && !editingItem && (
                <div className="mb-4 flex items-center justify-between bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-md">
                    <span className="text-sm">If you can&#39;t see the words, adjust your machine from dark mode to light mode</span>
                    <button type="button" onClick={() => setShowDarkModeTip(false)} className="ml-4 text-yellow-800 hover:text-yellow-900 cursor-pointer"><X className="h-4 w-4" /></button>
                </div>
            )}
            <h3 className="text-xl font-bold mb-6 text-gray-800">{editingItem ? `Edit ${config.entityName}` : `Add New ${config.entityName}`}</h3>
            <form onSubmit={handleSaveItem} className="space-y-6">
                {/* Basic Info */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">{config.entityName} Name</label>
                    <input name="name" value={item.name} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Subtitle</label>
                    <input name="subtitle" value={item.subtitle} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" />
                </div>

                {/* Short Description - Custom Editor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                    <RichTextEditor
                        value={item.shortDescription}
                        onChange={(content) => setItem(prev => ({ ...prev, shortDescription: content }))}
                        placeholder={`Enter a brief ${config.entityLabel} description...`}
                        minHeight={250}
                    />
                </div>

                {/* Highlights */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{config.entityName} Highlights (Up to 6)</label>
                    {highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 mt-2">
                            <input
                                value={h.title}
                                onChange={(e) => handleHighlightChange(i, 'title', e.target.value)}
                                placeholder="Bold Title"
                                className="p-2 border rounded-md w-1/3"
                            />
                            <input
                                value={h.text}
                                onChange={(e) => handleHighlightChange(i, 'text', e.target.value)}
                                placeholder="Sub-headline"
                                className="p-2 border rounded-md flex-grow"
                            />
                            <button type="button" onClick={() => removeHighlight(i)} className="p-2 text-red-500 hover:bg-red-100 rounded-full cursor-pointer">
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                    {highlights.length < 6 && (
                        <button type="button" onClick={addHighlight} className="text-sm text-blue-600 mt-2 font-semibold cursor-pointer">
                            Add Highlight
                        </button>
                    )}
                </div>

                {/* Long Description - Custom Editor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Long Description</label>
                    <RichTextEditor
                        value={item.longDescription}
                        onChange={(content) => setItem(prev => ({ ...prev, longDescription: content }))}
                        placeholder={`Enter detailed ${config.entityLabel} information...`}
                        minHeight={400}
                    />
                </div>

                {/* Price and Category */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <input name="price" value={item.price} onChange={handleChange} type="number" step="0.01" className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <input name="category" value={item.category} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                </div>

                {/* Tag Manager */}
                <TagManager
                    triggerTags={triggerTags}
                    setTriggerTags={setTriggerTags}
                    solutionTags={solutionTags}
                    setSolutionTags={setSolutionTags}
                    displayTriggerTags={displayTriggerTags}
                    setDisplayTriggerTags={setDisplayTriggerTags}
                    displaySolutionTags={displaySolutionTags}
                    setDisplaySolutionTags={setDisplaySolutionTags}
                    entityLabel={config.entityLabel}
                />

                {/* RTB Image Uploader */}
                <RTBImageUploader
                    rtbImages={rtbImages}
                    setRtbImages={setRtbImages}
                    videoUrls={videoUrls}
                    setVideoUrls={setVideoUrls}
                    onUploadImage={handleUploadImage}
                    onUploadVideo={handleUploadVideo}
                    onRemoveImage={handleRemoveImage}
                    onRemoveVideo={handleRemoveVideo}
                    isUploading={isUploading}
                    uploadingSlot={uploadingSlot}
                    error={error}
                    setError={setError}
                    featuredImageId={featuredImageId}
                    setFeaturedImageId={setFeaturedImageId}
                    rtbLabels={config.rtbLabels}
                    imagesSectionTitle={config.imagesSectionTitle}
                    videoSectionTitle={config.videoSectionTitle}
                />

                {/* Download Permissions */}
                {(rtbImages.some(img => img.url) || videoUrls.length > 0) && (
                    <div className="border rounded-lg p-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-1">Download Permissions</h4>
                        <p className="text-sm text-gray-500 mb-3">Select which media files viewers are allowed to download.</p>

                        {rtbImages.some(img => img.url) && (
                            <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Images</p>
                                <div className="space-y-2">
                                    {rtbImages.filter(img => img.url).map(img => (
                                        <label key={img.rtbId} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={downloadableImages.includes(img.rtbId)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setDownloadableImages(prev => [...prev, img.rtbId]);
                                                    } else {
                                                        setDownloadableImages(prev => prev.filter(id => id !== img.rtbId));
                                                    }
                                                }}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                                            />
                                            <img src={img.url} alt={img.rtbLabel} className="h-10 w-10 object-cover rounded" />
                                            <span className="text-sm text-gray-700">{img.rtbLabel}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {videoUrls.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Videos</p>
                                <div className="space-y-2">
                                    {videoUrls.map((url, index) => (
                                        <label key={index} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={downloadableVideos.includes(index)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setDownloadableVideos(prev => [...prev, index]);
                                                    } else {
                                                        setDownloadableVideos(prev => prev.filter(i => i !== index));
                                                    }
                                                }}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                                            />
                                            <Video className="h-5 w-5 text-gray-500" />
                                            <span className="text-sm text-gray-700">Video {index + 1}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Error/Success Messages */}
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                {success && <p className="text-sm text-green-500 text-center">{success}</p>}

                {/* Form Actions */}
                <div className="flex justify-end space-x-4">
                    <button type="button" onClick={() => setVendorView('dashboard')} className="px-6 py-2 border rounded-full cursor-pointer">
                        Cancel
                    </button>
                    <button type="submit" disabled={isUploading} className="px-6 py-2 bg-blue-600 text-white rounded-full cursor-pointer disabled:bg-blue-300">
                        {isUploading ? 'Uploading...' : `Save ${config.entityName}`}
                    </button>
                </div>
            </form>
        </div>
    );
};

const VendorDashboard = ({ user, setView, onEditProduct, onEditTalent }) => {
    const [dashTab, setDashTab] = useState('products');
    const [vendorProducts, setVendorProducts] = useState([]);
    const [vendorTalents, setVendorTalents] = useState([]);

    const isSuperAdmin = (user && user.customClaims && user.customClaims.superAdmin === true) || (user && user.uid === SUPER_ADMIN_UID);
    const hasAvatarAccess = isSuperAdmin || !!user?.customClaims?.avatarClass;

    useEffect(() => { if (user) { const q = query(collection(db, "products"), where("vendorId", "==", user.uid)); const unsubscribe = onSnapshot(q, (snapshot) => { setVendorProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); return () => unsubscribe(); } }, [user]);

    useEffect(() => { if (user && hasAvatarAccess) { const q = query(collection(db, "avatars"), where("vendorId", "==", user.uid)); const unsubscribe = onSnapshot(q, (snapshot) => { setVendorTalents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); return () => unsubscribe(); } }, [user, hasAvatarAccess]);

    const handleDeleteProduct = async (product) => { if(window.confirm("Are you sure?")) { try { await deleteDoc(doc(db, "products", product.id)); (product.imageUrls || []).forEach(url => deleteObject(storageRef(storage, url))); (product.videoUrls || []).forEach(url => deleteObject(storageRef(storage, url))); } catch (error) { console.error("Error deleting product: ", error); } }};

    const handleDeleteTalent = async (talent) => { if(window.confirm("Are you sure?")) { try { await deleteDoc(doc(db, "avatars", talent.id)); (talent.imageUrls || []).forEach(url => deleteObject(storageRef(storage, url))); (talent.videoUrls || []).forEach(url => deleteObject(storageRef(storage, url))); } catch (error) { console.error("Error deleting talent: ", error); } }};

    return (<div>
        {/* Dashboard tabs */}
        {hasAvatarAccess && (
            <div className="flex border-b border-gray-200 mb-6">
                <button onClick={() => setDashTab('products')} className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${dashTab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Products</button>
                <button onClick={() => setDashTab('talents')} className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${dashTab === 'talents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Hirable Talent</button>
            </div>
        )}

        {dashTab === 'products' && (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">My Products ({vendorProducts.length})</h2>
                        <p className="text-sm text-gray-500">Logged in as: {user?.displayName} (Class: {user?.customClaims.class})</p>
                    </div>
                    <button onClick={() => { onEditProduct(null); setView({ page: 'create_product' });}} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors mr-4 cursor-pointer"><PlusCircle className="h-5 w-5 mr-2" />Add New Product</button>
                </div>
                <div className="bg-white rounded-lg shadow-md border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">{vendorProducts.map(p => (<tr key={p.id}><td className="px-6 py-4"><div className="flex items-center"><img className="h-10 w-10 rounded-md object-cover mr-4" src={p.imageUrl || p.imageUrls?.[0] || 'https://placehold.co/100x100/e2e8f0/4a5568?text=Img'} alt={p.name} /><span className="font-medium text-gray-900">{p.name}</span></div></td><td className="px-6 py-4 text-gray-600">${parseFloat(p.price).toFixed(2)}</td><td className="px-6 py-4"><StarRating rating={p.rating} reviewCount={p.reviewCount} /></td><td className="px-6 py-4"><div className="flex space-x-4"><button onClick={() => onEditProduct(p)} className="text-blue-600 hover:text-blue-800 cursor-pointer"><Edit className="h-5 w-5" /></button><button onClick={() => handleDeleteProduct(p)} className="text-red-600 hover:text-red-800 cursor-pointer"><Trash2 className="h-5 w-5" /></button></div></td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        )}

        {dashTab === 'talents' && hasAvatarAccess && (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">My Hirable Talent ({vendorTalents.length})</h2>
                        <p className="text-sm text-gray-500">Logged in as: {user?.displayName} (Avatar Class: {user?.customClaims.avatarClass})</p>
                    </div>
                    <button onClick={() => { onEditTalent(null); setView({ page: 'create_talent' });}} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors mr-4 cursor-pointer"><PlusCircle className="h-5 w-5 mr-2" />Add New Hirable Talent</button>
                </div>
                <div className="bg-white rounded-lg shadow-md border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talent</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">{vendorTalents.map(p => (<tr key={p.id}><td className="px-6 py-4"><div className="flex items-center"><img className="h-10 w-10 rounded-md object-cover mr-4" src={p.imageUrl || p.imageUrls?.[0] || 'https://placehold.co/100x100/e2e8f0/4a5568?text=Img'} alt={p.name} /><span className="font-medium text-gray-900">{p.name}</span></div></td><td className="px-6 py-4 text-gray-600">${parseFloat(p.price).toFixed(2)}</td><td className="px-6 py-4"><StarRating rating={p.rating} reviewCount={p.reviewCount} /></td><td className="px-6 py-4"><div className="flex space-x-4"><button onClick={() => onEditTalent(p)} className="text-blue-600 hover:text-blue-800 cursor-pointer"><Edit className="h-5 w-5" /></button><button onClick={() => handleDeleteTalent(p)} className="text-red-600 hover:text-red-800 cursor-pointer"><Trash2 className="h-5 w-5" /></button></div></td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        )}
    </div>);
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

// Manage Users Modal
const DeleteUsersModal = ({ isOpen, onClose }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setMessage('');
            setUsers([]);
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoading(true);
        setMessage('');
        try {
            const listAllUsers = httpsCallable(functions, 'listAllUsers');
            const result = await listAllUsers();

            console.log('Users fetched:', result.data);

            if (result.data && result.data.users) {
                setUsers(result.data.users);
            } else {
                setUsers([]);
                setMessage('No users returned from server');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);

            // Better error messages
            if (error.code === 'functions/unauthenticated') {
                setMessage('Error: You must be logged in');
            } else if (error.code === 'functions/permission-denied') {
                setMessage('Error: You do not have permission');
            } else if (error.code === 'functions/not-found') {
                setMessage('Error: Function not deployed. Run: firebase deploy --only functions');
            } else {
                setMessage(`Error: ${error.message || 'Unknown error occurred'}`);
            }
        }
        setLoading(false);
    };

    const handleDeleteUser = async (uid, email) => {
        if (!window.confirm(`Are you sure you want to delete user ${email}?`)) return;

        setLoading(true);
        setMessage('');
        try {
            const deleteUser = httpsCallable(functions, 'deleteUser');
            await deleteUser({ uid });
            setMessage(`User ${email} deleted successfully`);
            await fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            if (error.code === 'functions/not-found') {
                setMessage('Error: Function not deployed. Run: firebase deploy --only functions');
            } else {
                setMessage(`Error: ${error.message || 'Unknown error occurred'}`);
            }
        }
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Users">
            <div className="space-y-4">
                {loading && <p className="text-center text-gray-500">Loading...</p>}
                {message && <p className={`text-sm text-center ${message.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
                {!loading && !message && users.length === 0 && <p className="text-center text-gray-500">No users found</p>}
                {!loading && users.length > 0 && (
                    <div className="space-y-2">
                        {users.map(user => (
                            <div key={user.uid} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900">{user.email}</p>
                                    <p className="text-xs text-gray-500">UID: {user.uid}</p>
                                    {user.customClaims?.class && <p className="text-xs text-blue-600">Product Class: {user.customClaims.class}</p>}
                                    {user.customClaims?.avatarClass && <p className="text-xs text-blue-600">Avatar Class: {user.customClaims.avatarClass}</p>}
                                    {user.customClaims?.viewer && <p className="text-xs text-purple-600 flex items-center"><Eye className="h-3 w-3 mr-1" />Viewer</p>}
                                    {user.customClaims?.superAdmin && <p className="text-xs text-green-600 flex items-center"><ShieldCheck className="h-3 w-3 mr-1" />Super Admin</p>}
                                </div>
                                <button
                                    onClick={() => handleDeleteUser(user.uid, user.email)}
                                    className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <UserMinus className="h-4 w-4" />
                                    <span className="text-sm">Delete</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

// Manage Classes Modal
const ManageClassesModal = ({ isOpen, onClose, collectionName }) => {
    const [classes, setClasses] = useState([]);
    const [newClassName, setNewClassName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const q = query(collection(db, collectionName));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            return () => unsubscribe();
        }
    }, [isOpen, collectionName]);

    const handleAddClass = async (e) => {
        e.preventDefault();
        if (!newClassName.trim()) {
            setMessage('Error: Class name cannot be empty');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            const className = newClassName.trim().toLowerCase().replace(/\s+/g, '-');
            const displayName = newClassName.trim().charAt(0).toUpperCase() + newClassName.trim().slice(1);
            await setDoc(doc(db, collectionName, className), { name: displayName });
            setMessage(`Class "${displayName}" added successfully`);
            setNewClassName('');
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
        setLoading(false);
    };

    const handleDeleteClass = async (classId, className) => {
        if (!window.confirm(`Are you sure you want to delete class "${className}"? This will not delete associated items or users.`)) return;

        setLoading(true);
        setMessage('');
        try {
            await deleteDoc(doc(db, collectionName, classId));
            setMessage(`Class "${className}" deleted successfully`);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
        setLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Classes">
            <div className="space-y-6">
                <form onSubmit={handleAddClass} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Add New Class</label>
                        <div className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="e.g., Morning Class"
                                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center space-x-2 cursor-pointer"
                            >
                                <FolderPlus className="h-4 w-4" />
                                <span>Add</span>
                            </button>
                        </div>
                    </div>
                </form>

                {message && <p className={`text-sm text-center ${message.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}

                <div>
                    <h4 className="font-medium text-gray-700 mb-3">Existing Classes</h4>
                    {classes.length === 0 ? (
                        <p className="text-center text-gray-500">No classes created yet</p>
                    ) : (
                        <div className="space-y-2">
                            {classes.map(cls => (
                                <div key={cls.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-900">{cls.name}</p>
                                        <p className="text-xs text-gray-500">ID: {cls.id}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                                        className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="text-sm">Delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

const SuperAdminDashboard = ({ user, onEditProduct, onEditTalent }) => {
    const [adminTab, setAdminTab] = useState('products');

    // Product state
    const [allProducts, setAllProducts] = useState([]);
    const [productClasses, setProductClasses] = useState([]);
    const [selectedProductClass, setSelectedProductClass] = useState('');
    const [draggedProductItem, setDraggedProductItem] = useState(null);

    // Talent state
    const [allTalents, setAllTalents] = useState([]);
    const [avatarClasses, setAvatarClasses] = useState([]);
    const [selectedAvatarClass, setSelectedAvatarClass] = useState('');
    const [draggedTalentItem, setDraggedTalentItem] = useState(null);

    // Shared state
    const [newUser, setNewUser] = useState({username: '', password: '', class: ''});
    const [userCreationMsg, setUserCreationMsg] = useState('');
    const [isLoadingUserCreation, setIsLoadingUserCreation] = useState(false);
    const [showDeleteUsersModal, setShowDeleteUsersModal] = useState(false);
    const [showManageClassesModal, setShowManageClassesModal] = useState(false);

    // Viewer creation state
    const [newViewer, setNewViewer] = useState({ username: '', password: '' });
    const [viewerCreationMsg, setViewerCreationMsg] = useState('');
    const [isLoadingViewerCreation, setIsLoadingViewerCreation] = useState(false);

    // Migration state
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationMsg, setMigrationMsg] = useState('');

    // Product classes subscription
    useEffect(() => {
        const q = query(collection(db, "classes"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProductClasses(classList);
            if (classList.length > 0 && !selectedProductClass) {
                setSelectedProductClass(classList[0].id);
            }
        });
        return () => unsubscribe();
    }, []);

    // Avatar classes subscription
    useEffect(() => {
        const q = query(collection(db, "avatar-classes"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAvatarClasses(classList);
            if (classList.length > 0 && !selectedAvatarClass) {
                setSelectedAvatarClass(classList[0].id);
            }
        });
        return () => unsubscribe();
    }, []);

    // Products subscription
    useEffect(() => {
        if (!selectedProductClass) {
            setAllProducts([]);
            return;
        };
        const q = query(collection(db, "products"), where("class", "==", selectedProductClass), orderBy("featuredOrder", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllProducts(prods);
        });
        return () => unsubscribe();
    }, [selectedProductClass]);

    // Talents subscription
    useEffect(() => {
        if (!selectedAvatarClass) {
            setAllTalents([]);
            return;
        };
        const q = query(collection(db, "avatars"), where("class", "==", selectedAvatarClass), orderBy("featuredOrder", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllTalents(items);
        });
        return () => unsubscribe();
    }, [selectedAvatarClass]);

    // Product drag/drop/delete
    const handleDeleteProduct = async (product) => { if(window.confirm("Are you sure?")) { try { await deleteDoc(doc(db, "products", product.id)); (product.imageUrls || []).forEach(url => deleteObject(storageRef(storage, url))); (product.videoUrls || []).forEach(url => deleteObject(storageRef(storage, url))); } catch (error) { console.error("Error deleting product: ", error); } }};
    const handleProductDragStart = (e, index) => { setDraggedProductItem(allProducts[index]); };
    const handleProductDragOver = (e, index) => { e.preventDefault(); const draggedOverItem = allProducts[index]; if (draggedProductItem === draggedOverItem) { return; } let items = allProducts.filter(item => item !== draggedProductItem); items.splice(index, 0, draggedProductItem); setAllProducts(items); };
    const handleProductDragEnd = async () => { setDraggedProductItem(null); const batch = writeBatch(db); allProducts.forEach((product, index) => { const productRef = doc(db, "products", product.id); batch.update(productRef, { featuredOrder: index }); }); await batch.commit(); };

    // Talent drag/drop/delete
    const handleDeleteTalent = async (talent) => { if(window.confirm("Are you sure?")) { try { await deleteDoc(doc(db, "avatars", talent.id)); (talent.imageUrls || []).forEach(url => deleteObject(storageRef(storage, url))); (talent.videoUrls || []).forEach(url => deleteObject(storageRef(storage, url))); } catch (error) { console.error("Error deleting talent: ", error); } }};
    const handleTalentDragStart = (e, index) => { setDraggedTalentItem(allTalents[index]); };
    const handleTalentDragOver = (e, index) => { e.preventDefault(); const draggedOverItem = allTalents[index]; if (draggedTalentItem === draggedOverItem) { return; } let items = allTalents.filter(item => item !== draggedTalentItem); items.splice(index, 0, draggedTalentItem); setAllTalents(items); };
    const handleTalentDragEnd = async () => { setDraggedTalentItem(null); const batch = writeBatch(db); allTalents.forEach((talent, index) => { const talentRef = doc(db, "avatars", talent.id); batch.update(talentRef, { featuredOrder: index }); }); await batch.commit(); };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (newUser.username.length < 3 || newUser.password.length < 6 || !newUser.class) {
            setUserCreationMsg("Error: Please fill all fields correctly.");
            return;
        }
        setIsLoadingUserCreation(true);
        setUserCreationMsg('');
        try {
            if (adminTab === 'talents') {
                const createAvatarVendor = httpsCallable(functions, 'createAvatarVendor');
                const result = await createAvatarVendor({
                    username: newUser.username,
                    password: newUser.password,
                    avatarClass: newUser.class
                });

                const className = newUser.class.trim().toLowerCase();
                const classRef = doc(db, "avatar-classes", className);
                const displayName = className.charAt(0).toUpperCase() + className.slice(1).replace(/-/g, ' ');
                await setDoc(classRef, { name: displayName });

                setUserCreationMsg(result.data.result);
            } else {
                const createNewVendor = httpsCallable(functions, 'createNewVendor');
                const result = await createNewVendor({
                    username: newUser.username,
                    password: newUser.password,
                    class: newUser.class
                });

                const className = newUser.class.trim().toLowerCase();
                const classRef = doc(db, "classes", className);
                const displayName = className.charAt(0).toUpperCase() + className.slice(1).replace(/-/g, ' ');
                await setDoc(classRef, { name: displayName });

                setUserCreationMsg(result.data.result);
            }
            setNewUser({ username: '', password: '', class: '' });
        } catch (error) {
            setUserCreationMsg(`Error: ${error.message}`);
        }
        setIsLoadingUserCreation(false);
    };

    const handleCreateViewer = async (e) => {
        e.preventDefault();
        if (newViewer.username.length < 3 || newViewer.password.length < 6) {
            setViewerCreationMsg("Error: Username must be 3+ chars, password 6+ chars.");
            return;
        }
        setIsLoadingViewerCreation(true);
        setViewerCreationMsg('');
        try {
            const createNewViewer = httpsCallable(functions, 'createNewViewer');
            const result = await createNewViewer({
                username: newViewer.username,
                password: newViewer.password
            });
            setViewerCreationMsg(result.data.result);
            setNewViewer({ username: '', password: '' });
        } catch (error) {
            setViewerCreationMsg(`Error: ${error.message}`);
        }
        setIsLoadingViewerCreation(false);
    };

    // Migrate old tag format to new format
    const handleMigrateTags = async () => {
        const targetCollection = adminTab === 'talents' ? 'avatars' : 'products';
        const entityLabel = adminTab === 'talents' ? 'talent' : 'product';
        if (!window.confirm(`This will migrate all ${entityLabel}s with old tag format (flat array) to the new format (trigger/solution objects). Continue?`)) {
            return;
        }
        setIsMigrating(true);
        setMigrationMsg('');
        try {
            const snapshot = await getDocs(collection(db, targetCollection));
            const batch = writeBatch(db);
            let migratedCount = 0;

            snapshot.docs.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                // Check if tags is an array (old format) instead of object (new format)
                if (Array.isArray(data.tags)) {
                    const oldTags = data.tags;
                    // Split tags evenly between trigger and solution, respecting limits
                    const halfIndex = Math.ceil(oldTags.length / 2);
                    const triggerTags = oldTags.slice(0, Math.min(halfIndex, TAG_CONFIG.MAX_TRIGGER_TAGS));
                    const solutionTags = oldTags.slice(halfIndex, halfIndex + TAG_CONFIG.MAX_SOLUTION_TAGS);

                    batch.update(doc(db, targetCollection, docSnapshot.id), {
                        tags: {
                            trigger: triggerTags,
                            solution: solutionTags
                        },
                        displayTags: {
                            trigger: triggerTags.slice(0, TAG_CONFIG.DISPLAY_TRIGGER_TAGS),
                            solution: solutionTags.slice(0, TAG_CONFIG.DISPLAY_SOLUTION_TAGS)
                        }
                    });
                    migratedCount++;
                }
            });

            if (migratedCount > 0) {
                await batch.commit();
                setMigrationMsg(`Successfully migrated ${migratedCount} ${entityLabel}(s) to new tag format.`);
            } else {
                setMigrationMsg(`No ${entityLabel}s needed migration. All already use the new format.`);
            }
        } catch (error) {
            setMigrationMsg(`Error: ${error.message}`);
        }
        setIsMigrating(false);
    };

    const currentClasses = adminTab === 'talents' ? avatarClasses : productClasses;
    const currentSelectedClass = adminTab === 'talents' ? selectedAvatarClass : selectedProductClass;
    const setCurrentSelectedClass = adminTab === 'talents' ? setSelectedAvatarClass : setSelectedProductClass;
    const currentItems = adminTab === 'talents' ? allTalents : allProducts;
    const classCollectionName = adminTab === 'talents' ? 'avatar-classes' : 'classes';

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Super Admin Dashboard</h2>

            {/* Admin tab switcher */}
            <div className="flex border-b border-gray-200 mb-6">
                <button onClick={() => setAdminTab('products')} className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${adminTab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Products</button>
                <button onClick={() => setAdminTab('talents')} className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors cursor-pointer ${adminTab === 'talents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Hirable Talent</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                     <div className="flex items-center mb-4">
                        <label htmlFor="class-select" className="mr-2 font-bold">Manage Class:</label>
                        {currentClasses.length > 0 ? (
                           <select id="class-select" value={currentSelectedClass} onChange={(e) => setCurrentSelectedClass(e.target.value)} className="p-2 border rounded-md">{currentClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        ) : (
                           <p className="text-gray-500">No classes created yet.</p>
                        )}
                     </div>
                     <h3 className="text-xl font-bold text-gray-800 mb-4">{adminTab === 'talents' ? 'Talent' : 'Product'} Order (Drag to Reorder)</h3>

                     {adminTab === 'products' && (
                         <div className="bg-white rounded-lg shadow-md border overflow-hidden">{allProducts.map((p, index) => (<div key={p.id} draggable onDragStart={(e) => handleProductDragStart(e, index)} onDragOver={(e) => handleProductDragOver(e, index)} onDragEnd={handleProductDragEnd} className="flex items-center justify-between p-4 border-b last:border-b-0 cursor-move"><div className="flex items-center"><GripVertical className="h-5 w-5 text-gray-400 mr-4" /><img className="h-10 w-10 rounded-md object-cover mr-4" src={p.imageUrl || p.imageUrls?.[0]} alt={p.name} /><div><p className="font-medium text-gray-900">{p.name}</p><p className="text-xs text-gray-500">{p.vendor}</p></div></div><div className="flex space-x-4"><button onClick={() => onEditProduct(p)} className="text-blue-600 hover:text-blue-800 cursor-pointer"><Edit className="h-5 w-5" /></button><button onClick={() => handleDeleteProduct(p)} className="text-red-600 hover:text-red-800 cursor-pointer"><Trash2 className="h-5 w-5" /></button></div></div>))}</div>
                     )}

                     {adminTab === 'talents' && (
                         <div className="bg-white rounded-lg shadow-md border overflow-hidden">{allTalents.map((p, index) => (<div key={p.id} draggable onDragStart={(e) => handleTalentDragStart(e, index)} onDragOver={(e) => handleTalentDragOver(e, index)} onDragEnd={handleTalentDragEnd} className="flex items-center justify-between p-4 border-b last:border-b-0 cursor-move"><div className="flex items-center"><GripVertical className="h-5 w-5 text-gray-400 mr-4" /><img className="h-10 w-10 rounded-md object-cover mr-4" src={p.imageUrl || p.imageUrls?.[0]} alt={p.name} /><div><p className="font-medium text-gray-900">{p.name}</p><p className="text-xs text-gray-500">{p.vendor}</p></div></div><div className="flex space-x-4"><button onClick={() => onEditTalent(p)} className="text-blue-600 hover:text-blue-800 cursor-pointer"><Edit className="h-5 w-5" /></button><button onClick={() => handleDeleteTalent(p)} className="text-red-600 hover:text-red-800 cursor-pointer"><Trash2 className="h-5 w-5" /></button></div></div>))}</div>
                     )}
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Vendor</h3>
                        <div className="bg-white p-6 rounded-lg shadow-md border">
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div><label className="text-sm font-medium">Username</label><input type="text" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="w-full mt-1 p-2 border rounded-md" required/></div>
                                <div><label className="text-sm font-medium">Password</label><input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full mt-1 p-2 border rounded-md" required/></div>
                                <div><label className="text-sm font-medium">Assign to Class</label><input type="text" value={newUser.class} onChange={(e) => setNewUser({...newUser, class: e.target.value})} placeholder="e.g., morning-class" className="w-full mt-1 p-2 border rounded-md" required/></div>
                                <button type="submit" disabled={isLoadingUserCreation} className="w-full py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer">{isLoadingUserCreation ? 'Creating...' : `Create ${adminTab === 'talents' ? 'Talent' : 'Product'} Vendor`}</button>
                                {userCreationMsg && <p className={`text-xs text-center mt-2 ${userCreationMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{userCreationMsg}</p>}
                            </form>
                        </div>
                    </div>

                    {/* Create Viewer Form */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Viewer</h3>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-purple-200">
                            <p className="text-xs text-gray-500 mb-4">
                                <Eye className="inline h-4 w-4 mr-1 text-purple-500" />
                                Viewers can see all classes and items but cannot make any edits.
                            </p>
                            <form onSubmit={handleCreateViewer} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Username</label>
                                    <input
                                        type="text"
                                        value={newViewer.username}
                                        onChange={(e) => setNewViewer({...newViewer, username: e.target.value})}
                                        className="w-full mt-1 p-2 border rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Password</label>
                                    <input
                                        type="password"
                                        value={newViewer.password}
                                        onChange={(e) => setNewViewer({...newViewer, password: e.target.value})}
                                        className="w-full mt-1 p-2 border rounded-md"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoadingViewerCreation}
                                    className="w-full py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 disabled:bg-purple-300 cursor-pointer"
                                >
                                    {isLoadingViewerCreation ? 'Creating...' : 'Create Viewer'}
                                </button>
                                {viewerCreationMsg && (
                                    <p className={`text-xs text-center mt-2 ${viewerCreationMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
                                        {viewerCreationMsg}
                                    </p>
                                )}
                            </form>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Admin Actions</h3>
                        <div className="bg-white p-6 rounded-lg shadow-md border space-y-3">
                            <button
                                onClick={() => setShowDeleteUsersModal(true)}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                                <Users className="h-5 w-5" />
                                <span>Manage Users</span>
                            </button>
                            <button
                                onClick={() => setShowManageClassesModal(true)}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                            >
                                <FolderPlus className="h-5 w-5" />
                                <span>Manage {adminTab === 'talents' ? 'Avatar' : 'Product'} Classes</span>
                            </button>
                            <button
                                onClick={handleMigrateTags}
                                disabled={isMigrating}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer disabled:bg-orange-300"
                            >
                                <RefreshCw className={`h-5 w-5 ${isMigrating ? 'animate-spin' : ''}`} />
                                <span>{isMigrating ? 'Migrating...' : `Migrate Old ${adminTab === 'talents' ? 'Talent' : 'Product'} Tags`}</span>
                            </button>
                            {migrationMsg && (
                                <p className={`text-xs text-center ${migrationMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>
                                    {migrationMsg}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <DeleteUsersModal isOpen={showDeleteUsersModal} onClose={() => setShowDeleteUsersModal(false)} />
            <ManageClassesModal isOpen={showManageClassesModal} onClose={() => setShowManageClassesModal(false)} collectionName={classCollectionName} />
        </div>
    );
};

const AdminClassSelector = ({ classes, adminViewingClass, setAdminViewingClass }) => (
    <div className="container mx-auto px-4 pt-6 pb-2 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm border border-blue-200">
            <Eye className="h-6 w-6 text-blue-600" />
            <label htmlFor="admin-class-select" className="font-bold text-gray-700">Admin View:</label>
            <select
                id="admin-class-select"
                value={adminViewingClass}
                onChange={(e) => setAdminViewingClass(e.target.value)}
                className="p-2 border rounded-md w-full max-w-xs"
            >
                <option value="">-- Select a Class to View --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>
    </div>
);


// --- MAIN APP COMPONENT ---
export default function App() {
  const [view, setView] = useState({ page: 'home', id: null });
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [talents, setTalents] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [avatarClasses, setAvatarClasses] = useState([]);
  const [adminViewingClass, setAdminViewingClass] = useState('');
  const [avatarAdminViewingClass, setAvatarAdminViewingClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('featured');
  const [avatarSortOrder, setAvatarSortOrder] = useState('featured');


  const handleSignOut = async () => {
      setAdminViewingClass('');
      setAvatarAdminViewingClass('');
      await signOut(auth);
  };

  useEffect(() => {
      const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
          if (currentUser) {
              const tokenResult = await currentUser.getIdTokenResult();
              currentUser.customClaims = tokenResult.claims;
              setUser(currentUser);
          } else {
              setUser(null);
          }
          setLoading(false);
      });
      return () => unsubscribe();
  }, []);

  // FIXED: Add useEffect to scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Product classes subscription
  useEffect(() => {
    const q = query(collection(db, "classes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Avatar classes subscription
  useEffect(() => {
    const q = query(collection(db, "avatar-classes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setAvatarClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Products subscription
  useEffect(() => {
      if (!user) {
          setProducts([]);
          return;
      }

      const isSuperAdmin = (user.customClaims && user.customClaims.superAdmin === true) || user.uid === SUPER_ADMIN_UID;
      const isViewerUser = checkIsViewer(user);
      let q;

      // Both super admin and viewer can see all classes
      if (isSuperAdmin || isViewerUser) {
          if (adminViewingClass) {
            q = query(collection(db, "products"), where("class", "==", adminViewingClass), orderBy("featuredOrder", "asc"));
          } else {
            setProducts([]);
            return; // Return early if no class is selected
          }
      } else if (user.customClaims.class) {
          q = query(collection(db, "products"), where("class", "==", user.customClaims.class), orderBy("featuredOrder", "asc"));
      }

      if (q) {
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(prods);
        });
        return () => unsubscribe();
      }
  }, [user, adminViewingClass]);

  // Talents subscription
  useEffect(() => {
      if (!user) {
          setTalents([]);
          return;
      }

      const isSuperAdmin = (user.customClaims && user.customClaims.superAdmin === true) || user.uid === SUPER_ADMIN_UID;
      const isViewerUser = checkIsViewer(user);
      let q;

      if (isSuperAdmin || isViewerUser) {
          if (avatarAdminViewingClass) {
            q = query(collection(db, "avatars"), where("class", "==", avatarAdminViewingClass), orderBy("featuredOrder", "asc"));
          } else {
            setTalents([]);
            return;
          }
      } else if (user.customClaims.avatarClass) {
          q = query(collection(db, "avatars"), where("class", "==", user.customClaims.avatarClass), orderBy("featuredOrder", "asc"));
      }

      if (q) {
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTalents(items);
        });
        return () => unsubscribe();
      }
  }, [user, avatarAdminViewingClass]);

  // Memoized hook to handle filtering and sorting of products
  const displayedProducts = useMemo(() => {
    let filtered = [...products];

    // 1. Search Filter
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        // Check name
        if (p.name.toLowerCase().includes(lowercasedQuery)) return true;

        // Check tags - handle both old and new format
        if (p.tags) {
          if (Array.isArray(p.tags)) {
            // Old format
            if (p.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery))) return true;
          } else if (typeof p.tags === 'object') {
            // New format
            const allTags = [...(p.tags.trigger || []), ...(p.tags.solution || [])];
            if (allTags.some(tag => tag.toLowerCase().includes(lowercasedQuery))) return true;
          }
        }

        return false;
      });
    }

    // 2. Sorting
    switch (sortOrder) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
         filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        // Ensure createdAt exists and has seconds property before sorting
        filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        break;
      case 'featured':
      default:
        // Default order is already by 'featuredOrder' from the Firestore query
        break;
    }

    return filtered;
  }, [products, searchQuery, sortOrder]);

  // Memoized hook to handle filtering and sorting of talents
  const displayedTalents = useMemo(() => {
    let filtered = [...talents];

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        if (p.name.toLowerCase().includes(lowercasedQuery)) return true;

        if (p.tags) {
          if (Array.isArray(p.tags)) {
            if (p.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery))) return true;
          } else if (typeof p.tags === 'object') {
            const allTags = [...(p.tags.trigger || []), ...(p.tags.solution || [])];
            if (allTags.some(tag => tag.toLowerCase().includes(lowercasedQuery))) return true;
          }
        }

        return false;
      });
    }

    switch (avatarSortOrder) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
         filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        break;
      case 'featured':
      default:
        break;
    }

    return filtered;
  }, [talents, searchQuery, avatarSortOrder]);

  const renderView = () => {
    if (loading) { return <div className="min-h-screen flex items-center justify-center text-lg">Loading Application...</div> }
    if (!user) { return <LoginScreen/> }

    const isSuperAdmin = (user.customClaims && user.customClaims.superAdmin === true) || user.uid === SUPER_ADMIN_UID;
    const isViewerUser = checkIsViewer(user);
    const hasAvatarAccess = isSuperAdmin || isViewerUser || !!user.customClaims?.avatarClass;

    switch (view.page) {
      case 'product':
        const product = products.find(p => p.id === view.id);
        return product ? <ProductPage product={product} setView={setView} user={user} /> : <div className="text-center py-10">Product not found.</div>;
      case 'talent':
        if (!hasAvatarAccess) {
            return <div className="text-center py-10">You do not have access to view talent.</div>;
        }
        const talent = talents.find(p => p.id === view.id);
        return talent ? <TalentPage talent={talent} setView={setView} user={user} /> : <div className="text-center py-10">Talent not found.</div>;
      case 'dashboard':
          // Viewers cannot access dashboard
          if (isViewerUser) {
            return <div className="text-center py-10">Viewers do not have dashboard access.</div>;
          }
          return isSuperAdmin
            ? <main className="container mx-auto px-4 py-8"><SuperAdminDashboard user={user} onEditProduct={(p) => setView({ page: 'create_product', product: p })} onEditTalent={(p) => setView({ page: 'create_talent', talent: p })} /></main>
            : <main className="container mx-auto px-4 py-8"><VendorDashboard user={user} setView={setView} onEditProduct={(p) => setView({ page: 'create_product', product: p })} onEditTalent={(p) => setView({ page: 'create_talent', talent: p })} /></main>;
      case 'create_product':
          // Viewers cannot create/edit products
          if (isViewerUser) {
            return <div className="text-center py-10">Viewers cannot create or edit products.</div>;
          }
          return <main className="container mx-auto px-4 py-8"><CreateItemForm setVendorView={() => setView({ page: 'dashboard' })} user={user} editingItem={view.product} mode="product" /></main>;
      case 'create_talent':
          // Viewers cannot create/edit talent
          if (isViewerUser) {
            return <div className="text-center py-10">Viewers cannot create or edit talent.</div>;
          }
          if (!hasAvatarAccess) {
            return <div className="text-center py-10">You do not have access to create talent.</div>;
          }
          return <main className="container mx-auto px-4 py-8"><CreateItemForm setVendorView={() => setView({ page: 'dashboard' })} user={user} editingItem={view.talent} mode="talent" /></main>;
      case 'home':
      default:
        return (
            <>
                <TabBar activeTab={activeTab} setActiveTab={setActiveTab} showAvatarTab={hasAvatarAccess} />
                {activeTab === 'products' && (
                    <>
                        {(isSuperAdmin || isViewerUser) && <AdminClassSelector classes={classes} adminViewingClass={adminViewingClass} setAdminViewingClass={setAdminViewingClass} />}
                        <ProductGrid products={displayedProducts} setView={setView} sortOrder={sortOrder} setSortOrder={setSortOrder} />
                    </>
                )}
                {activeTab === 'talents' && hasAvatarAccess && (
                    <>
                        {(isSuperAdmin || isViewerUser) && <AdminClassSelector classes={avatarClasses} adminViewingClass={avatarAdminViewingClass} setAdminViewingClass={setAvatarAdminViewingClass} />}
                        <TalentGrid talents={displayedTalents} setView={setView} sortOrder={avatarSortOrder} setSortOrder={setAvatarSortOrder} />
                    </>
                )}
            </>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
        <Header setView={setView} user={user} onSignOut={handleSignOut} searchQuery={searchQuery} setSearchQuery={setSearchQuery} activeTab={activeTab} />
        {renderView()}
        <Footer />
    </div>
  );
}