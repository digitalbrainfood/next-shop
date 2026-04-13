'use client';
import React, { useState, useRef } from 'react';
import { PlusCircle, Trash2, Video, Image as ImageIcon, Info, Crop, Star, GripVertical, HelpCircle, X, Scissors } from 'lucide-react';
import VideoCropperModal from './VideoCropper';
import { RTB_LABELS, MEDIA_CONFIG } from '../lib/constants';
import { ImageCropperModal, validateImageDimensions, ImageValidationError } from './ImageCropper';

const RTBImageSlot = ({
    rtbLabel,
    imageUrl,
    onUpload,
    onRemove,
    onEdit,
    isUploading,
    uploadingSlot,
    isFeatured,
    onSetFeatured,
    onDragStart,
    onDragOver,
    onDragEnd,
    isDragging
}) => {
    const fileInputRef = useRef(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const isThisSlotUploading = uploadingSlot === rtbLabel.id;

    const handleClick = () => {
        if (!isUploading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file, rtbLabel.id);
        }
        e.target.value = '';
    };

    return (
        <div className="relative">
            {/* RTB Label Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-2">
                        {rtbLabel.id}
                    </span>
                    <span className="font-medium text-gray-700 text-sm">{rtbLabel.name}</span>
                </div>
                <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <Info className="h-4 w-4" />
                </button>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute z-10 right-0 top-6 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                    {rtbLabel.description}
                </div>
            )}

            {/* Image Slot */}
            <div
                onClick={!imageUrl ? handleClick : undefined}
                draggable={!!imageUrl}
                onDragStart={(e) => imageUrl && onDragStart && onDragStart(e, rtbLabel.id)}
                onDragOver={(e) => imageUrl && onDragOver && onDragOver(e, rtbLabel.id)}
                onDragEnd={(e) => imageUrl && onDragEnd && onDragEnd(e)}
                className={`relative aspect-square rounded-lg border-2 border-dashed overflow-hidden transition-all
                    ${imageUrl ? (isFeatured ? 'border-yellow-400 bg-yellow-50' : 'border-blue-300 bg-gray-50') : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'}
                    ${isThisSlotUploading ? 'opacity-50' : ''}
                    ${isDragging ? 'opacity-50 scale-95' : ''}
                    ${imageUrl ? 'cursor-move' : ''}`}
            >
                {imageUrl ? (
                    <>
                        <img src={imageUrl} alt={rtbLabel.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-70 text-white rounded p-1 cursor-move">
                            <GripVertical className="h-4 w-4" />
                        </div>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onSetFeatured && onSetFeatured(rtbLabel.id); }}
                            className={`absolute top-2 left-10 rounded-full p-1.5 shadow-lg cursor-pointer ${isFeatured ? 'bg-yellow-500 text-white' : 'bg-white text-gray-400 hover:text-yellow-500'}`}
                            title={isFeatured ? "Featured image" : "Set as featured"}
                        >
                            <Star className={`h-4 w-4 ${isFeatured ? 'fill-current' : ''}`} />
                        </button>
                        <div className="absolute top-2 right-2 flex space-x-1">
                            <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(imageUrl, rtbLabel.id); }} className="bg-blue-600 text-white rounded-full p-1.5 shadow-lg hover:bg-blue-700 cursor-pointer" title="Edit & crop image">
                                <Crop className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(rtbLabel.id); }} className="bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 cursor-pointer" title="Remove image">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs py-1 px-2 text-center">
                            {rtbLabel.shortName}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        {isThisSlotUploading ? (
                            <div className="text-blue-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                                <span className="text-xs">Uploading...</span>
                            </div>
                        ) : (
                            <>
                                <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500">Click to upload</span>
                                <span className="text-xs text-gray-400 mt-1">600x600 min</span>
                            </>
                        )}
                    </div>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept={MEDIA_CONFIG.ACCEPTED_IMAGE_TYPES.join(',')} />
        </div>
    );
};

const getVideoLabel = (index, url, videoLabels) => {
    if (videoLabels && index < videoLabels.length) return videoLabels[index];
    if (videoLabels && url) {
        try { const path = decodeURIComponent(new URL(url).pathname); return path.split('/').pop().replace(/^\d+_/, ''); } catch { return `Video ${index + 1}`; }
    }
    return `Video ${index + 1}`;
};

// --- HELP MODAL ---
const HelpModal = ({ isOpen, onClose, title, items }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    {items.map((item, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                {item.icon}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- EXPORTED: VIDEO SECTION (used as separate tab) ---
export const VideoUploadSection = ({ videoUrls, onUpload, onRemove, onReplace, isUploading, sectionTitle, videoLabels }) => {
    const fileInputRef = useRef(null);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [cropperVideoUrl, setCropperVideoUrl] = useState(null);
    const [cropperIndex, setCropperIndex] = useState(null);

    const handleClick = () => { if (!isUploading && fileInputRef.current) fileInputRef.current.click(); };
    const handleFileSelect = (e) => { const file = e.target.files?.[0]; if (file) onUpload(file); e.target.value = ''; };
    const canAddMore = (videoUrls || []).length < MEDIA_CONFIG.MAX_VIDEOS;

    const handleOpenCropper = (url, index) => {
        setCropperVideoUrl(url);
        setCropperIndex(index);
        setCropperOpen(true);
    };

    const handleCropComplete = (croppedFile) => {
        if (onReplace) {
            onReplace(croppedFile, cropperIndex);
        }
        setCropperOpen(false);
        setCropperVideoUrl(null);
        setCropperIndex(null);
    };

    const handleCropperClose = () => {
        setCropperOpen(false);
        setCropperVideoUrl(null);
        setCropperIndex(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{(videoUrls || []).length}/{MEDIA_CONFIG.MAX_VIDEOS} videos, MP4 format</span>
            </div>

            {(videoUrls || []).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(videoUrls || []).map((url, index) => (
                        <div key={index} className="relative rounded-xl overflow-hidden bg-black aspect-video">
                            <video src={url} controls className="w-full h-full object-contain" />
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button type="button" onClick={() => handleOpenCropper(url, index)} className="bg-purple-600 text-white rounded-full p-1.5 shadow-lg hover:bg-purple-700 cursor-pointer" title="Crop & trim video">
                                    <Scissors className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => onRemove(index)} className="bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 cursor-pointer" title="Remove video">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="absolute top-2 left-2 bg-purple-600 text-white rounded-full px-2.5 py-0.5 text-xs font-bold">
                                {getVideoLabel(index, url, videoLabels)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {canAddMore && (
                <button type="button" onClick={handleClick} disabled={isUploading} className="w-full py-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50">
                    <div className="flex flex-col items-center">
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                        ) : (
                            <>
                                <PlusCircle className="h-8 w-8 text-gray-300 mb-2" />
                                <span className="text-sm text-gray-500">Add Video</span>
                                <span className="text-xs text-gray-400 mt-0.5">MP4 format recommended</span>
                            </>
                        )}
                    </div>
                </button>
            )}

            {(videoUrls || []).length === 0 && !canAddMore && (
                <p className="text-sm text-gray-400 text-center py-8">Maximum videos reached.</p>
            )}

            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept={MEDIA_CONFIG.ACCEPTED_VIDEO_TYPES.join(',')} />

            {/* Video Cropper Modal */}
            <VideoCropperModal
                isOpen={cropperOpen}
                onClose={handleCropperClose}
                videoSrc={cropperVideoUrl}
                fileName={`cropped-video-${Date.now()}.mp4`}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
};

// --- MAIN COMPONENT (photos only now) ---
const RTBImageUploader = ({
    rtbImages,
    setRtbImages,
    videoUrls,
    setVideoUrls,
    onUploadImage,
    onUploadVideo,
    onRemoveImage,
    onRemoveVideo,
    isUploading,
    uploadingSlot,
    error,
    setError,
    featuredImageId,
    setFeaturedImageId,
    rtbLabels = RTB_LABELS,
    imagesSectionTitle = "Product Images (RTB - Reasons To Believe)",
    videoSectionTitle = "Product Videos (Optional)",
    videoLabels,
    uploadGuidelines
}) => {
    const [cropperOpen, setCropperOpen] = useState(false);
    const [cropperImage, setCropperImage] = useState(null);
    const [cropperFileName, setCropperFileName] = useState('');
    const [cropperRtbId, setCropperRtbId] = useState(null);
    const [cropperRtbLabel, setCropperRtbLabel] = useState('');
    const [draggedId, setDraggedId] = useState(null);
    const [showHelp, setShowHelp] = useState(false);

    const handleImageUpload = async (file, rtbId) => {
        const validation = await validateImageDimensions(file);
        if (!validation.isValid) {
            if (validation.error) { setError(validation.error); }
            else { setError(`Image must be at least ${MEDIA_CONFIG.MIN_IMAGE_WIDTH}x${MEDIA_CONFIG.MIN_IMAGE_HEIGHT} pixels. Your image is ${validation.width}x${validation.height} pixels.`); }
            return;
        }
        const rtbLabel = rtbLabels.find(l => l.id === rtbId);
        setCropperImage(URL.createObjectURL(file));
        setCropperFileName(file.name);
        setCropperRtbId(rtbId);
        setCropperRtbLabel(rtbLabel?.name || '');
        setCropperOpen(true);
    };

    const handleCropComplete = (croppedBlob) => {
        const file = new File([croppedBlob], cropperFileName, { type: 'image/jpeg' });
        onUploadImage(file, cropperRtbId);
        if (cropperImage && !cropperImage.startsWith('http')) URL.revokeObjectURL(cropperImage);
        setCropperImage(null); setCropperFileName(''); setCropperRtbId(null); setCropperRtbLabel('');
    };

    const handleCropperClose = () => {
        if (cropperImage && !cropperImage.startsWith('http')) URL.revokeObjectURL(cropperImage);
        setCropperOpen(false); setCropperImage(null); setCropperFileName(''); setCropperRtbId(null); setCropperRtbLabel('');
    };

    const handleEditImage = (imageUrl, rtbId) => {
        const rtbLabel = rtbLabels.find(l => l.id === rtbId);
        setCropperImage(imageUrl); setCropperFileName(`rtb-${rtbId}-edited.jpg`); setCropperRtbId(rtbId); setCropperRtbLabel(rtbLabel?.name || ''); setCropperOpen(true);
    };

    const handleDragStart = (e, rtbId) => { setDraggedId(rtbId); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e, targetRtbId) => {
        e.preventDefault();
        if (draggedId === null || draggedId === targetRtbId) return;
        const draggedIndex = rtbImages.findIndex(img => img.rtbId === draggedId);
        const targetIndex = rtbImages.findIndex(img => img.rtbId === targetRtbId);
        if (draggedIndex === -1 || targetIndex === -1) return;
        const newImages = [...rtbImages];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(targetIndex, 0, draggedImage);
        setRtbImages(newImages);
    };
    const handleDragEnd = () => { setDraggedId(null); };
    const handleSetFeatured = (rtbId) => { setFeaturedImageId && setFeaturedImageId(rtbId); };

    const helpItems = [
        { icon: <ImageIcon className="h-4 w-4" />, title: 'RTB Image Slots', description: 'Each slot represents a different "Reason To Believe" for your product. Fill them strategically.' },
        { icon: <Crop className="h-4 w-4" />, title: 'Image Requirements', description: 'Images must be at least 600x600 pixels. They will be cropped to a square.' },
        { icon: <Info className="h-4 w-4" />, title: 'Slot Guidance', description: 'Hover over the info icon on each slot to see what type of image works best there.' },
        { icon: <Star className="h-4 w-4 text-yellow-500" />, title: 'Featured Image', description: 'Click the star on any uploaded image to set it as the thumbnail shown on product cards.' },
        { icon: <GripVertical className="h-4 w-4" />, title: 'Reorder', description: 'Drag and drop uploaded images between slots to rearrange them.' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                        {rtbImages.filter(img => img.url).length}/{MEDIA_CONFIG.MAX_IMAGES} images
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowHelp(true)}
                        className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-full p-1 transition-colors cursor-pointer"
                        title="Photo guidelines"
                    >
                        <HelpCircle className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {rtbImages.map(img => (
                    <RTBImageSlot
                        key={img.rtbId}
                        rtbLabel={rtbLabels.find(l => l.id === img.rtbId) || { id: img.rtbId, name: img.rtbLabel, description: '', shortName: '' }}
                        imageUrl={img.url}
                        onUpload={handleImageUpload}
                        onRemove={onRemoveImage}
                        onEdit={handleEditImage}
                        isUploading={isUploading}
                        uploadingSlot={uploadingSlot}
                        isFeatured={featuredImageId === img.rtbId}
                        onSetFeatured={handleSetFeatured}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedId === img.rtbId}
                    />
                ))}
            </div>

            {error && <ImageValidationError message={error} />}

            {/* Cropper Modal */}
            {cropperOpen && cropperImage && (
                <ImageCropperModal
                    imageSrc={cropperImage}
                    onComplete={handleCropComplete}
                    onClose={handleCropperClose}
                    rtbLabel={cropperRtbLabel}
                />
            )}

            {/* Help Modal */}
            <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} title="Photo Guidelines" items={helpItems} />
        </div>
    );
};

export default RTBImageUploader;
