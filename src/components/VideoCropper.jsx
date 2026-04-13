'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Scissors, Play, Pause, Check, AlertTriangle, Loader2, Crop, Clock } from 'lucide-react';

// ── FFmpeg singleton ────────────────────────────────────────────────
let ffmpegInstance = null;
let ffmpegLoadPromise = null;

async function getFFmpeg() {
    if (ffmpegInstance?.loaded) return ffmpegInstance;
    if (ffmpegLoadPromise) return ffmpegLoadPromise;

    ffmpegLoadPromise = (async () => {
        const { FFmpeg } = await import('@ffmpeg/ffmpeg');
        const { toBlobURL } = await import('@ffmpeg/util');

        const ffmpeg = new FFmpeg();

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        ffmpegInstance = ffmpeg;
        return ffmpeg;
    })();

    return ffmpegLoadPromise;
}

// ── Time formatting ─────────────────────────────────────────────────
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function toFFmpegTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toFixed(2).padStart(5, '0');
    return `${h}:${m}:${s}`;
}

// ── Crop overlay component ──────────────────────────────────────────
const CropOverlay = ({ videoRect, crop, onCropChange }) => {
    const overlayRef = useRef(null);
    const dragRef = useRef(null);

    const handleMouseDown = (e, handle) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = overlayRef.current.getBoundingClientRect();
        dragRef.current = {
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startCrop: { ...crop },
            containerWidth: rect.width,
            containerHeight: rect.height,
        };

        const onMove = (ev) => {
            if (!dragRef.current) return;
            const { handle: h, startX, startY, startCrop, containerWidth, containerHeight } = dragRef.current;
            const dx = ((ev.clientX - startX) / containerWidth) * 100;
            const dy = ((ev.clientY - startY) / containerHeight) * 100;

            let { x, y, w, h: ch } = startCrop;

            if (h === 'move') {
                x = Math.max(0, Math.min(100 - w, startCrop.x + dx));
                y = Math.max(0, Math.min(100 - ch, startCrop.y + dy));
            } else {
                if (h.includes('l')) { const newX = Math.max(0, startCrop.x + dx); w = startCrop.w - (newX - startCrop.x); x = newX; }
                if (h.includes('r')) { w = Math.max(10, Math.min(100 - x, startCrop.w + dx)); }
                if (h.includes('t')) { const newY = Math.max(0, startCrop.y + dy); ch = startCrop.h - (newY - startCrop.y); y = newY; }
                if (h.includes('b')) { ch = Math.max(10, Math.min(100 - y, startCrop.h + dy)); }
                if (w < 10) w = 10;
                if (ch < 10) ch = 10;
            }

            onCropChange({ x, y, w, h: ch });
        };

        const onUp = () => {
            dragRef.current = null;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const handleStyle = 'absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm z-10';

    return (
        <div
            ref={overlayRef}
            className="absolute inset-0"
            style={{ pointerEvents: 'none' }}
        >
            {/* Dark overlay outside crop */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bg-black/50" style={{ top: 0, left: 0, right: 0, height: `${crop.y}%` }} />
                <div className="absolute bg-black/50" style={{ top: `${crop.y + crop.h}%`, left: 0, right: 0, bottom: 0 }} />
                <div className="absolute bg-black/50" style={{ top: `${crop.y}%`, left: 0, width: `${crop.x}%`, height: `${crop.h}%` }} />
                <div className="absolute bg-black/50" style={{ top: `${crop.y}%`, left: `${crop.x + crop.w}%`, right: 0, height: `${crop.h}%` }} />
            </div>

            {/* Crop box */}
            <div
                className="absolute border-2 border-blue-400"
                style={{
                    left: `${crop.x}%`, top: `${crop.y}%`,
                    width: `${crop.w}%`, height: `${crop.h}%`,
                    pointerEvents: 'auto', cursor: 'move',
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
                {/* Rule of thirds grid */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />
                </div>

                {/* Corner handles */}
                <div className={`${handleStyle} -top-1.5 -left-1.5 cursor-nw-resize`} style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleMouseDown(e, 'tl')} />
                <div className={`${handleStyle} -top-1.5 -right-1.5 cursor-ne-resize`} style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleMouseDown(e, 'tr')} />
                <div className={`${handleStyle} -bottom-1.5 -left-1.5 cursor-sw-resize`} style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleMouseDown(e, 'bl')} />
                <div className={`${handleStyle} -bottom-1.5 -right-1.5 cursor-se-resize`} style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleMouseDown(e, 'br')} />

                {/* Edge handles */}
                <div className={`${handleStyle} -top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize`} style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleMouseDown(e, 't')} />
                <div className={`${handleStyle} -bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize`} style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleMouseDown(e, 'b')} />
                <div className={`${handleStyle} top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize`} style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleMouseDown(e, 'l')} />
                <div className={`${handleStyle} top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize`} style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleMouseDown(e, 'r')} />
            </div>
        </div>
    );
};

// ── Time range slider ───────────────────────────────────────────────
const TimeRangeSlider = ({ duration, trimStart, trimEnd, onStartChange, onEndChange, currentTime, onSeek }) => {
    const trackRef = useRef(null);

    const handleTrackClick = (e) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onSeek(pct * duration);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Trim: {formatTime(trimStart)} - {formatTime(trimEnd)}</span>
                <span className="ml-auto">Duration: {formatTime(trimEnd - trimStart)}</span>
            </div>

            {/* Visual track */}
            <div ref={trackRef} className="relative h-8 bg-gray-200 rounded cursor-pointer" onClick={handleTrackClick}>
                {/* Selected range */}
                <div
                    className="absolute top-0 bottom-0 bg-blue-100 border-x-2 border-blue-500"
                    style={{
                        left: `${(trimStart / duration) * 100}%`,
                        width: `${((trimEnd - trimStart) / duration) * 100}%`,
                    }}
                />

                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-red-500 rounded-full" />
                </div>
            </div>

            {/* Input controls */}
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600 font-medium">Start:</span>
                    <input
                        type="range" min={0} max={duration} step={0.1}
                        value={trimStart}
                        onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (v < trimEnd - 0.5) onStartChange(v);
                        }}
                        className="w-28 accent-blue-500"
                    />
                    <span className="text-gray-500 w-10 text-right">{formatTime(trimStart)}</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600 font-medium">End:</span>
                    <input
                        type="range" min={0} max={duration} step={0.1}
                        value={trimEnd}
                        onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (v > trimStart + 0.5) onEndChange(v);
                        }}
                        className="w-28 accent-blue-500"
                    />
                    <span className="text-gray-500 w-10 text-right">{formatTime(trimEnd)}</span>
                </label>
            </div>
        </div>
    );
};

// ── Main modal ──────────────────────────────────────────────────────
const VideoCropperModal = ({ isOpen, onClose, videoSrc, fileName, onCropComplete }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoReady, setVideoReady] = useState(false);

    // Crop state (percentage of video)
    const [crop, setCrop] = useState({ x: 10, y: 10, w: 80, h: 80 });
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState('');
    const [ffmpegReady, setFfmpegReady] = useState(false);
    const [loadError, setLoadError] = useState('');

    // Mode: 'crop' or 'trim' or 'both'
    const [mode, setMode] = useState('both');

    // Load FFmpeg on mount
    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        getFFmpeg()
            .then(() => { if (!cancelled) setFfmpegReady(true); })
            .catch((err) => { if (!cancelled) setLoadError(`Failed to load video processor: ${err.message}`); });
        return () => { cancelled = true; };
    }, [isOpen]);

    // Video metadata
    const handleLoadedMetadata = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        setDuration(video.duration);
        setTrimEnd(video.duration);
        setVideoReady(true);
    }, []);

    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        setCurrentTime(video.currentTime);

        // Stop at trim end
        if (video.currentTime >= trimEnd) {
            video.pause();
            setIsPlaying(false);
        }
    }, [trimEnd]);

    const togglePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
            setIsPlaying(false);
        } else {
            if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
                video.currentTime = trimStart;
            }
            video.play();
            setIsPlaying(true);
        }
    };

    const handleSeek = (time) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = time;
        setCurrentTime(time);
    };

    // ── Process video ───────────────────────────────────────────────
    const handleProcess = async () => {
        if (!ffmpegReady || !videoRef.current) return;

        setIsProcessing(true);
        setProgress('Loading video processor...');

        try {
            const ffmpeg = await getFFmpeg();
            const { fetchFile } = await import('@ffmpeg/util');

            setProgress('Reading video file...');
            const videoData = await fetchFile(videoSrc);
            await ffmpeg.writeFile('input.mp4', videoData);

            // Build FFmpeg command
            const args = ['-i', 'input.mp4'];

            // Time trim
            const doTrim = trimStart > 0.1 || trimEnd < duration - 0.1;
            if (doTrim) {
                args.push('-ss', toFFmpegTime(trimStart));
                args.push('-to', toFFmpegTime(trimEnd));
            }

            // Spatial crop
            const doCrop = crop.x > 1 || crop.y > 1 || crop.w < 98 || crop.h < 98;
            if (doCrop) {
                const vw = videoRef.current.videoWidth;
                const vh = videoRef.current.videoHeight;
                const cx = Math.round((crop.x / 100) * vw);
                const cy = Math.round((crop.y / 100) * vh);
                // Ensure even dimensions (required by most codecs)
                const cw = Math.round(((crop.w / 100) * vw) / 2) * 2;
                const ch = Math.round(((crop.h / 100) * vh) / 2) * 2;
                args.push('-vf', `crop=${cw}:${ch}:${cx}:${cy}`);
            }

            args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23');
            args.push('-c:a', 'aac', '-b:a', '128k');
            args.push('-movflags', '+faststart');
            args.push('output.mp4');

            setProgress('Processing video... This may take a moment.');

            ffmpeg.on('progress', ({ progress: p }) => {
                if (p >= 0 && p <= 1) {
                    setProgress(`Processing: ${Math.round(p * 100)}%`);
                }
            });

            await ffmpeg.exec(args);

            setProgress('Reading output...');
            const outputData = await ffmpeg.readFile('output.mp4');
            const blob = new Blob([outputData.buffer], { type: 'video/mp4' });

            // Clean up
            await ffmpeg.deleteFile('input.mp4');
            await ffmpeg.deleteFile('output.mp4');

            const file = new File([blob], fileName || 'cropped-video.mp4', { type: 'video/mp4' });
            onCropComplete(file);
            onClose();
        } catch (err) {
            console.error('Video processing error:', err);
            setProgress(`Error: ${err.message}`);
            setTimeout(() => setProgress(''), 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
            <div
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <Scissors className="h-5 w-5 mr-2 text-purple-600" />
                            Crop & Trim Video
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Drag the crop box and adjust time range below</p>
                    </div>
                    <button onClick={onClose} disabled={isProcessing} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Mode tabs */}
                <div className="flex border-b px-4">
                    {[
                        { id: 'both', label: 'Crop & Trim', icon: <Scissors className="h-3.5 w-3.5" /> },
                        { id: 'crop', label: 'Crop Only', icon: <Crop className="h-3.5 w-3.5" /> },
                        { id: 'trim', label: 'Trim Only', icon: <Clock className="h-3.5 w-3.5" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setMode(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                                mode === tab.id
                                    ? 'border-purple-500 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Video preview */}
                <div className="p-4 bg-gray-900 flex-1 overflow-auto">
                    <div ref={containerRef} className="relative mx-auto" style={{ maxHeight: '50vh' }}>
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            onLoadedMetadata={handleLoadedMetadata}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={() => setIsPlaying(false)}
                            className="max-h-[50vh] mx-auto block"
                            muted
                        />

                        {/* Crop overlay */}
                        {videoReady && (mode === 'crop' || mode === 'both') && (
                            <CropOverlay
                                crop={crop}
                                onCropChange={setCrop}
                            />
                        )}
                    </div>

                    {/* Playback controls */}
                    {videoReady && (
                        <div className="flex items-center justify-center gap-3 mt-3">
                            <button
                                onClick={togglePlayPause}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                            >
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                            </button>
                            <span className="text-white/70 text-xs font-mono">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Time trim controls */}
                {videoReady && (mode === 'trim' || mode === 'both') && (
                    <div className="px-4 py-3 border-t bg-gray-50">
                        <TimeRangeSlider
                            duration={duration}
                            trimStart={trimStart}
                            trimEnd={trimEnd}
                            onStartChange={setTrimStart}
                            onEndChange={setTrimEnd}
                            currentTime={currentTime}
                            onSeek={handleSeek}
                        />
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                    {loadError && (
                        <p className="text-sm text-red-600 mb-3 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            {loadError}
                        </p>
                    )}

                    {progress && (
                        <div className="mb-3 flex items-center text-sm text-purple-700">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {progress}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 flex items-center">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                            Processing happens in your browser. Large videos may take longer.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-100 cursor-pointer text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcess}
                                disabled={isProcessing || !ffmpegReady || !videoReady}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 cursor-pointer flex items-center text-sm"
                            >
                                <Check className="h-4 w-4 mr-1.5" />
                                {isProcessing ? 'Processing...' : 'Apply & Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoCropperModal;
