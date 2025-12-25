'use client';
import React, { useState, useRef } from 'react';
import { PlusCircle, Trash2, Video, Image as ImageIcon, Info, RefreshCw } from 'lucide-react';
import { RTB_LABELS, MEDIA_CONFIG } from '../lib/constants';
import { ImageCropperModal, validateImageDimensions, ImageValidationError } from './ImageCropper';

const RTBImageSlot = ({
    rtbLabel,
    imageUrl,
    onUpload,
    onRemove,
    isUploading,
    uploadingSlot
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
                className={`relative aspect-square rounded-lg border-2 border-dashed overflow-hidden transition-all
                    ${imageUrl ? 'border-blue-300 bg-gray-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'}
                    ${isThisSlotUploading ? 'opacity-50' : ''}`}
            >
                {imageUrl ? (
                    <>
                        <img
                            src={imageUrl}
                            alt={rtbLabel.name}
                            className="w-full h-full object-cover"
                        />
                        {/* Action buttons */}
                        <div className="absolute top-2 right-2 flex space-x-1">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClick();
                                }}
                                className="bg-blue-600 text-white rounded-full p-1.5 shadow-lg hover:bg-blue-700 cursor-pointer"
                                title="Replace image"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(rtbLabel.id);
                                }}
                                className="bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 cursor-pointer"
                                title="Remove image"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        {/* RTB Badge on image */}
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

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept={MEDIA_CONFIG.ACCEPTED_IMAGE_TYPES.join(',')}
            />
        </div>
    );
};

const VideoUploadSlot = ({ videoUrl, onUpload, onRemove, isUploading }) => {
    const fileInputRef = useRef(null);

    const handleClick = () => {
        if (!isUploading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file);
        }
        e.target.value = '';
    };

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <Video className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="font-medium text-gray-700">Product Video (Optional)</span>
                </div>
                <span className="text-xs text-gray-500">1 video max, MP4 format</span>
            </div>

            {videoUrl ? (
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                    <video
                        src={videoUrl}
                        controls
                        className="w-full h-full object-contain"
                    />
                    <button
                        type="button"
                        onClick={() => onRemove()}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 cursor-pointer"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={isUploading}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                    <div className="flex flex-col items-center">
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                        ) : (
                            <>
                                <PlusCircle className="h-6 w-6 text-gray-400 mb-1" />
                                <span className="text-sm text-gray-500">Add Video</span>
                            </>
                        )}
                    </div>
                </button>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept={MEDIA_CONFIG.ACCEPTED_VIDEO_TYPES.join(',')}
            />
        </div>
    );
};

const RTBImageUploader = ({
    rtbImages,
    setRtbImages,
    videoUrl,
    setVideoUrl,
    onUploadImage,
    onUploadVideo,
    onRemoveImage,
    onRemoveVideo,
    isUploading,
    uploadingSlot,
    error,
    setError
}) => {
    const [cropperOpen, setCropperOpen] = useState(false);
    const [cropperImage, setCropperImage] = useState(null);
    const [cropperFileName, setCropperFileName] = useState('');
    const [cropperRtbId, setCropperRtbId] = useState(null);
    const [cropperRtbLabel, setCropperRtbLabel] = useState('');

    const handleImageUpload = async (file, rtbId) => {
        // Validate image dimensions
        const validation = await validateImageDimensions(file);

        if (!validation.isValid) {
            if (validation.error) {
                setError(validation.error);
            } else {
                setError(`Image must be at least ${MEDIA_CONFIG.MIN_IMAGE_WIDTH}x${MEDIA_CONFIG.MIN_IMAGE_HEIGHT} pixels. Your image is ${validation.width}x${validation.height} pixels.`);
            }
            return;
        }

        // Open cropper for valid images
        const rtbLabel = RTB_LABELS.find(l => l.id === rtbId);
        setCropperImage(URL.createObjectURL(file));
        setCropperFileName(file.name);
        setCropperRtbId(rtbId);
        setCropperRtbLabel(rtbLabel?.name || '');
        setCropperOpen(true);
    };

    const handleCropComplete = (croppedBlob) => {
        // Create a File object from the blob
        const file = new File([croppedBlob], cropperFileName, { type: 'image/jpeg' });
        onUploadImage(file, cropperRtbId);

        // Cleanup
        if (cropperImage) {
            URL.revokeObjectURL(cropperImage);
        }
        setCropperImage(null);
        setCropperFileName('');
        setCropperRtbId(null);
        setCropperRtbLabel('');
    };

    const handleCropperClose = () => {
        if (cropperImage) {
            URL.revokeObjectURL(cropperImage);
        }
        setCropperOpen(false);
        setCropperImage(null);
        setCropperFileName('');
        setCropperRtbId(null);
        setCropperRtbLabel('');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Product Images (RTB - Reasons To Believe)
                </label>
                <span className="text-xs text-gray-500">
                    {rtbImages.filter(img => img.url).length}/{MEDIA_CONFIG.MAX_IMAGES} images
                </span>
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-md border border-blue-100">
                <p className="font-medium text-blue-700 mb-1">Upload Guidelines:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                    <li>Each slot represents a different "Reason To Believe" for your product</li>
                    <li>Images must be at least <b>600x600 pixels</b> (will be cropped to square)</li>
                    <li>Hover over the <Info className="inline h-3 w-3" /> icon for guidance on each RTB</li>
                    <li>The first image will be your featured/thumbnail image</li>
                </ul>
            </div>

            {/* Error message */}
            {error && (
                <ImageValidationError message={error} onDismiss={() => setError('')} />
            )}

            {/* RTB Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {RTB_LABELS.map((rtbLabel) => {
                    const imageData = rtbImages.find(img => img.rtbId === rtbLabel.id);
                    return (
                        <RTBImageSlot
                            key={rtbLabel.id}
                            rtbLabel={rtbLabel}
                            imageUrl={imageData?.url}
                            onUpload={handleImageUpload}
                            onRemove={onRemoveImage}
                            isUploading={isUploading}
                            uploadingSlot={uploadingSlot}
                        />
                    );
                })}
            </div>

            {/* Video Upload */}
            <VideoUploadSlot
                videoUrl={videoUrl}
                onUpload={onUploadVideo}
                onRemove={onRemoveVideo}
                isUploading={isUploading}
            />

            {/* Image Cropper Modal */}
            <ImageCropperModal
                isOpen={cropperOpen}
                onClose={handleCropperClose}
                imageSrc={cropperImage}
                fileName={cropperFileName}
                onCropComplete={handleCropComplete}
                rtbLabel={cropperRtbLabel}
            />
        </div>
    );
};

export default RTBImageUploader;
