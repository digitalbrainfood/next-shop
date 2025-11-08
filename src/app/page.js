"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Store, UserCircle, Star, ArrowLeft, PlusCircle, Video, Trash2, Edit, LogOut, ShieldCheck, GripVertical, ChevronDown, ChevronUp, X, Eye, Search, UserMinus, Users, FolderPlus } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onIdTokenChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp, getDocs, writeBatch, orderBy, setDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";


// --- FIREBASE INITIALIZATION ---
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
const functions = getFunctions(app, 'us-central1');


// --- SUPER ADMIN CONFIGURATION ---
const SUPER_ADMIN_UID = "RnBej9HSStVJXA0rtIB02W0R1yv2";


// --- UI COMPONENTS ---

const StarRating = ({ rating, reviewCount }) => (
    <div className="flex items-center">
        <div className="flex items-center">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />))}</div>
        {reviewCount !== undefined && <span className="ml-2 text-sm text-gray-500">({reviewCount})</span>}
    </div>
);

const Header = ({ setView, user, onSignOut, searchQuery, setSearchQuery }) => {
    const isSuperAdmin = (user && user.customClaims && user.customClaims.superAdmin === true) || (user && user.uid === SUPER_ADMIN_UID);
    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center gap-4">
                <div className="flex items-center space-x-2 cursor-pointer flex-shrink-0" onClick={() => setView({ page: 'home' })}><Store className="h-8 w-8 text-blue-600" /><span className="text-2xl font-bold text-gray-800">ShopNext</span></div>
                
                {user && (
                    <div className="relative w-full max-w-lg">
                        <input
                            type="search"
                            placeholder="Search by product name or tag..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                )}
                
                {user && (
                    <div className="flex items-center space-x-4 flex-shrink-0">
                        <button onClick={() => setView({ page: 'dashboard' })} className={`flex items-center space-x-2 text-white px-4 py-2 rounded-full transition-colors bg-blue-600 hover:bg-blue-700 cursor-pointer`}>
                            {isSuperAdmin ? <ShieldCheck className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
                            <span>My Dashboard</span>
                        </button>
                        <button onClick={onSignOut} title="Sign Out" className="text-gray-500 hover:text-red-600 transition-colors cursor-pointer"><LogOut className="h-6 w-6" /></button>
                    </div>
                )}
            </nav>
        </header>
    );
};

const Footer = () => (
    <footer className="bg-gray-800 text-white mt-12"><div className="container mx-auto px-4 py-6 text-center"><p>&copy; 2025 ShopNext. All rights reserved.</p><p className="text-sm text-gray-300">A prototype for educational purposes.</p></div></footer>
);

const ProductCard = ({ product, setView }) => (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group flex flex-col">
        <div className="relative aspect-square">
            <img src={product.imageUrl || 'https://placehold.co/600x600/e2e8f0/4a5568?text=Image'} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-gray-800 truncate">{product.name}</h3>
            <p className="text-sm text-gray-500 mb-2 truncate">{product.subtitle}</p>
            <div className="flex-grow">
                 <div className="flex flex-wrap gap-1 mb-2">{(product.tags || []).slice(0, 3).map(tag => <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">#{tag}</span>)}</div>
            </div>
            <div className="flex justify-between items-center mt-2"><p className="text-xl font-extrabold text-blue-600">${parseFloat(product.price).toFixed(2)}</p><StarRating rating={product.rating} reviewCount={product.reviewCount} /></div>
            <button onClick={() => setView({ page: 'product', id: product.id })} className="mt-4 w-full bg-blue-500 text-white py-2 rounded-full font-semibold hover:bg-blue-600 transition-colors cursor-pointer">View Details</button>
        </div>
    </div>
);

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

const ReviewFormComponent = ({ productId, user }) => {
    const [ratings, setRatings] = useState({ attention: 0, persuasion: 0, brandedRecall: 0, liking: 0 });
    const [text, setText] = useState(''); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
    const criteria = ['attention', 'persuasion', 'brandedRecall', 'liking'];
    const handleRatingChange = (criterion, value) => { setRatings(prev => ({ ...prev, [criterion]: value })); };
    const updateProductRatingAfterSubmission = async () => { const reviewsRef = collection(db, "products", productId, "reviews"); const reviewsSnapshot = await getDocs(reviewsRef); const newReviewCount = reviewsSnapshot.size; let totalRating = 0; reviewsSnapshot.forEach(doc => { totalRating += doc.data().overallRating; }); const newAverageRating = newReviewCount > 0 ? totalRating / newReviewCount : 0; await updateDoc(doc(db, "products", productId), { rating: newAverageRating, reviewCount: newReviewCount }); };
    const handleReviewSubmit = async (e) => { e.preventDefault(); setError(''); setSuccess(''); if (Object.values(ratings).some(r => r === 0) || !text) { setError('Please provide a rating for all criteria and write a review.'); return; } const overallRating = Object.values(ratings).reduce((a, b) => a + b, 0) / criteria.length; try { await addDoc(collection(db, "products", productId, "reviews"), { userId: user.uid, username: user.displayName, ...ratings, overallRating, text, createdAt: serverTimestamp() }); await updateProductRatingAfterSubmission(); setSuccess('Thank you for your review!'); setRatings({ attention: 0, persuasion: 0, brandedRecall: 0, liking: 0 }); setText(''); } catch (err) { setError('Failed to submit review. ' + err.message); } };
    return (<div className="bg-white p-6 rounded-lg shadow-md border mt-8"><h3 className="text-xl font-bold text-gray-800 mb-4">Leave a Review</h3><form onSubmit={handleReviewSubmit} className="space-y-4">{criteria.map(criterion => (<div key={criterion} className="flex flex-col sm:flex-row justify-between sm:items-center"><span className="capitalize text-gray-700 mb-2 sm:mb-0">{criterion.replace(/([A-Z])/g, ' $1')}</span><div className="flex">{[...Array(5)].map((_, i) => (<Star key={i} className={`h-6 w-6 cursor-pointer ${i < ratings[criterion] ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} onClick={() => handleRatingChange(criterion, i + 1)} />))}</div></div>))}<div><textarea value={text} onChange={(e) => setText(e.target.value)} rows="4" placeholder="Share your thoughts..." className="w-full mt-2 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}{success && <p className="text-sm text-green-500 text-center">{success}</p>}<button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 cursor-pointer">Submit Review</button></form></div>);
};

const ProductPage = ({ product, setView, user }) => {
    const initialMedia = (product.imageUrls && product.imageUrls.length > 0) ? { type: 'image', src: product.imageUrls[0] } : { type: 'image', src: 'https://placehold.co/600x600/e2e8f0/4a5568?text=Image' };
    const [activeMedia, setActiveMedia] = useState(initialMedia);
    const [reviews, setReviews] = useState([]);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    useEffect(() => { const unsubscribe = onSnapshot(query(collection(db, "products", product.id, "reviews"), orderBy("createdAt", "desc")), (snapshot) => { setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); return () => unsubscribe(); }, [product.id]);
    const allMedia = [...(product.imageUrls || []).map(src => ({ type: 'image', src })), ...(product.videoUrls || []).map(src => ({ type: 'video', src }))];
    return (<main className="container mx-auto px-4 py-8"><button onClick={() => setView({ page: 'home' })} className="flex items-center text-blue-600 hover:underline mb-6 cursor-pointer"><ArrowLeft className="mr-2 h-4 w-4" /> Back to products</button><div className="grid grid-cols-1 md:grid-cols-2 gap-12"><div><div className="mb-4 w-full h-auto aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-lg flex items-center justify-center"><div className="w-full h-full">{activeMedia.type === 'image' ? (<img src={activeMedia.src} alt={product.name} className="w-full h-full object-cover" />) : (<video key={activeMedia.src} src={activeMedia.src} controls autoPlay muted className="w-full h-full object-cover"></video>)}</div></div><div className="flex flex-wrap gap-2">{allMedia.map((media, index) => (<button key={index} onClick={() => setActiveMedia(media)} className={`w-20 h-20 rounded-md overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${activeMedia.src === media.src ? 'border-blue-500' : 'border-transparent'}`}>{media.type === 'image' ? (<img src={media.src} alt={`thumbnail ${index + 1}`} className="w-full h-full object-cover" />) : (<div className="w-full h-full bg-black flex items-center justify-center relative"><div className="absolute inset-0 bg-black opacity-50"></div><Video className="h-8 w-8 text-white z-10" /></div>)}</button>))}</div></div><div><h1 className="text-4xl font-extrabold text-gray-900 mt-1">{product.name}</h1><p className="text-lg text-gray-600 mt-2">{product.subtitle}</p><div className="my-4"><StarRating rating={product.rating} reviewCount={product.reviewCount} /></div><p className="text-3xl font-bold text-blue-600">${parseFloat(product.price).toFixed(2)}</p>
        {/* MODIFIED: Use dangerouslySetInnerHTML to render formatted short description */}
        <div className="mt-6 border-t pt-4 short-description">
            <div className="text-gray-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: product.shortDescription }} />
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">{(product.highlights || []).map((highlight, index) => (<div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-100"><p className="font-bold text-blue-800">{highlight.title}</p><p className="text-sm text-blue-700 mt-1">{highlight.text}</p></div>))}</div></div></div><div className="mt-12 max-w-[1100px] mx-auto"><div className="border-t"><button onClick={() => setIsDetailsOpen(!isDetailsOpen)} className="w-full flex justify-between items-center py-4 text-left cursor-pointer"><div><h2 className="text-2xl font-bold text-gray-800">About this item</h2><p className="text-sm text-gray-500">Product Details</p></div>{isDetailsOpen ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}</button>
        {/* MODIFIED: Use dangerouslySetInnerHTML to render formatted long description */}
        {isDetailsOpen && (<div className="pb-4 text-gray-600 prose max-w-none long-description" dangerouslySetInnerHTML={{ __html: product.longDescription }}/>)}
        </div></div><div className="mt-12 max-w-[1100px] mx-auto"><h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Reviews</h2>{reviews.length > 0 ? (<div className="space-y-6">{reviews.map(review => (<div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border"><div className="flex items-center mb-2"><StarRating rating={review.overallRating} /><span className="ml-4 font-bold text-gray-800">{review.username}</span></div><p className="text-gray-600">{review.text}</p></div>))}</div>) : (<p className="text-gray-500">No reviews yet. Be the first to share your thoughts!</p>)}{user && <ReviewFormComponent productId={product.id} user={user} />}</div></main>);
};

const LoginScreen = () => {
    const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [isLoading, setIsLoading] = useState(false);
    const formatEmail = (user) => `${user.trim()}@shopnext.dev`;
    const handleSignIn = async (e) => { e.preventDefault(); setError(''); setIsLoading(true); try { await signInWithEmailAndPassword(auth, formatEmail(username), password); } catch (err) { setError(err.message); } setIsLoading(false); };
    return (<div className="flex items-center justify-center min-h-[80vh] bg-gray-50"><div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl border"><div className="flex justify-center"><Store className="h-12 w-12 text-blue-600" /></div><h2 className="text-2xl font-bold text-center text-gray-800">Welcome to ShopNext</h2><p className="text-center text-gray-500">Please sign in to view products.</p><form onSubmit={handleSignIn} className="space-y-4"><div><label className="text-sm font-medium text-gray-700">Username</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required/></div><div><label className="text-sm font-medium text-gray-700">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required/></div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}<button type="submit" disabled={isLoading} className="w-full py-3 font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-blue-300 cursor-pointer">{isLoading ? 'Signing In...' : 'Sign In'}</button></form></div></div>);
};

const CreateProductForm = ({ setVendorView, user, editingProduct }) => {
    const [product, setProduct] = useState({ name: '', subtitle: '', shortDescription: '', longDescription: '', price: '', category: '' });
    // This state is for handling TinyMCE's initialization
    const [editorLoaded, setEditorLoaded] = useState(false);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [highlights, setHighlights] = useState([{ title: '', text: '' }]);
    const [media, setMedia] = useState([]);
    const [draggedMedia, setDraggedMedia] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null);

    // This makes sure the editor loads correctly with initial data
    useEffect(() => {
        if (editingProduct) {
            setProduct({ name: editingProduct.name || '', subtitle: editingProduct.subtitle || '', shortDescription: editingProduct.shortDescription || '', longDescription: editingProduct.longDescription || '', price: editingProduct.price || '', category: editingProduct.category || '' });
            setTags(editingProduct.tags || []);
            setHighlights(editingProduct.highlights && editingProduct.highlights.length > 0 ? editingProduct.highlights : [{ title: '', text: '' }]);
            const existingMedia = [
                ...(editingProduct.imageUrls || []).map(url => ({ url, type: 'image' })),
                ...(editingProduct.videoUrls || []).map(url => ({ url, type: 'video' }))
            ];
            setMedia(existingMedia);
        } else {
            setProduct({ name: '', subtitle: '', shortDescription: '', longDescription: '', price: '', category: '' });
            setTags([]);
            setHighlights([{ title: '', text: '' }]);
            setMedia([]);
        }
        // Mark the editor as ready to load
        setEditorLoaded(true);
    }, [editingProduct]);

    // Handlers for file uploads and other form elements (no changes needed here)
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const imageCount = media.filter(m => m.type === 'image').length;
        const videoCount = media.filter(m => m.type === 'video').length;
        let allowedFiles = [];
        let localError = '';

        files.forEach(file => {
            const fileType = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : null);
            if (fileType === 'image' && imageCount + allowedFiles.filter(f => f.type === 'image').length < 5) {
                allowedFiles.push({ file, type: 'image' });
            } else if (fileType === 'video' && videoCount + allowedFiles.filter(f => f.type === 'video').length < 2) {
                allowedFiles.push({ file, type: 'video' });
            } else {
                localError = `Upload limit reached. Max 5 images and 2 videos.`;
            }
        });

        if (localError) setError(localError);
        allowedFiles.forEach(item => handleFileUpload(item.file, item.type));
    };
    const handleFileUpload = (file, fileType) => {
        if (!file) return;
        setIsUploading(true);
        setError('');
        const folder = fileType === 'image' ? 'products' : 'product-videos';
        const fileRef = storageRef(storage, `${folder}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);
        uploadTask.on('state_changed', () => {}, (error) => { setError(`Upload failed for ${file.name}: ${error.message}`); setIsUploading(false); }, () => { getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => { setMedia(prev => [...prev, { url: downloadURL, type: fileType }]); setIsUploading(false); }); });
    };
    const handleRemoveMedia = async (urlToRemove) => {
        if (window.confirm("Are you sure you want to remove this media?")) {
            try {
                const fileRef = storageRef(storage, urlToRemove);
                await deleteObject(fileRef);
                setMedia(prev => prev.filter(item => item.url !== urlToRemove));
            } catch (error) {
                console.error("Failed to delete media: ", error);
                if (error.code === 'storage/object-not-found') { setMedia(prev => prev.filter(item => item.url !== urlToRemove)); } else { setError("Failed to remove media. Please try again."); }
            }
        }
    };
    const handleDragStart = (e, item) => setDraggedMedia(item);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, targetItem) => {
        if (!draggedMedia) return;
        const currentIndex = media.findIndex(item => item.url === draggedMedia.url);
        const targetIndex = media.findIndex(item => item.url === targetItem.url);
        if (currentIndex === -1 || targetIndex === -1) return;
        const newMedia = [...media];
        newMedia.splice(currentIndex, 1);
        newMedia.splice(targetIndex, 0, draggedMedia);
        setMedia(newMedia);
        setDraggedMedia(null);
    };
    const handleChange = (e) => { const { name, value } = e.target; setProduct(prev => ({ ...prev, [name]: value })); };
    const handleTagInput = (e) => { if ((e.key === ',' || e.key === 'Enter') && tagInput.trim() !== '') { e.preventDefault(); if (!tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); } setTagInput(''); } };
    const removeTag = (tagToRemove) => { setTags(tags.filter(tag => tag !== tagToRemove)); };
    const handleHighlightChange = (index, field, value) => { const newHighlights = [...highlights]; newHighlights[index][field] = value; setHighlights(newHighlights); };
    const addHighlight = () => { if (highlights.length < 6) setHighlights([...highlights, { title: '', text: '' }]); };
    const removeHighlight = (index) => { if (highlights.length > 1 || (highlights.length === 1 && (highlights[0].title || highlights[0].text))) { setHighlights(highlights.filter((_, i) => i !== index)); } };
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!product.name || !product.price) { setError('Product Name and Price are required.'); return; }
        const imageUrls = media.filter(m => m.type === 'image').map(m => m.url);
        const videoUrls = media.filter(m => m.type === 'video').map(m => m.url);
        try {
            const commonData = { ...product, price: parseFloat(product.price), tags, highlights: highlights.filter(h => h.title && h.text), imageUrls, videoUrls, imageUrl: imageUrls.length > 0 ? imageUrls[0] : '', class: editingProduct ? editingProduct.class : user.customClaims.class };
            if (editingProduct) {
                await updateDoc(doc(db, "products", editingProduct.id), { ...commonData, featuredOrder: editingProduct.featuredOrder !== undefined ? editingProduct.featuredOrder : 999 });
                setSuccess('Product updated successfully!');
            } else {
                await addDoc(collection(db, "products"), { ...commonData, vendorId: user.uid, vendor: user.displayName, createdAt: serverTimestamp(), rating: 0, reviewCount: 0, featuredOrder: Date.now() });
                setSuccess('Product saved successfully!');
            }
            setTimeout(() => { setVendorView('dashboard'); }, 1500);
        } catch (err) {
            setError('Failed to save product. ' + err.message);
        }
    };
    
    // Only render the form once the editor is ready to prevent issues
    if (!editorLoaded) {
        return <div>Loading Editor...</div>;
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md border max-w-3xl mx-auto">
            <h3 className="text-xl font-bold mb-6 text-gray-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-6">
                <div><label>Product Name</label><input name="name" value={product.name} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md"/></div>
                <div><label>Subtitle</label><input name="subtitle" value={product.subtitle} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md"/></div>
                
                <div>
                    <label>Short Description</label>
                    <Editor
                        apiKey="gl7xxa4bfui10kjofcwnkiuznxaxy3y2aabdso6929tltmkq" // <-- PASTE YOUR KEY HERE
                        value={product.shortDescription}
                        onEditorChange={(content) => setProduct(prev => ({ ...prev, shortDescription: content }))}
                        init={{
                            height: 250,
                            menubar: false,
                            plugins: 'lists link emoticons help wordcount',
                            toolbar: 'undo redo | bold italic underline | bullist numlist | link emoticons | help',
                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                        }}
                    />
                </div>

                <div><label>Product Highlights (Up to 6)</label>{highlights.map((h, i) => (<div key={i} className="flex items-center gap-2 mt-2"><input value={h.title} onChange={(e) => handleHighlightChange(i, 'title', e.target.value)} placeholder="Bold Title" className="p-2 border rounded-md w-1/3"/><input value={h.text} onChange={(e) => handleHighlightChange(i, 'text', e.target.value)} placeholder="Sub-headline" className="p-2 border rounded-md flex-grow"/><button type="button" onClick={() => removeHighlight(i)} className="p-2 text-red-500 hover:bg-red-100 rounded-full cursor-pointer"><X size={16}/></button></div>))}{highlights.length < 6 && <button type="button" onClick={addHighlight} className="text-sm text-blue-600 mt-2 font-semibold cursor-pointer">Add Highlight</button>}</div>
                
                <div>
                    <label>Long Description</label>
                     <Editor
                        apiKey="gl7xxa4bfui10kjofcwnkiuznxaxy3y2aabdso6929tltmkq" // <-- PASTE YOUR KEY HERE
                        value={product.longDescription}
                        onEditorChange={(content) => setProduct(prev => ({ ...prev, longDescription: content }))}
                        init={{
                            height: 400,
                            menubar: true,
                            plugins: 'advlist lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
                            toolbar: 'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                        }}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4"><div><label>Price</label><input name="price" value={product.price} onChange={handleChange} type="number" step="0.01" className="w-full mt-1 p-2 border rounded-md"/></div><div><label>Category</label><input name="category" value={product.category} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md"/></div></div><div><label>Tags</label><div className="flex flex-wrap gap-2 p-2 border rounded-md mt-1">{tags.map(tag => (<span key={tag} className="flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm">{tag}<button type="button" onClick={() => removeTag(tag)} className="ml-2 text-gray-500 hover:text-gray-800 cursor-pointer"><X size={14}/></button></span>))}<input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagInput} placeholder="Add tag..." className="flex-grow p-1 focus:outline-none"/></div><p className="text-xs text-gray-500 mt-1">Press Enter or comma to add a tag.</p></div><div>
                    <p className="block text-sm font-medium text-gray-700 mb-2">Product Media</p>
                    <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-md border mb-3"><ul className="list-none space-y-1"><li>Up to <b>5 photos</b> (JPEG, PNG, WEBP) and <b>2 videos</b> (MP4).</li><li>For best results, use square <b>600x600</b> pixel images.</li><li><b>Drag and drop</b> media to reorder. The first image will be your featured image.</li></ul></div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4" multiple /><button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploading} className="flex items-center justify-center w-full py-2 px-4 border border-dashed rounded-md cursor-pointer"> <PlusCircle className="h-5 w-5 mr-2"/>Add Media</button>
                    <div className="mt-4 flex flex-wrap gap-4">{media.map((item, index) => (<div key={item.url} draggable onDragStart={(e) => handleDragStart(e, item)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, item)} className="relative w-24 h-24 rounded-md cursor-move group">{item.type === 'image' ? <img src={item.url} className="w-full h-full object-cover rounded-md"/> : <div className="w-full h-full bg-black rounded-md flex items-center justify-center"><Video className="h-8 w-8 text-white"/></div>}<button type="button" onClick={() => handleRemoveMedia(item.url)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer"><Trash2 size={14}/></button>{index === 0 && media.find(m => m.type === 'image')?.url === item.url && <div className="absolute bottom-0 w-full bg-black bg-opacity-60 text-white text-center text-xs py-0.5 rounded-b-md">Featured</div>}</div>))}</div>
                </div>{error && <p className="text-sm text-red-500 text-center">{error}</p>}{success && <p className="text-sm text-green-500 text-center">{success}</p>}<div className="flex justify-end space-x-4"><button type="button" onClick={() => setVendorView('dashboard')} className="px-6 py-2 border rounded-full cursor-pointer">Cancel</button><button type="submit" disabled={isUploading} className="px-6 py-2 bg-blue-600 text-white rounded-full cursor-pointer">{isUploading ? 'Uploading...' : 'Save Product'}</button></div>
            </form>
        </div>
    );
};

const VendorDashboard = ({ user, setView, onEditProduct }) => {
    const [vendorProducts, setVendorProducts] = useState([]);
    useEffect(() => { if (user) { const q = query(collection(db, "products"), where("vendorId", "==", user.uid)); const unsubscribe = onSnapshot(q, (snapshot) => { setVendorProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); }); return () => unsubscribe(); } }, [user]);
    const handleDeleteProduct = async (product) => { if(window.confirm("Are you sure?")) { try { await deleteDoc(doc(db, "products", product.id)); (product.imageUrls || []).forEach(url => deleteObject(storageRef(storage, url))); (product.videoUrls || []).forEach(url => deleteObject(storageRef(storage, url))); } catch (error) { console.error("Error deleting product: ", error); } }};
    return (<div><div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-bold text-gray-800">My Products ({vendorProducts.length})</h2><p className="text-sm text-gray-500">Logged in as: {user?.displayName} (Class: {user?.customClaims.class})</p></div><button onClick={() => { onEditProduct(null); setView({ page: 'create_product' });}} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors mr-4 cursor-pointer"><PlusCircle className="h-5 w-5 mr-2" />Add New Product</button></div><div className="bg-white rounded-lg shadow-md border overflow-hidden"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{vendorProducts.map(p => (<tr key={p.id}><td className="px-6 py-4"><div className="flex items-center"><img className="h-10 w-10 rounded-md object-cover mr-4" src={p.imageUrl || p.imageUrls?.[0] || 'https://placehold.co/100x100/e2e8f0/4a5568?text=Img'} alt={p.name} /><span className="font-medium text-gray-900">{p.name}</span></div></td><td className="px-6 py-4 text-gray-600">${parseFloat(p.price).toFixed(2)}</td><td className="px-6 py-4"><StarRating rating={p.rating} reviewCount={p.reviewCount} /></td><td className="px-6 py-4"><div className="flex space-x-4"><button onClick={() => onEditProduct(p)} className="text-blue-600 hover:text-blue-800 cursor-pointer"><Edit className="h-5 w-5" /></button><button onClick={() => handleDeleteProduct(p)} className="text-red-600 hover:text-red-800 cursor-pointer"><Trash2 className="h-5 w-5" /></button></div></td></tr>))}</tbody></table></div></div>);
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
                                    {user.customClaims?.class && <p className="text-xs text-blue-600">Class: {user.customClaims.class}</p>}
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
const ManageClassesModal = ({ isOpen, onClose }) => {
    const [classes, setClasses] = useState([]);
    const [newClassName, setNewClassName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const q = query(collection(db, "classes"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            return () => unsubscribe();
        }
    }, [isOpen]);

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
            await setDoc(doc(db, "classes", className), { name: displayName });
            setMessage(`Class "${displayName}" added successfully`);
            setNewClassName('');
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
        setLoading(false);
    };

    const handleDeleteClass = async (classId, className) => {
        if (!window.confirm(`Are you sure you want to delete class "${className}"? This will not delete associated products or users.`)) return;

        setLoading(true);
        setMessage('');
        try {
            await deleteDoc(doc(db, "classes", classId));
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

const SuperAdminDashboard = ({ user, onEditProduct }) => {
    const [allProducts, setAllProducts] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [draggedItem, setDraggedItem] = useState(null);
    const [newUser, setNewUser] = useState({username: '', password: '', class: ''});
    const [userCreationMsg, setUserCreationMsg] = useState('');
    const [isLoadingUserCreation, setIsLoadingUserCreation] = useState(false);
    const [showDeleteUsersModal, setShowDeleteUsersModal] = useState(false);
    const [showManageClassesModal, setShowManageClassesModal] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "classes"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(classList);
            if (classList.length > 0 && !selectedClass) {
                setSelectedClass(classList[0].id);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!selectedClass) {
            setAllProducts([]);
            return;
        };
        const q = query(collection(db, "products"), where("class", "==", selectedClass), orderBy("featuredOrder", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllProducts(prods);
        });
        return () => unsubscribe();
    }, [selectedClass]);

    const handleDeleteProduct = async (product) => { if(window.confirm("Are you sure?")) { try { await deleteDoc(doc(db, "products", product.id)); (product.imageUrls || []).forEach(url => deleteObject(storageRef(storage, url))); (product.videoUrls || []).forEach(url => deleteObject(storageRef(storage, url))); } catch (error) { console.error("Error deleting product: ", error); } }};
    const handleDragStart = (e, index) => { setDraggedItem(allProducts[index]); };
    const handleDragOver = (e, index) => { e.preventDefault(); const draggedOverItem = allProducts[index]; if (draggedItem === draggedOverItem) { return; } let items = allProducts.filter(item => item !== draggedItem); items.splice(index, 0, draggedItem); setAllProducts(items); };
    const handleDragEnd = async () => { setDraggedItem(null); const batch = writeBatch(db); allProducts.forEach((product, index) => { const productRef = doc(db, "products", product.id); batch.update(productRef, { featuredOrder: index }); }); await batch.commit(); };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (newUser.username.length < 3 || newUser.password.length < 6 || !newUser.class) {
            setUserCreationMsg("Error: Please fill all fields correctly.");
            return;
        }
        setIsLoadingUserCreation(true);
        setUserCreationMsg('');
        try {
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
            setNewUser({ username: '', password: '', class: '' });
        } catch (error) {
            setUserCreationMsg(`Error: ${error.message}`);
        }
        setIsLoadingUserCreation(false);
    };
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Super Admin Dashboard</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                     <div className="flex items-center mb-4">
                        <label htmlFor="class-select" className="mr-2 font-bold">Manage Class:</label>
                        {classes.length > 0 ? (
                           <select id="class-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="p-2 border rounded-md">{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        ) : (
                           <p className="text-gray-500">No classes created yet.</p>
                        )}
                     </div>
                     <h3 className="text-xl font-bold text-gray-800 mb-4">Product Order (Drag to Reorder)</h3>
                     <div className="bg-white rounded-lg shadow-md border overflow-hidden">{allProducts.map((p, index) => (<div key={p.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd} className="flex items-center justify-between p-4 border-b last:border-b-0 cursor-move"><div className="flex items-center"><GripVertical className="h-5 w-5 text-gray-400 mr-4" /><img className="h-10 w-10 rounded-md object-cover mr-4" src={p.imageUrl || p.imageUrls?.[0]} alt={p.name} /><div><p className="font-medium text-gray-900">{p.name}</p><p className="text-xs text-gray-500">{p.vendor}</p></div></div><div className="flex space-x-4"><button onClick={() => onEditProduct(p)} className="text-blue-600 hover:text-blue-800 cursor-pointer"><Edit className="h-5 w-5" /></button><button onClick={() => handleDeleteProduct(p)} className="text-red-600 hover:text-red-800 cursor-pointer"><Trash2 className="h-5 w-5" /></button></div></div>))}</div>
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Vendor</h3>
                        <div className="bg-white p-6 rounded-lg shadow-md border">
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div><label className="text-sm font-medium">Username</label><input type="text" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} className="w-full mt-1 p-2 border rounded-md" required/></div>
                                <div><label className="text-sm font-medium">Password</label><input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full mt-1 p-2 border rounded-md" required/></div>
                                <div><label className="text-sm font-medium">Assign to Class</label><input type="text" value={newUser.class} onChange={(e) => setNewUser({...newUser, class: e.target.value})} placeholder="e.g., morning-class" className="w-full mt-1 p-2 border rounded-md" required/></div>
                                <button type="submit" disabled={isLoadingUserCreation} className="w-full py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer">{isLoadingUserCreation ? 'Creating...' : 'Create Vendor'}</button>
                                {userCreationMsg && <p className={`text-xs text-center mt-2 ${userCreationMsg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{userCreationMsg}</p>}
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
                                <span>Manage Classes</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <DeleteUsersModal isOpen={showDeleteUsersModal} onClose={() => setShowDeleteUsersModal(false)} />
            <ManageClassesModal isOpen={showManageClassesModal} onClose={() => setShowManageClassesModal(false)} />
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
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [classes, setClasses] = useState([]);
  const [adminViewingClass, setAdminViewingClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('featured');


  const handleSignOut = async () => { 
      setAdminViewingClass(''); 
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

  useEffect(() => {
    const q = query(collection(db, "classes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => { 
      if (!user) {
          setProducts([]);
          return;
      }
      
      const isSuperAdmin = (user.customClaims && user.customClaims.superAdmin === true) || user.uid === SUPER_ADMIN_UID;
      let q;

      if (isSuperAdmin) {
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

  // Memoized hook to handle filtering and sorting of products
  const displayedProducts = useMemo(() => {
    let filtered = [...products];
    
    // 1. Search Filter
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(lowercasedQuery) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery)))
      );
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
  
  const renderView = () => {
    if (loading) { return <div className="min-h-screen flex items-center justify-center text-lg">Loading Application...</div> }
    if (!user) { return <LoginScreen/> }
    
    const isSuperAdmin = (user.customClaims && user.customClaims.superAdmin === true) || user.uid === SUPER_ADMIN_UID;

    switch (view.page) {
      case 'product': 
        const product = products.find(p => p.id === view.id);
        return product ? <ProductPage product={product} setView={setView} user={user} /> : <div className="text-center py-10">Product not found.</div>;
      case 'dashboard':
          return isSuperAdmin 
            ? <main className="container mx-auto px-4 py-8"><SuperAdminDashboard user={user} onEditProduct={(p) => setView({ page: 'create_product', product: p })} /></main>
            : <main className="container mx-auto px-4 py-8"><VendorDashboard user={user} setView={setView} onEditProduct={(p) => setView({ page: 'create_product', product: p })}/></main>;
      case 'create_product':
          return <main className="container mx-auto px-4 py-8"><CreateProductForm setVendorView={() => setView({ page: 'dashboard' })} user={user} editingProduct={view.product} /></main>;
      case 'home':
      default:
        return (
            <>
                {isSuperAdmin && <AdminClassSelector classes={classes} adminViewingClass={adminViewingClass} setAdminViewingClass={setAdminViewingClass} />}
                <ProductGrid products={displayedProducts} setView={setView} sortOrder={sortOrder} setSortOrder={setSortOrder} />
            </>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
        <Header setView={setView} user={user} onSignOut={handleSignOut} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        {renderView()}
        <Footer />
    </div>
  );
}