'use client';
import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Crop, AlertTriangle, Check } from 'lucide-react';

// Minimum dimensions required
const MIN_WIDTH = 600;
const MIN_HEIGHT = 600;
const OUTPUT_SIZE = 600;

// Helper to create initial centered crop
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

// Validate image dimensions
export const validateImageDimensions = (file) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve({
                width: img.width,
                height: img.height,
                isValid: img.width >= MIN_WIDTH && img.height >= MIN_HEIGHT,
                file
            });
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            resolve({ width: 0, height: 0, isValid: false, file, error: 'Failed to load image' });
        };
        img.src = URL.createObjectURL(file);
    });
};

// Generate cropped image blob
const getCroppedImg = (image, crop, fileName) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;

        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            OUTPUT_SIZE,
            OUTPUT_SIZE
        );

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                blob.name = fileName;
                resolve(blob);
            },
            'image/jpeg',
            0.95
        );
    });
};

const ImageCropperModal = ({ isOpen, onClose, imageSrc, fileName, onCropComplete, rtbLabel }) => {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onImageLoad = useCallback((e) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 1));
    }, []);

    const handleCropComplete = async () => {
        if (!completedCrop || !imgRef.current) return;

        setIsProcessing(true);
        try {
            const croppedBlob = await getCroppedImg(
                imgRef.current,
                completedCrop,
                fileName
            );
            onCropComplete(croppedBlob);
            onClose();
        } catch (error) {
            console.error('Error cropping image:', error);
        }
        setIsProcessing(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={onClose}>
            <div
                className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <Crop className="h-5 w-5 mr-2 text-blue-600" />
                            Crop Image
                        </h3>
                        {rtbLabel && (
                            <p className="text-sm text-gray-500 mt-1">For: {rtbLabel}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-4 bg-gray-100 overflow-auto flex-1 flex items-center justify-center">
                    <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                        minWidth={100}
                        minHeight={100}
                        className="max-h-[60vh]"
                    >
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Crop preview"
                            onLoad={onImageLoad}
                            className="max-h-[60vh] max-w-full"
                        />
                    </ReactCrop>
                </div>

                <div className="p-4 border-t bg-gray-50">
                    <p className="text-sm text-gray-600 mb-4 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                        Your image will be cropped to {OUTPUT_SIZE}x{OUTPUT_SIZE} pixels (square format).
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-100 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCropComplete}
                            disabled={isProcessing || !completedCrop}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer flex items-center"
                        >
                            <Check className="h-4 w-4 mr-2" />
                            {isProcessing ? 'Processing...' : 'Crop & Upload'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Image validation error component
export const ImageValidationError = ({ message, onDismiss }) => (
    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
        <span className="flex-1">{message}</span>
        {onDismiss && (
            <button onClick={onDismiss} className="ml-2 text-red-500 hover:text-red-700 cursor-pointer">
                <X className="h-4 w-4" />
            </button>
        )}
    </div>
);

// Main export
export { ImageCropperModal, MIN_WIDTH, MIN_HEIGHT, OUTPUT_SIZE };
export default ImageCropperModal;
