"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle, Video, X, Type, FileText, Sparkles, Tag, ImageIcon, CheckCircle2, ChevronRight, AlertTriangle, Download } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import TagManager from './TagManager';
import RTBImageUploader, { VideoUploadSection } from './RTBImageUploader';
import SpotlightTutorial, { TutorialButton, PRODUCT_TUTORIAL_STEPS, TALENT_TUTORIAL_STEPS } from './SpotlightTutorial';
import { RTB_LABELS, AVATAR_RTB_LABELS, TAG_CONFIG } from '../lib/constants';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { useConfirmDialog } from '../lib/admin/useConfirmDialog';

export function CreateItemForm({ setVendorView, user, editingItem, mode }) {
    const { confirm, dialog: confirmDialog } = useConfirmDialog();
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
        videoLabels: ['Motion', 'Motion & Voice', 'Personality Example', 'Influence Example'],
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
    const [showTutorial, setShowTutorial] = useState(false);
    const [formTab, setFormTab] = useState('basics');

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
                // Merge saved images (which only contain slots with URLs) back into the full set of slots
                const mergedImages = config.rtbLabels.map(rtb => {
                    const saved = editingItem.rtbImages.find(img => img.rtbId === rtb.id);
                    return saved ? { ...saved, rtbLabel: rtb.name } : { rtbId: rtb.id, rtbLabel: rtb.name, url: '' };
                });
                setRtbImages(mergedImages);
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

    // Replace video handler (for crop/trim)
    const handleReplaceVideo = async (file, index) => {
        setIsUploading(true);
        setError('');

        // Delete old video from storage
        const oldUrl = videoUrls[index];
        if (oldUrl) {
            try {
                const oldRef = storageRef(storage, oldUrl);
                await deleteObject(oldRef);
            } catch (err) {
                console.error("Failed to delete old video from storage:", err);
            }
        }

        // Upload new cropped video
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
                    setVideoUrls(prev => prev.map((url, i) => i === index ? downloadURL : url));
                    setIsUploading(false);
                });
            }
        );
    };

    // Remove image handler
    const handleRemoveImage = async (rtbId) => {
        const imageData = rtbImages.find(img => img.rtbId === rtbId);
        if (!imageData?.url) return;

        const ok = await confirm({
            title: 'Remove this image?',
            message: 'The image will be deleted from storage. This cannot be undone.',
            confirmLabel: 'Remove image',
            variant: 'destructive',
        });
        if (!ok) return;
        try {
            const fileRef = storageRef(storage, imageData.url);
            await deleteObject(fileRef);
        } catch (err) {
            console.error("Failed to delete from storage:", err);
        }
        setRtbImages(prev => prev.map(img =>
            img.rtbId === rtbId ? { ...img, url: '' } : img
        ));
    };

    // Remove video handler
    const handleRemoveVideo = async (index) => {
        const url = videoUrls[index];
        if (!url) return;

        const ok = await confirm({
            title: 'Remove this video?',
            message: 'The video will be deleted from storage. This cannot be undone.',
            confirmLabel: 'Remove video',
            variant: 'destructive',
        });
        if (!ok) return;
        try {
            const fileRef = storageRef(storage, url);
            await deleteObject(fileRef);
        } catch (err) {
            console.error("Failed to delete video from storage:", err);
        }
        setVideoUrls(prev => prev.filter((_, i) => i !== index));
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

    const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white outline-none transition-all hover:border-gray-300";

    const tabs = [
        { id: 'basics', label: 'Basics', icon: Type, done: !!item.name },
        { id: 'story', label: 'Story', icon: FileText, done: !!item.shortDescription },
        { id: 'highlights', label: 'Highlights', icon: Sparkles, done: highlights.some(h => h.title) },
        { id: 'tags', label: 'Tags', icon: Tag, done: triggerTags.length > 0 || solutionTags.length > 0 },
        { id: 'photos', label: 'Photos', icon: ImageIcon, done: rtbImages.some(img => img.url) },
        { id: 'videos', label: 'Videos', icon: Video, done: videoUrls.length > 0 },
    ];

    const tabIndex = tabs.findIndex(t => t.id === formTab);
    const nextTab = tabs[tabIndex + 1];
    const prevTab = tabs[tabIndex - 1];

    return (
        <div className="max-w-5xl mx-auto pb-8">

            {/* Page Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">{editingItem ? `Edit ${config.entityName}` : `Create New ${config.entityName}`}</h3>
                    <p className="text-gray-500 mt-1">{editingItem ? `Update the details for this ${config.entityLabel}.` : `Fill in the details to create a new ${config.entityLabel}.`}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {showDarkModeTip && !editingItem && !showTutorial && (
                        <div className="flex items-center gap-2 bg-gray-900 text-white pl-3 pr-1.5 py-1.5 rounded-xl text-xs">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                            <span className="text-gray-200 whitespace-nowrap">If you can&apos;t see the text, switch your device from dark mode to light mode.</span>
                            <button type="button" onClick={() => setShowDarkModeTip(false)} className="text-gray-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-gray-700 transition-colors"><X className="h-3.5 w-3.5" /></button>
                        </div>
                    )}
                    {!editingItem && (
                        <TutorialButton onClick={() => setShowTutorial(true)} />
                    )}
                </div>
            </div>

            <form onSubmit={handleSaveItem}>
                <div className="flex gap-6">
                    {/* === LEFT SIDEBAR NAV === */}
                    <div className="hidden md:block w-52 flex-shrink-0">
                        <div className="sticky top-20 space-y-1">
                            {tabs.map((tab, i) => {
                                const Icon = tab.icon;
                                const isActive = formTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setFormTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-100' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                        <span className="flex-1 text-left">{tab.label}</span>
                                        {tab.done && !isActive && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                        {tab.done && isActive && <CheckCircle2 className="h-4 w-4 text-blue-200" />}
                                    </button>
                                );
                            })}

                            {/* Progress */}
                            <div className="pt-4 border-t border-gray-100 mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-500">{tabs.filter(t => t.done).length} of {tabs.length} done</span>
                                    <span className="text-xs font-semibold text-gray-700">{Math.round((tabs.filter(t => t.done).length / tabs.length) * 100)}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500" style={{ width: `${Math.round((tabs.filter(t => t.done).length / tabs.length) * 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === MAIN CONTENT === */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile tab bar */}
                        <div className="md:hidden flex overflow-x-auto gap-1 mb-4 bg-white rounded-xl border border-gray-200 p-1.5">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setFormTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                                            formTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

                            {/* === BASICS === */}
                            {formTab === 'basics' && (
                                <div className="p-6 sm:p-8 space-y-5" data-tutorial="basic-info">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1.5">{config.entityName} Name <span className="text-red-400">*</span></label>
                                            <input name="name" value={item.name} onChange={handleChange} placeholder={`What's your ${config.entityLabel} called?`} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Subtitle</label>
                                            <input name="subtitle" value={item.subtitle} onChange={handleChange} placeholder="A punchy one-liner" className={inputClass} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-tutorial="price-category">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Price <span className="text-red-400">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                                <input name="price" value={item.price} onChange={handleChange} type="number" step="0.01" placeholder="0.00" className={`${inputClass} pl-8`} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1.5">Category</label>
                                            <input name="category" value={item.category} onChange={handleChange} placeholder="e.g. Electronics, Fashion" className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* === STORY === */}
                            {formTab === 'story' && (
                                <div className="p-6 sm:p-8 space-y-6" data-tutorial="descriptions">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Short Description</label>
                                        <RichTextEditor value={item.shortDescription} onChange={(content) => setItem(prev => ({ ...prev, shortDescription: content }))} placeholder={`Enter a brief ${config.entityLabel} description...`} minHeight={180} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">Detailed Description</label>
                                        <RichTextEditor value={item.longDescription} onChange={(content) => setItem(prev => ({ ...prev, longDescription: content }))} placeholder={`Enter detailed ${config.entityLabel} information...`} minHeight={250} />
                                    </div>
                                </div>
                            )}

                            {/* === HIGHLIGHTS === */}
                            {formTab === 'highlights' && (
                                <div className="p-6 sm:p-8 space-y-3" data-tutorial="highlights">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-gray-500">Feature cards on your detail page.</p>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{highlights.filter(h => h.title || h.text).length}/6</span>
                                    </div>
                                    {highlights.map((h, i) => (
                                        <div key={i} className="flex items-center gap-2 group">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                                            <input value={h.title} onChange={(e) => handleHighlightChange(i, 'title', e.target.value)} placeholder="Bold title" className="px-3 py-2.5 border border-gray-200 rounded-xl w-1/3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-gray-300 text-sm" />
                                            <input value={h.text} onChange={(e) => handleHighlightChange(i, 'text', e.target.value)} placeholder="Supporting detail" className="px-3 py-2.5 border border-gray-200 rounded-xl flex-grow focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all hover:border-gray-300 text-sm" />
                                            <button type="button" onClick={() => removeHighlight(i)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors opacity-0 group-hover:opacity-100"><X size={16} /></button>
                                        </div>
                                    ))}
                                    {highlights.length < 6 && (
                                        <button type="button" onClick={addHighlight} className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 cursor-pointer mt-1 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                                            <PlusCircle className="h-4 w-4" /> Add highlight
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* === TAGS === */}
                            {formTab === 'tags' && (
                                <div className="p-6 sm:p-8" data-tutorial="tags">
                                    <TagManager triggerTags={triggerTags} setTriggerTags={setTriggerTags} solutionTags={solutionTags} setSolutionTags={setSolutionTags} displayTriggerTags={displayTriggerTags} setDisplayTriggerTags={setDisplayTriggerTags} displaySolutionTags={displaySolutionTags} setDisplaySolutionTags={setDisplaySolutionTags} entityLabel={config.entityLabel} />
                                </div>
                            )}

                            {/* === PHOTOS === */}
                            {formTab === 'photos' && (
                                <div className="p-6 sm:p-8 space-y-6" data-tutorial="media">
                                    <RTBImageUploader rtbImages={rtbImages} setRtbImages={setRtbImages} videoUrls={videoUrls} setVideoUrls={setVideoUrls} onUploadImage={handleUploadImage} onUploadVideo={handleUploadVideo} onRemoveImage={handleRemoveImage} onRemoveVideo={handleRemoveVideo} isUploading={isUploading} uploadingSlot={uploadingSlot} error={error} setError={setError} featuredImageId={featuredImageId} setFeaturedImageId={setFeaturedImageId} rtbLabels={config.rtbLabels} imagesSectionTitle={config.imagesSectionTitle} videoSectionTitle={config.videoSectionTitle} videoLabels={config.videoLabels} />

                                    {/* Photo download permissions */}
                                    {rtbImages.some(img => img.url) && (
                                        <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-b from-gray-50 to-white">
                                            <div className="flex items-center gap-2 mb-3"><Download className="h-4 w-4 text-gray-500" /><h4 className="text-sm font-semibold text-gray-900">Photo Download Permissions</h4></div>
                                            <p className="text-xs text-gray-500 mb-3">Select which photos viewers can download.</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {rtbImages.filter(img => img.url).map(img => (
                                                    <label key={img.rtbId} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-colors">
                                                        <input type="checkbox" checked={downloadableImages.includes(img.rtbId)} onChange={(e) => { if (e.target.checked) { setDownloadableImages(prev => [...prev, img.rtbId]); } else { setDownloadableImages(prev => prev.filter(id => id !== img.rtbId)); } }} className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                                                        <img src={img.url} alt={img.rtbLabel} className="h-8 w-8 object-cover rounded-md" />
                                                        <span className="text-sm text-gray-700 truncate">{img.rtbLabel}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* === VIDEOS === */}
                            {formTab === 'videos' && (
                                <div className="p-6 sm:p-8 space-y-6" data-tutorial="videos">
                                    <VideoUploadSection videoUrls={videoUrls} onUpload={handleUploadVideo} onRemove={handleRemoveVideo} onReplace={handleReplaceVideo} isUploading={isUploading} sectionTitle={config.videoSectionTitle} videoLabels={config.videoLabels} />

                                    {/* Video download permissions */}
                                    {videoUrls.length > 0 && (
                                        <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-b from-gray-50 to-white">
                                            <div className="flex items-center gap-2 mb-3"><Download className="h-4 w-4 text-gray-500" /><h4 className="text-sm font-semibold text-gray-900">Video Download Permissions</h4></div>
                                            <p className="text-xs text-gray-500 mb-3">Select which videos viewers can download.</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {videoUrls.map((url, index) => (
                                                    <label key={index} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer transition-colors">
                                                        <input type="checkbox" checked={downloadableVideos.includes(index)} onChange={(e) => { if (e.target.checked) { setDownloadableVideos(prev => [...prev, index]); } else { setDownloadableVideos(prev => prev.filter(i => i !== index)); } }} className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer" />
                                                        <Video className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm text-gray-700 truncate">{config.videoLabels && index < config.videoLabels.length ? config.videoLabels[index] : config.videoLabels ? (() => { try { const path = decodeURIComponent(new URL(url).pathname); return path.split('/').pop().replace(/^\d+_/, ''); } catch { return `Video ${index + 1}`; } })() : `Video ${index + 1}`}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Bottom nav inside card */}
                            <div className="border-t border-gray-100 px-6 sm:px-8 py-4 flex items-center justify-between">
                                {prevTab ? (
                                    <button type="button" onClick={() => setFormTab(prevTab.id)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <ArrowLeft className="h-4 w-4" /> {prevTab.label}
                                    </button>
                                ) : <div />}
                                {nextTab ? (
                                    <button type="button" onClick={() => setFormTab(nextTab.id)} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                                        {nextTab.label} <ChevronRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button type="submit" disabled={isUploading} className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg transition-colors cursor-pointer disabled:bg-blue-400 md:hidden">
                                        {isUploading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Uploading...</> : `Save ${config.entityName}`}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Error / Success below card */}
                        {error && (
                            <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div><p className="font-medium">Something went wrong</p><p className="text-red-600 mt-0.5">{error}</p></div>
                            </div>
                        )}
                        {success && (
                            <div className="mt-4 flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl text-sm">
                                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div><p className="font-medium">Success!</p><p className="text-green-600 mt-0.5">{success}</p></div>
                            </div>
                        )}

                    </div>
                </div>
            </form>

            {/* Sticky bottom save bar */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" data-tutorial="form-actions">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button type="button" onClick={() => setVendorView('dashboard')} className="px-5 py-2.5 text-gray-500 hover:text-gray-700 font-medium transition-colors cursor-pointer rounded-xl hover:bg-gray-100 text-sm">
                        Cancel
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:block text-xs text-gray-400">{tabs.filter(t => t.done).length}/{tabs.length} sections complete</span>
                        <button type="button" onClick={(e) => { e.preventDefault(); document.querySelector('form')?.requestSubmit(); }} disabled={isUploading} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer disabled:bg-blue-400 font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 text-sm">
                            {isUploading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Uploading...</> : `Save ${config.entityName}`}
                        </button>
                    </div>
                </div>
            </div>

            <SpotlightTutorial
                steps={mode === 'talent' ? TALENT_TUTORIAL_STEPS : PRODUCT_TUTORIAL_STEPS}
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
                storageKey={mode === 'talent' ? 'shopnext_talent_tutorial_seen' : 'shopnext_product_tutorial_seen'}
                onSwitchTab={setFormTab}
            />
            {confirmDialog}
        </div>
    );
}
