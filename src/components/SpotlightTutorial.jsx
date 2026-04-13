'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

// --- OWL MASCOT ---
const OwlMascot = ({ mood = 'happy', size = 64 }) => {
    const moods = {
        happy: { eyeR: 5, pupilY: 0, beakOpen: false, wingWave: false },
        excited: { eyeR: 6, pupilY: -1, beakOpen: true, wingWave: true },
        thinking: { eyeR: 4, pupilY: 1, beakOpen: false, wingWave: false },
        wink: { eyeR: 5, pupilY: 0, beakOpen: false, wingWave: false, wink: true },
        wave: { eyeR: 5, pupilY: 0, beakOpen: false, wingWave: true },
    };
    const m = moods[mood] || moods.happy;

    return (
        <svg viewBox="0 0 80 80" width={size} height={size} className="flex-shrink-0">
            <ellipse cx="40" cy="52" rx="24" ry="22" fill="#6366f1" />
            <ellipse cx="40" cy="56" rx="16" ry="14" fill="#a5b4fc" />
            <circle cx="40" cy="30" r="22" fill="#6366f1" />
            <polygon points="22,14 18,2 28,16" fill="#6366f1" />
            <polygon points="58,14 62,2 52,16" fill="#6366f1" />
            <polygon points="23,13 20,4 29,15" fill="#818cf8" />
            <polygon points="57,13 60,4 51,15" fill="#818cf8" />
            <ellipse cx="40" cy="32" rx="17" ry="15" fill="#c7d2fe" />
            <circle cx="33" cy="30" r={m.eyeR} fill="white" />
            <circle cx="47" cy="30" r={m.eyeR} fill="white" />
            {m.wink ? (
                <>
                    <circle cx="33" cy={30 + m.pupilY} r="2.5" fill="#1e1b4b" />
                    <path d="M44,30 Q47,27 50,30" stroke="#1e1b4b" strokeWidth="2" fill="none" strokeLinecap="round" />
                </>
            ) : (
                <>
                    <circle cx="33" cy={30 + m.pupilY} r="2.5" fill="#1e1b4b" />
                    <circle cx="47" cy={30 + m.pupilY} r="2.5" fill="#1e1b4b" />
                </>
            )}
            <circle cx="34.5" cy="28.5" r="1" fill="white" />
            <circle cx="48.5" cy="28.5" r="1" fill="white" />
            {m.beakOpen ? (
                <>
                    <polygon points="37,36 40,34 43,36" fill="#f59e0b" />
                    <polygon points="37,36 40,39 43,36" fill="#d97706" />
                </>
            ) : (
                <polygon points="37,36 40,39 43,36" fill="#f59e0b" />
            )}
            <ellipse cx="18" cy="50" rx="7" ry="14" fill="#818cf8"
                transform={m.wingWave ? 'rotate(-15, 18, 50)' : 'rotate(0, 18, 50)'} />
            <ellipse cx="62" cy="50" rx="7" ry="14" fill="#818cf8"
                transform={m.wingWave ? 'rotate(15, 62, 50)' : 'rotate(0, 62, 50)'} />
            <ellipse cx="33" cy="72" rx="6" ry="3" fill="#f59e0b" />
            <ellipse cx="47" cy="72" rx="6" ry="3" fill="#f59e0b" />
            <rect x="27" y="10" width="26" height="3" rx="1" fill="#1e1b4b" />
            <polygon points="40,4 27,11 53,11" fill="#1e1b4b" />
            <line x1="52" y1="11" x2="56" y2="18" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="56" cy="19" r="2" fill="#f59e0b" />
        </svg>
    );
};

// --- TUTORIAL STEPS ---

// Steps reference the sidebar tabs — each step highlights the active tab's content panel.
// The switchTab callback lets the tutorial change tabs automatically.

export const PRODUCT_TUTORIAL_STEPS = [
    {
        target: null,
        title: "Let's build your product!",
        body: "I'm Nex, and I'll walk you through each tab. Every section has a purpose in your marketing strategy. Let's go!",
        mood: 'wave',
        position: 'center',
        switchTab: 'basics',
    },
    {
        target: '[data-tutorial="basic-info"]',
        title: 'Name, price, and identity',
        body: "Your product name is the first thing people see — make it stick. Set a price point and category to position it.",
        mood: 'happy',
        position: 'bottom',
        switchTab: 'basics',
    },
    {
        target: '[data-tutorial="descriptions"]',
        title: 'Tell your story',
        body: "The short description hooks them. The detailed description convinces them. Use formatting — bold, lists, headings — to make it scannable.",
        mood: 'thinking',
        position: 'bottom',
        switchTab: 'story',
    },
    {
        target: '[data-tutorial="highlights"]',
        title: 'Key selling points',
        body: "Highlights show as cards on your product page. Think features, benefits, differentiators. Up to 6.",
        mood: 'excited',
        position: 'bottom',
        switchTab: 'highlights',
    },
    {
        target: '[data-tutorial="tags"]',
        title: 'Make it discoverable',
        body: "Trigger tags = when does a customer need this? Solution tags = what problem does it solve? Pick 2 of each to show on the card.",
        mood: 'thinking',
        position: 'bottom',
        switchTab: 'tags',
    },
    {
        target: '[data-tutorial="media"]',
        title: 'Your RTB photos',
        body: "Each slot has a specific Reason To Believe purpose — features, sensory, emotional, trigger, usage, and text ad. Click the ? icon for details.",
        mood: 'excited',
        position: 'bottom',
        switchTab: 'photos',
    },
    {
        target: '[data-tutorial="videos"]',
        title: 'Videos bring it to life',
        body: "Product demos, lifestyle clips, behind-the-scenes — up to 10 videos. Optional but powerful.",
        mood: 'happy',
        position: 'bottom',
        switchTab: 'videos',
    },
    {
        target: '[data-tutorial="form-actions"]',
        title: "You're ready!",
        body: "Hit Save at the bottom bar whenever you're done. You can jump between tabs and come back to edit anytime.",
        mood: 'wave',
        position: 'top',
    },
];

export const TALENT_TUTORIAL_STEPS = [
    {
        target: null,
        title: "Let's build your talent profile!",
        body: "I'm Nex! This is your personal brand page — every tab shapes how people see you. Let's make it great.",
        mood: 'wave',
        position: 'center',
        switchTab: 'basics',
    },
    {
        target: '[data-tutorial="basic-info"]',
        title: 'Your identity',
        body: "Your name and subtitle define your brand. The subtitle is what people see on the card before they click — make it memorable.",
        mood: 'happy',
        position: 'bottom',
        switchTab: 'basics',
    },
    {
        target: '[data-tutorial="descriptions"]',
        title: 'Your story matters',
        body: "Short description = your elevator pitch. Detailed description = your full portfolio narrative. Use rich formatting to stand out.",
        mood: 'thinking',
        position: 'bottom',
        switchTab: 'story',
    },
    {
        target: '[data-tutorial="highlights"]',
        title: 'Showcase your strengths',
        body: "Highlight cards show skills, experience, achievements, personality. What makes you hirable? Up to 6 cards.",
        mood: 'excited',
        position: 'bottom',
        switchTab: 'highlights',
    },
    {
        target: '[data-tutorial="tags"]',
        title: 'Get discovered',
        body: "Trigger tags = when would someone need you? Solution tags = what you deliver. Feature 2 of each on your card.",
        mood: 'thinking',
        position: 'bottom',
        switchTab: 'tags',
    },
    {
        target: '[data-tutorial="media"]',
        title: 'Your photo portfolio',
        body: "Face View, Side View, Full Body, expressions — these aren't selfies. Think professional headshots and portfolio poses. Click ? for guidance.",
        mood: 'excited',
        position: 'bottom',
        switchTab: 'photos',
    },
    {
        target: '[data-tutorial="videos"]',
        title: 'Show your range',
        body: "Motion clips, voice samples, personality reels — videos let people see the real you. Upload clips showing different sides of your talent.",
        mood: 'happy',
        position: 'bottom',
        switchTab: 'videos',
    },
    {
        target: '[data-tutorial="form-actions"]',
        title: "Looking good!",
        body: "Save from the bottom bar when you're ready. Jump between tabs anytime to update. Go show the world what you've got!",
        mood: 'wave',
        position: 'top',
    },
];

// --- ANIMATION CONSTANTS ---
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const SPOTLIGHT_DURATION = 600; // ms for spotlight to glide
const TOOLTIP_FADE = 250;      // ms for tooltip fade in/out
const SCROLL_WAIT = 450;       // ms to wait for scroll to settle

// --- SPOTLIGHT OVERLAY ---
// Uses box-shadow technique: a single div IS the spotlight hole,
// its massive box-shadow IS the dark overlay. Fully GPU-composited.

const SpotlightTutorial = ({ steps, isOpen, onClose, storageKey, onSwitchTab }) => {
    const [currentStep, setCurrentStep] = useState(0);
    // Spotlight hole position (null = full-screen overlay, no hole)
    const [hole, setHole] = useState(null);
    // Tooltip position and visibility
    const [tooltip, setTooltip] = useState({ top: 0, left: 0, visible: false });
    // Overall overlay visibility for mount/unmount
    const [mounted, setMounted] = useState(false);
    const busy = useRef(false);
    const tooltipRef = useRef(null);

    const step = steps[currentStep];
    const PAD = 14;

    // Mount/unmount animation
    useEffect(() => {
        if (isOpen) {
            setMounted(true);
        } else {
            setMounted(false);
            // Reset after fade out
            const t = setTimeout(() => {
                setCurrentStep(0);
                setHole(null);
                setTooltip({ top: 0, left: 0, visible: false });
            }, 400);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    // Measure element and compute positions
    const measure = useCallback((el) => {
        const rect = el.getBoundingClientRect();
        return {
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            elBottom: rect.bottom,
            elTop: rect.top,
            elLeft: rect.left,
            elWidth: rect.width,
        };
    }, []);

    const computeTooltipPos = useCallback((m, position) => {
        const tooltipW = 380;
        const tooltipH = 220;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let top, left;

        // For tall elements that fill most of the viewport, overlay the tooltip
        // inside the bottom portion of the spotlight area
        const elementFillsViewport = m.height > vh * 0.6;

        if (elementFillsViewport) {
            top = vh - tooltipH - 80;
            left = m.left + m.width / 2 - tooltipW / 2;
        } else if (position === 'top') {
            top = m.top - tooltipH - 16;
            left = m.elLeft + m.elWidth / 2 - tooltipW / 2;
        } else {
            top = m.top + m.height + 16;
            left = m.elLeft + m.elWidth / 2 - tooltipW / 2;
        }

        // If tooltip would go off bottom, flip to top
        if (!elementFillsViewport && top + tooltipH > vh - 16 && position !== 'top') {
            top = m.top - tooltipH - 16;
        }
        // If tooltip would go off top, flip to bottom
        if (top < 16) {
            top = m.top + m.height + 16;
        }

        left = Math.max(16, Math.min(left, vw - tooltipW - 16));
        top = Math.max(16, Math.min(top, vh - tooltipH - 16));

        return { top, left };
    }, []);

    // Orchestrate the full transition sequence
    const transitionTo = useCallback((stepIndex) => {
        if (busy.current) return;
        busy.current = true;

        const targetStep = steps[stepIndex];

        // Phase 1: Fade out tooltip
        setTooltip(prev => ({ ...prev, visible: false }));

        setTimeout(() => {
            // Phase 1.5: Switch tab if needed
            if (targetStep.switchTab && onSwitchTab) {
                onSwitchTab(targetStep.switchTab);
            }

            // Small delay for tab content to render before measuring
            setTimeout(() => {

            // Phase 2: If target has an element, scroll to it
            if (targetStep.target && targetStep.position !== 'center') {
                const el = document.querySelector(targetStep.target);
                if (el) {
                    // Smart scroll: position element so there's room for the tooltip too
                    const rect = el.getBoundingClientRect();
                    const vh = window.innerHeight;
                    const tooltipSpace = 260; // tooltip height + gap
                    const totalNeeded = rect.height + PAD * 2 + tooltipSpace;

                    if (totalNeeded > vh * 0.85) {
                        // Element is very tall — scroll to top of element, tooltip will overlay
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else if (targetStep.position === 'top') {
                        // Tooltip goes above — make sure there's room above
                        el.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    } else {
                        // Tooltip goes below — scroll element toward top to leave room
                        const targetScrollTop = window.scrollY + rect.top - 80;
                        window.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
                    }

                    // Phase 3: After scroll, measure and move spotlight
                    setTimeout(() => {
                        const m = measure(el);
                        setHole(m);

                        // Phase 4: After spotlight glides, show tooltip
                        setTimeout(() => {
                            // Re-measure after spotlight transition (scroll may have adjusted)
                            const fresh = measure(el);
                            setHole(fresh);
                            const pos = computeTooltipPos(fresh, targetStep.position);
                            setTooltip({ ...pos, visible: true });
                            busy.current = false;
                        }, SPOTLIGHT_DURATION);
                    }, SCROLL_WAIT);
                } else {
                    // Element not found — center
                    setHole(null);
                    setTimeout(() => {
                        setTooltip({
                            top: window.innerHeight / 2 - 110,
                            left: window.innerWidth / 2 - 190,
                            visible: true,
                        });
                        busy.current = false;
                    }, 300);
                }
            } else {
                // Center modal (intro/outro)
                setHole(null);
                setTimeout(() => {
                    setTooltip({
                        top: window.innerHeight / 2 - 110,
                        left: window.innerWidth / 2 - 190,
                        visible: true,
                    });
                    busy.current = false;
                }, 300);
            }
            }, 100); // delay for tab content to render
        }, TOOLTIP_FADE);
    }, [steps, measure, computeTooltipPos, onSwitchTab]);

    // Run transition when step changes
    useEffect(() => {
        if (!isOpen || !mounted) return;
        transitionTo(currentStep);
    }, [currentStep, isOpen, mounted, transitionTo]);

    // Reposition on resize
    useEffect(() => {
        if (!isOpen) return;
        const handleResize = () => {
            const s = steps[currentStep];
            if (s.target && s.position !== 'center') {
                const el = document.querySelector(s.target);
                if (el) {
                    const m = measure(el);
                    setHole(m);
                    const pos = computeTooltipPos(m, s.position);
                    setTooltip(prev => ({ ...pos, visible: prev.visible }));
                }
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen, currentStep, steps, measure, computeTooltipPos]);

    const handleNext = () => {
        if (busy.current) return;
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleFinish();
        }
    };

    const handlePrev = () => {
        if (busy.current) return;
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleFinish = () => {
        if (storageKey) localStorage.setItem(storageKey, 'true');
        busy.current = false;
        setTooltip(prev => ({ ...prev, visible: false }));
        setTimeout(() => {
            setMounted(false);
            setTimeout(() => {
                setCurrentStep(0);
                onClose();
            }, 400);
        }, TOOLTIP_FADE);
    };

    if (!isOpen && !mounted) return null;
    if (!step) return null;

    // Spotlight hole style — the box-shadow IS the dark overlay
    const holeStyle = hole
        ? {
            position: 'fixed',
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
            borderRadius: 16,
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, ${mounted ? 0.55 : 0}), inset 0 0 0 2px rgba(99, 102, 241, ${mounted ? 0.5 : 0})`,
            transition: `top ${SPOTLIGHT_DURATION}ms ${EASE}, left ${SPOTLIGHT_DURATION}ms ${EASE}, width ${SPOTLIGHT_DURATION}ms ${EASE}, height ${SPOTLIGHT_DURATION}ms ${EASE}, box-shadow 0.4s ease, border-radius ${SPOTLIGHT_DURATION}ms ${EASE}`,
            pointerEvents: 'none',
            zIndex: 100,
        }
        : {
            // No hole — full overlay
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            borderRadius: 0,
            backgroundColor: `rgba(0, 0, 0, ${mounted ? 0.55 : 0})`,
            transition: 'background-color 0.4s ease',
            pointerEvents: 'auto',
            zIndex: 100,
        };

    return (
        <>
            {/* Dark overlay / spotlight hole */}
            <div style={holeStyle} />

            {/* Click catcher for dismissing (only the dark area, not the hole) */}
            {hole && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        pointerEvents: 'auto',
                    }}
                    onClick={handleFinish}
                >
                    {/* Carve out a transparent click-through zone over the spotlight hole */}
                    <div
                        style={{
                            position: 'fixed',
                            top: hole.top,
                            left: hole.left,
                            width: hole.width,
                            height: hole.height,
                            borderRadius: 16,
                            transition: `all ${SPOTLIGHT_DURATION}ms ${EASE}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
            {!hole && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                    onClick={handleFinish}
                />
            )}

            {/* Tooltip card */}
            <div
                ref={tooltipRef}
                style={{
                    position: 'fixed',
                    zIndex: 101,
                    width: 380,
                    maxWidth: 'calc(100vw - 32px)',
                    top: tooltip.top,
                    left: tooltip.left,
                    opacity: tooltip.visible ? 1 : 0,
                    transform: tooltip.visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)',
                    transition: `opacity ${TOOLTIP_FADE}ms ease, transform ${TOOLTIP_FADE}ms ease`,
                    pointerEvents: tooltip.visible ? 'auto' : 'none',
                }}
            >
                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 25px 60px -12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                    {/* Header with mascot */}
                    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 p-5 flex items-start gap-4">
                        <div className="pt-0.5">
                            <OwlMascot mood={step.mood} size={52} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-gray-900">{step.title}</h4>
                                <button
                                    onClick={handleFinish}
                                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors cursor-pointer flex-shrink-0 -mt-0.5 -mr-0.5"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">{step.body}</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 flex items-center justify-between bg-white border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        height: 6,
                                        width: i === currentStep ? 20 : 6,
                                        borderRadius: 3,
                                        backgroundColor: i <= currentStep ? '#6366f1' : '#e5e7eb',
                                        transition: `width 0.3s ${EASE}, background-color 0.3s ease`,
                                    }}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={handlePrev}
                                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Back
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                {currentStep === steps.length - 1 ? (
                                    <>Done <Sparkles className="h-4 w-4" /></>
                                ) : (
                                    <>Next <ChevronRight className="h-4 w-4" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// --- TUTORIAL TRIGGER BUTTON ---

export const TutorialButton = ({ onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
        title="Start tutorial"
    >
        <OwlMascot mood="happy" size={24} />
        <span>Show me how</span>
    </button>
);

export default SpotlightTutorial;
