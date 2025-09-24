"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Store, Search, UserCircle, Star, ArrowLeft, LogIn, PlusCircle, ImageIcon, Video, Trash2, Edit, LogOut, ShieldCheck, GripVertical, ChevronDown, ChevronUp, X } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "firebase/auth";
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    getDocs,
    writeBatch,
    orderBy
} from "firebase/firestore";
import {
    getStorage,
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";


// --- FIREBASE INITIALIZATION ---
// IMPORTANT: Replace with your own Firebase configuration from your project settings
const firebaseConfig = {
  apiKey: "AIzaSyDiCbTkbfn3LHAZnvlBxYZEDU1Ng_LftdA",
  authDomain: "nextshop-a17fe.firebaseapp.com",
  projectId: "nextshop-a17fe",
  storageBucket: "nextshop-a17fe.firebasestorage.app",
  messagingSenderId: "135352358131",
  appId: "1:135352358131:web:1eed317a816366721f1386",
  measurementId: "G-98EJ5Y0RMG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
// Explicitly connect to the correct Cloud Functions region
const functions = getFunctions(app, 'us-central1'); 


// --- SUPER ADMIN CONFIGURATION ---
// IMPORTANT: Replace with the actual UID of your designated admin user from Firebase Authentication
const SUPER_ADMIN_UID = "RnBej9HSStVJXA0rtIB02W0R1yv2";


// --- UI COMPONENTS ---

const StarRating = ({ rating, reviewCount }) => (
    <div className="flex items-center">
        <div className="flex items-center">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />))}</div>
        {reviewCount !== undefined && <span className="ml-2 text-sm text-gray-500">({reviewCount})</span>}
    </div>
);

const Header = ({ setView, searchTerm, setSearchTerm, user, onSignOut }) => {
    const goHome = () => {
        setSearchTerm('');
        setView({ page: 'home' });
    }
    const isSuperAdmin = user && user.uid === SUPER_ADMIN_UID;
    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                <button onClick={goHome} className="flex items-center space-x-2"><Store className="h-8 w-8 text-blue-600" /><span className="text-2xl font-bold text-gray-800">ShopNext</span></button>
                <div className="flex-1 max-w-xl mx-4">
                    <form onSubmit={(e) => e.preventDefault()} className="relative">
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search for products, brands, and more" className="w-full py-2 pl-4 pr-12 text-gray-700 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <div className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-500"><Search className="h-5 w-5" /></div>
                    </form>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={() => setView({ page: 'vendor' })} className={`flex items-center space-x-2 text-white px-4 py-2 rounded-full transition-colors bg-blue-600 hover:bg-blue-700`}>
                        {isSuperAdmin ? <ShieldCheck className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
                        <span>{user ? 'My Dashboard' : 'Sign In'}</span>
                    </button>
                    {user && (
                         <button onClick={onSignOut} title="Sign Out" className="text-gray-500 hover:text-red-600 transition-colors">
                            <LogOut className="h-6 w-6" />
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
};

const Footer = () => (
    <footer className="bg-gray-800 text-white mt-12"><div className="container mx-auto px-4 py-6 text-center"><p>&copy; 2025 ShopNext. All rights reserved.</p><p className="text-sm text-gray-400">A prototype for educational purposes.</p></div></footer>
);

const ProductCard = ({ product, setView }) => (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col">
        <div className="relative"><img src={product.imageUrl || 'https://placehold.co/600x400/e2e8f0/4a5568?text=Image'} alt={product.name} className="w-full h-48 object-cover" /></div>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-gray-800 truncate">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-2 truncate">{product.subtitle}</p>
            <div className="flex-grow">
                 <div className="flex flex-wrap gap-1 mb-2">
                    {(product.tags || []).slice(0, 3).map(tag => <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">#{tag}</span>)}
                </div>
            </div>
            <div className="flex justify-between items-center mt-2"><p className="text-xl font-extrabold text-blue-600">${parseFloat(product.price).toFixed(2)}</p><StarRating rating={product.rating} reviewCount={product.reviewCount} /></div>
            <button onClick={() => setView({ page: 'product', id: product.id })} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-full font-semibold hover:bg-blue-600 transition-colors">View Details</button>
        </div>
    </div>
);

const HomePage = ({ products, setView }) => {
    const [sortedProducts, setSortedProducts] = useState([]);
    const [sortOption, setSortOption] = useState('featured');

    useEffect(() => {
        let tempProducts = [...products];
        switch(sortOption) {
            case 'price-asc':
                tempProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                tempProducts.sort((a, b) => b.price - a.price);
                break;
            case 'rating-desc':
                tempProducts.sort((a, b) => b.rating - a.rating);
                break;
            case 'featured':
            default:
                 tempProducts.sort((a,b) => (a.featuredOrder || 999) - (b.featuredOrder || 999));
                 break;
        }
        setSortedProducts(tempProducts);
    }, [products, sortOption]);

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900">Featured Products</h2>
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                    <option value="featured">Sort: Featured</option>
                    <option value="price-asc">Sort: Price Low to High</option>
                    <option value="price-desc">Sort: Price High to Low</option>
                    <option value="rating-desc">Sort: Top Rated</option>
                </select>
            </div>
            {sortedProducts.length > 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{sortedProducts.map(product => (<ProductCard key={product.id} product={product} setView={setView} />))}</div>) : (<div className="text-center py-16"><p className="text-gray-500 text-lg">No products found. Try a different search or filter.</p></div>)}
        </main>
    );
};

const ReviewFormComponent = ({ productId, user }) => {
    const [ratings, setRatings] = useState({ attention: 0, persuasion: 0, brandedRecall: 0, liking: 0 });
    const [text, setText] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
    const criteria = ['attention', 'persuasion', 'brandedRecall', 'liking'];
    const handleRatingChange = (criterion, value) => { setRatings(prev => ({ ...prev, [criterion]: value })); };
    const updateProductRatingAfterSubmission = async () => { const reviewsRef = collection(db, "products", productId, "reviews"); const reviewsSnapshot = await getDocs(reviewsRef); const newReviewCount = reviewsSnapshot.size; let totalRating = 0; reviewsSnapshot.forEach(doc => { totalRating += doc.data().overallRating; }); const newAverageRating = newReviewCount > 0 ? totalRating / newReviewCount : 0; await updateDoc(doc(db, "products", productId), { rating: newAverageRating, reviewCount: newReviewCount }); };
    const handleReviewSubmit = async (e) => { e.preventDefault(); setError(''); setSuccess(''); if (Object.values(ratings).some(r => r === 0) || !text) { setError('Please provide a rating for all criteria and write a review.'); return; } const overallRating = Object.values(ratings).reduce((a, b) => a + b, 0) / criteria.length; try { await addDoc(collection(db, "products", productId, "reviews"), { userId: user.uid, username: user.email.split('@')[0], ...ratings, overallRating, text, createdAt: serverTimestamp() }); await updateProductRatingAfterSubmission(); setSuccess('Thank you for your review!'); setRatings({ attention: 0, persuasion: 0, brandedRecall: 0, liking: 0 }); setText(''); } catch (err) { setError('Failed to submit review. ' + err.message); } };
    return (<div className="bg-white p-6 rounded-lg shadow-md border mt-8"><h3 className="text-xl font-bold text-gray-800 mb-4">Leave a Review</h3><form onSubmit={handleReviewSubmit} className="space-y-4">{criteria.map(criterion => (<div key={criterion} className="flex flex-col sm:flex-row justify-between sm:items-center"><span className="capitalize text-gray-700 mb-2 sm:mb-0">{criterion.replace(/([A-Z])/g, ' $1')}</span><div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-6 w-6 cursor-pointer ${i < ratings[criterion] ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} onClick={() => handleRatingChange(criterion, i + 1)} />))}</div></div>))}<div><textarea value={text} onChange={(e) => setText(e.target.value)} rows="4" placeholder="Share your thoughts..." className="w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}{success && <p className="text-sm text-green-500 text-center">{success}</p>}<button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700">Submit Review</button></form></div>);
};

const ProductPage = ({ product, setView, user }) => {
    const initialMedia = (product.imageUrls && product.imageUrls.length > 0)
        ? { type: 'image', src: product.imageUrls[0] }
        : (product.videoUrls && product.videoUrls.length > 0)
            ? { type: 'video', src: product.videoUrls[0] }
            : { type: 'image', src: 'https://placehold.co/1280x720/e2e8f0/4a5568?text=Image' };

    const [activeMedia, setActiveMedia] = useState(initialMedia);
    const [reviews, setReviews] = useState([]);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(query(collection(db, "products", product.id, "reviews"), orderBy("createdAt", "desc")), (snapshot) => {
            setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [product.id]);

    const allMedia = [
        ...(product.imageUrls || []).map(src => ({ type: 'image', src })),
        ...(product.videoUrls || []).map(src => ({ type: 'video', src }))
    ];

    return (
        <main className="container mx-auto px-4 py-8">
            <button onClick={() => setView({ page: 'home' })} className="flex items-center text-blue-600 hover:underline mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back to products</button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Media Column */}
                <div>
                    <div className="mb-4 aspect-video bg-black rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                        {activeMedia.type === 'image' ? (
                            <img src={activeMedia.src} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <video key={activeMedia.src} src={activeMedia.src} controls autoPlay muted className="w-full h-full object-cover"></video>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {allMedia.map((media, index) => (
                            <button key={index} onClick={() => setActiveMedia(media)} className={`w-20 h-20 rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${activeMedia.src === media.src ? 'border-blue-500' : 'border-transparent'}`}>
                                {media.type === 'image' ? (
                                    <img src={media.src} alt={`thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-black flex items-center justify-center relative"><div className="absolute inset-0 bg-black opacity-50"></div><Video className="h-8 w-8 text-white z-10" /></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Details Column */}
                <div>
                    <span className="text-sm font-semibold text-gray-500">{product.vendor}</span>
                    <h1 className="text-4xl font-extrabold text-gray-900 mt-1">{product.name}</h1>
                    <p className="text-lg text-gray-600 mt-2">{product.subtitle}</p>
                    <div className="my-4"><StarRating rating={product.rating} reviewCount={product.reviewCount} /></div>
                    <p className="text-3xl font-bold text-blue-600">${parseFloat(product.price).toFixed(2)}</p>
                    <div className="mt-6 border-t pt-4">
                        <h3 className="text-lg font-bold text-gray-800">Summary</h3>
                        <p className="text-gray-600 mt-2">{product.shortDescription}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        {(product.highlights || []).map((highlight, index) => (
                            <div key={index} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <p className="font-bold text-blue-800">{highlight.title}</p>
                                <p className="text-sm text-blue-700">{highlight.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-12 max-w-[1100px] mx-auto"><div className="border-t"><button onClick={() => setIsDetailsOpen(!isDetailsOpen)} className="w-full flex justify-between items-center py-4 text-left"><div><h2 className="text-2xl font-bold text-gray-800">About this item</h2><p className="text-sm text-gray-500">Product Details</p></div>{isDetailsOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}</button>{isDetailsOpen && (<div className="pb-4 text-gray-600 prose max-w-none"><p>{product.longDescription}</p></div>)}</div></div>
            <div className="mt-12 max-w-[1100px] mx-auto"><h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Reviews</h2>{reviews.length > 0 ? (<div className="space-y-6">{reviews.map(review => (<div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border"><div className="flex items-center mb-2"><StarRating rating={review.overallRating} /><span className="ml-4 font-bold text-gray-800">{review.username}</span></div><p className="text-gray-600">{review.text}</p></div>))}</div>) : (<p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>)}{user && <ReviewFormComponent productId={product.id} user={user} />}</div>
        </main>
    );
};


const VendorLogin = () => {
    const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState('');
    const formatEmail = (user) => `${user.trim()}@shopnext.dev`;
    const handleSignUp = async (e) => { e.preventDefault(); setError(''); if (!username || !password) { setError("Username and password cannot be empty."); return; } try { await createUserWithEmailAndPassword(auth, formatEmail(username), password); } catch (err) { setError(err.message); } };
    const handleSignIn = async (e) => { e.preventDefault(); setError(''); if (!username || !password) { setError("Username and password cannot be empty."); return; } try { await signInWithEmailAndPassword(auth, formatEmail(username), password); } catch (err) { setError(err.message); } };
    return (<div className="flex items-center justify-center min-h-[60vh]"><div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border"><h2 className="text-2xl font-bold text-center text-gray-800">Vendor Login</h2><form className="space-y-4"><div><label className="text-sm font-medium text-gray-700">Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g., ElectroGadgets" className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><div><label className="text-sm font-medium text-gray-700">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}<div className="flex space-x-2"><button onClick={handleSignIn} className="w-full py-3 font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center"><LogIn className="h-5 w-5 mr-2"/>Sign In</button><button onClick={handleSignUp} className="w-full py-3 font-semibold text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors">Sign Up</button></div></form><p className="text-xs text-center text-gray-500">For this demo, you can Sign Up to create an account.</p></div></div>);
};

const CreateProductForm = ({ setVendorView, user, editingProduct }) => {
    const [product, setProduct] = useState({ name: '', subtitle: '', shortDescription: '', longDescription: '', price: '', category: '' });
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [highlights, setHighlights] = useState([{ title: '', text: '' }]);
    const [imageUrls, setImageUrls] = useState([]);
    const [videoUrls, setVideoUrls] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (editingProduct) {
            setProduct({ name: editingProduct.name || '', subtitle: editingProduct.subtitle || '', shortDescription: editingProduct.shortDescription || '', longDescription: editingProduct.longDescription || '', price: editingProduct.price || '', category: editingProduct.category || '' });
            setTags(editingProduct.tags || []);
            setHighlights(editingProduct.highlights && editingProduct.highlights.length > 0 ? editingProduct.highlights : [{ title: '', text: '' }]);
            setImageUrls(editingProduct.imageUrls || []);
            setVideoUrls(editingProduct.videoUrls || []);
        } else {
            setProduct({ name: '', subtitle: '', shortDescription: '', longDescription: '', price: '', category: '' });
            setTags([]);
            setHighlights([{ title: '', text: '' }]);
            setImageUrls([]);
            setVideoUrls([]);
        }
    }, [editingProduct]);

    const handleFileChange = (e) => { const files = Array.from(e.target.files); files.forEach(file => { const fileType = file.type.startsWith('image/') ? 'image' : 'video'; if (fileType === 'image' && imageUrls.length >= 5) { setError('You can upload a maximum of 5 photos.'); return; } if (fileType === 'video' && videoUrls.length >= 2) { setError('You can upload a maximum of 2 videos.'); return; } handleFileUpload(file, fileType); }); };
    const handleFileUpload = (file, fileType) => { if (!file) return; setIsUploading(true); const folder = fileType === 'image' ? 'products' : 'product-videos'; const fileRef = storageRef(storage, `${folder}/${Date.now()}_${file.name}`); const uploadTask = uploadBytesResumable(fileRef, file); uploadTask.on('state_changed', (snapshot) => {}, (error) => { setError(`Upload failed for ${file.name}: ${error.message}`); setIsUploading(false); }, () => { getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => { if (fileType === 'image') setImageUrls(prev => [...prev, downloadURL]); else setVideoUrls(prev => [...prev, downloadURL]); setIsUploading(false); }); }); };
    const handleChange = (e) => { const { name, value } = e.target; setProduct(prev => ({ ...prev, [name]: value })); };
    
    const handleTagInput = (e) => {
        if ((e.key === ',' || e.key === 'Enter') && tagInput.trim() !== '') {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };
    const removeTag = (tagToRemove) => { setTags(tags.filter(tag => tag !== tagToRemove)); };

    const handleHighlightChange = (index, field, value) => { const newHighlights = [...highlights]; newHighlights[index][field] = value; setHighlights(newHighlights); };
    const addHighlight = () => { if (highlights.length < 6) setHighlights([...highlights, { title: '', text: '' }]); };
    const removeHighlight = (index) => { if (highlights.length > 1) setHighlights(highlights.filter((_, i) => i !== index)); };

    const handleSaveProduct = async (e) => { e.preventDefault(); setError(''); setSuccess(''); if (!product.name || !product.price) { setError('Product Name and Price are required.'); return; } try { const commonData = { ...product, price: parseFloat(product.price), tags, highlights: highlights.filter(h => h.title && h.text), imageUrls, videoUrls, imageUrl: imageUrls.length > 0 ? imageUrls[0] : '' }; if (editingProduct) { await updateDoc(doc(db, "products", editingProduct.id), { ...commonData, featuredOrder: editingProduct.featuredOrder !== undefined ? editingProduct.featuredOrder : 999 }); setSuccess('Product updated successfully!'); } else { await addDoc(collection(db, "products"), { ...commonData, vendorId: user.uid, vendor: user.email.split('@')[0], createdAt: serverTimestamp(), rating: 0, reviewCount: 0, featuredOrder: Date.now() }); setSuccess('Product saved successfully!'); } setTimeout(() => { setVendorView('dashboard'); }, 1500); } catch (err) { setError('Failed to save product. ' + err.message); } };
    
    return (<div className="bg-white p-8 rounded-lg shadow-md border max-w-3xl mx-auto"><h3 className="text-xl font-bold mb-6 text-gray-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3><form onSubmit={handleSaveProduct} className="space-y-6"><div><label>Product Name</label><input name="name" value={product.name} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md"/></div><div><label>Subtitle</label><input name="subtitle" value={product.subtitle} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md"/></div><div><label>Short Description</label><textarea name="shortDescription" value={product.shortDescription} onChange={handleChange} rows="2" className="w-full mt-1 p-2 border rounded-md"></textarea></div><div><label>Product Highlights (Up to 6)</label>{highlights.map((h, i) => (<div key={i} className="flex items-center gap-2 mt-2"><input value={h.title} onChange={(e) => handleHighlightChange(i, 'title', e.target.value)} placeholder="Bold Title" className="p-2 border rounded-md w-1/3"/><input value={h.text} onChange={(e) => handleHighlightChange(i, 'text', e.target.value)} placeholder="Sub-headline" className="p-2 border rounded-md flex-grow"/><button type="button" onClick={() => removeHighlight(i)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><X size={16}/></button></div>))}{highlights.length < 6 && <button type="button" onClick={addHighlight} className="text-sm text-blue-600 mt-2">Add Highlight</button>}</div><div><label>Long Description</label><textarea name="longDescription" value={product.longDescription} onChange={handleChange} rows="5" className="w-full mt-1 p-2 border rounded-md"></textarea></div><div className="grid grid-cols-2 gap-4"><div><label>Price</label><input name="price" value={product.price} onChange={handleChange} type="number" step="0.01" className="w-full mt-1 p-2 border rounded-md"/></div><div><label>Category</label><input name="category" value={product.category} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md"/></div></div><div><label>Tags</label><div className="flex flex-wrap gap-2 p-2 border rounded-md mt-1">{tags.map(tag => (<span key={tag} className="flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm">{tag}<button type="button" onClick={() => removeTag(tag)} className="ml-2 text-gray-500 hover:text-gray-800"><X size={14}/></button></span>))}<input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagInput} placeholder="Add a tag..." className="flex-grow p-1 focus:outline-none"/></div></div><div><p className="block text-sm font-medium text-gray-700 mb-2">Product Media (5 photos, 2 videos max)</p><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" multiple /><button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading} className="flex items-center justify-center w-full py-2 px-4 border border-dashed rounded-md"> <PlusCircle className="h-5 w-5 mr-2"/>Add Media</button><div className="mt-4 flex flex-wrap gap-4">{imageUrls.map(url => <img key={url} src={url} className="w-24 h-24 object-cover rounded-md"/>)}{videoUrls.map(url => <div key={url} className="w-24 h-24 bg-black rounded-md flex items-center justify-center"><Video className="h-8 w-8 text-white"/></div>)}</div></div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}{success && <p className="text-sm text-green-500 text-center">{success}</p>}<div className="flex justify-end space-x-4"><button type="button" onClick={() => setVendorView('dashboard')} className="px-6 py-2 border rounded-full">Cancel</button><button type="submit" disabled={isUploading} className="px-6 py-2 bg-blue-600 text-white rounded-full">{isUploading ? 'Uploading...' : 'Save Product'}</button></div></form></div>);
};


const VendorDashboard = ({ setVendorView, user, onEditProduct }) => {
    const [vendorProducts, setVendorProducts] = useState([]);
    useEffect(() => { if (user) { const q = query(collection(db, "products"), where("vendorId", "==", user.uid)); const unsubscribe = onSnapshot(q, (snapshot) => { setVendorProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); return () => unsubscribe(); } }, [user]);
    const handleDeleteProduct = async (product) => { if(window.confirm("Are you sure?")) { try { await deleteDoc(doc(db, "products", product.id)); (product.imageUrls || []).forEach(url => deleteObject(storageRef(storage, url))); (product.videoUrls || []).forEach(url => deleteObject(storageRef(storage, url))); } catch (error) { console.error("Error deleting product: ", error); } }};
    return (<div><div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-bold text-gray-800">My Products ({vendorProducts.length})</h2><p className="text-sm text-gray-500">Logged in as: {user?.email.split('@')[0]}</p></div><div className="flex items-center"><button onClick={() => { onEditProduct(null); setVendorView('create');}} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors mr-4"><PlusCircle className="h-5 w-5 mr-2" />Add New Product</button></div></div><div className="bg-white rounded-lg shadow-md border overflow-hidden"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{vendorProducts.map(p => (<tr key={p.id}><td className="px-6 py-4"><div className="flex items-center"><img className="h-10 w-10 rounded-md object-cover mr-4" src={p.imageUrl || p.imageUrls?.[0]} alt={p.name} /><span className="font-medium text-gray-900">{p.name}</span></div></td><td className="px-6 py-4 text-gray-600">${parseFloat(p.price).toFixed(2)}</td><td className="px-6 py-4"><StarRating rating={p.rating} reviewCount={p.reviewCount} /></td><td className="px-6 py-4"><div className="flex space-x-4"><button onClick={() => onEditProduct(p)} className="text-blue-600 hover:text-blue-800"><Edit className="h-5 w-5" /></button><button onClick={() => handleDeleteProduct(p)} className="text-red-600 hover:text-red-800"><Trash2 className="h-5 w-5" /></button></div></td></tr>))}</tbody></table></div></div>);
};

const SuperAdminDashboard = ({ user, onEditProduct }) => {
    const [allProducts, setAllProducts] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [newUser, setNewUser] = useState({username: '', password: ''});
    const [userCreationMsg, setUserCreationMsg] = useState('');
    const [isLoadingUserCreation, setIsLoadingUserCreation] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("featuredOrder", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllProducts(prods);
        });
        return () => unsubscribe();
    }, []);

    const handleDeleteProduct = async (product) => { if(window.confirm("Are you sure?")) { try { await deleteDoc(doc(db, "products", product.id)); (product.imageUrls || []).forEach(url => deleteObject(storageRef(storage, url))); (product.videoUrls || []).forEach(url => deleteObject(storageRef(storage, url))); } catch (error) { console.error("Error deleting product: ", error); } }};
    
    const handleDragStart = (e, index) => { setDraggedItem(allProducts[index]); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e, index) => { e.preventDefault(); const draggedOverItem = allProducts[index]; if (draggedItem === draggedOverItem) { return; } let items = allProducts.filter(item => item !== draggedItem); items.splice(index, 0, draggedItem); setAllProducts(items); };
    const handleDragEnd = async () => { setDraggedItem(null); const batch = writeBatch(db); allProducts.forEach((product, index) => { const productRef = doc(db, "products", product.id); batch.update(productRef, { featuredOrder: index }); }); await batch.commit(); };

    const handleCreateUser = async (e) => { e.preventDefault(); if (newUser.username.length < 3) { setUserCreationMsg("Error: Username must be at least 3 characters long."); return; } if (newUser.password.length < 6) { setUserCreationMsg("Error: Password must be at least 6 characters long."); return; } setIsLoadingUserCreation(true); setUserCreationMsg(''); try { const createNewVendor = httpsCallable(functions, 'createNewVendor'); const result = await createNewVendor({ username: newUser.username, password: newUser.password }); setUserCreationMsg(result.data.result); setNewUser({ username: '', password: '' }); } catch (error) { setUserCreationMsg(`Error: ${error.message}`); } setIsLoadingUserCreation(false); };

    return (
        <div>
            <div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-bold text-gray-800">Super Admin Dashboard</h2><p className="text-sm text-gray-500">Welcome, {user?.email.split('@')[0]}</p></div></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                     <h3 className="text-xl font-bold text-gray-800 mb-4">Manage Product Order (Drag to Reorder)</h3>
                     <div className="bg-white rounded-lg shadow-md border overflow-hidden">
                        {allProducts.map((p, index) => (
                            <div key={p.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd} className="flex items-center justify-between p-4 border-b last:border-b-0 cursor-move">
                                <div className="flex items-center"><GripVertical className="h-5 w-5 text-gray-400 mr-4" /><img className="h-10 w-10 rounded-md object-cover mr-4" src={p.imageUrl || p.imageUrls?.[0]} alt={p.name} /><div><p className="font-medium text-gray-900">{p.name}</p><p className="text-xs text-gray-500">{p.vendor}</p></div></div>
                                <div className="flex space-x-4"><button onClick={() => onEditProduct(p)} className="text-blue-600 hover:text-blue-800"><Edit className="h-5 w-5" /></button><button onClick={() => handleDeleteProduct(p)} className="text-red-600 hover:text-red-800"><Trash2 className="h-5 w-5" /></button></div>
                            </div>
                        ))}
                     </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Vendor</h3>
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div><label className="text-sm font-medium">Username</label><input type="text" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="w-full mt-1 p-2 border rounded-md" required/></div>
                            <div><label className="text-sm font-medium">Password</label><input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full mt-1 p-2 border rounded-md" required/></div>
                            <button type="submit" disabled={isLoadingUserCreation} className="w-full py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:bg-blue-300">
                                {isLoadingUserCreation ? 'Creating...' : 'Create Vendor'}
                            </button>
                            {userCreationMsg && <p className={`text-xs text-center mt-2 ${userCreationMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{userCreationMsg}</p>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};


const VendorArea = ({ setView, user }) => {
    const [vendorView, setVendorView] = useState('dashboard'); const [editingProduct, setEditingProduct] = useState(null);
    const handleEditProduct = (product) => { setEditingProduct(product); setVendorView('create'); };
    const handleFormClose = () => { setEditingProduct(null); setVendorView('dashboard'); };
    const isSuperAdmin = user && user.uid === SUPER_ADMIN_UID;
    
    const renderContent = () => {
        if (!user) return <VendorLogin />;
        if (isSuperAdmin) {
            return vendorView === 'create' 
                ? <CreateProductForm setVendorView={handleFormClose} user={user} editingProduct={editingProduct} /> 
                : <SuperAdminDashboard user={user} onEditProduct={handleEditProduct} />;
        }
        switch (vendorView) {
            case 'create': return <CreateProductForm setVendorView={handleFormClose} user={user} editingProduct={editingProduct} />;
            case 'dashboard': default: return <VendorDashboard setVendorView={setVendorView} user={user} onEditProduct={handleEditProduct} />;
        }
    };
    return (<main className="container mx-auto px-4 py-8">{renderContent()}</main>);
};


// --- MAIN APP COMPONENT ---

export default function App() {
  const [view, setView] = useState({ page: 'home', id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true); 

  const handleSignOut = async () => {
    await signOut(auth);
    setView({ page: 'home' }); 
  };

  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setLoading(false); }); return () => unsubscribe(); }, []);
  
  useEffect(() => { 
      const q = query(collection(db, "products")); 
      const unsubscribe = onSnapshot(q, (snapshot) => { 
          const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
          setAllProducts(prods); 
      }); 
      return () => unsubscribe(); 
  }, []);
  
  useEffect(() => {
      if (searchTerm.trim() === '') { setFilteredProducts(allProducts); } 
      else { const lowercasedQuery = searchTerm.toLowerCase(); const results = allProducts.filter(p => p.name.toLowerCase().includes(lowercasedQuery) || (p.subtitle && p.subtitle.toLowerCase().includes(lowercasedQuery)) || (p.tags && p.tags.some(t => t.toLowerCase().includes(lowercasedQuery))) || (p.vendor && p.vendor.toLowerCase().includes(lowercasedQuery))); setFilteredProducts(results); }
      if (searchTerm.trim() !== '') { setView({ page: 'home', id: null }); }
  }, [searchTerm, allProducts]);

  const renderView = () => {
    switch (view.page) {
      case 'product': const product = allProducts.find(p => p.id === view.id); return product ? <ProductPage product={product} setView={setView} user={user} /> : <HomePage products={filteredProducts} setView={setView} />;
      case 'vendor': return <VendorArea setView={setView} user={user} />;
      case 'home': default: return <HomePage products={filteredProducts} setView={setView} />;
    }
  };

  if (loading) { return <div className="min-h-screen flex items-center justify-center text-lg">Loading Application...</div> }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
        <Header 
            setView={setView} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            user={user}
            onSignOut={handleSignOut}
        />
        {renderView()}
        <Footer />
    </div>
  );
}

