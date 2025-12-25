// RTB (Reason To Believe) Labels for the 6 product images
export const RTB_LABELS = [
    {
        id: 1,
        name: "Product Features",
        description: "Show key product attributes and specifications",
        shortName: "Features"
    },
    {
        id: 2,
        name: "Sensory Experience",
        description: "Visual, tactile, taste, or smell - how the product feels",
        shortName: "Sensory"
    },
    {
        id: 3,
        name: "Emotional Connection",
        description: "Lifestyle and aspirational imagery - how it makes you feel",
        shortName: "Emotional"
    },
    {
        id: 4,
        name: "Trigger Event",
        description: "The moment when the need for this product arises",
        shortName: "Trigger"
    },
    {
        id: 5,
        name: "Usage Occasion",
        description: "Where and when the product is used in real life",
        shortName: "Usage"
    },
    {
        id: 6,
        name: "Text Ad",
        description: "Promotional text overlay or advertising copy",
        shortName: "Text Ad"
    }
];

// Tag system configuration
export const TAG_CONFIG = {
    MAX_TRIGGER_TAGS: 5,
    MAX_SOLUTION_TAGS: 5,
    DISPLAY_TRIGGER_TAGS: 2,
    DISPLAY_SOLUTION_TAGS: 2,
    TOTAL_MAX_TAGS: 10,
    TOTAL_DISPLAY_TAGS: 4
};

// Tag category definitions
export const TAG_CATEGORIES = {
    TRIGGER: {
        id: 'trigger',
        name: 'Trigger Event Tags',
        description: 'Tags describing when/why customers need this product',
        color: 'amber',
        bgClass: 'bg-amber-100',
        textClass: 'text-amber-800',
        borderClass: 'border-amber-300',
        maxTags: TAG_CONFIG.MAX_TRIGGER_TAGS,
        displayTags: TAG_CONFIG.DISPLAY_TRIGGER_TAGS
    },
    SOLUTION: {
        id: 'solution',
        name: 'Solution Tags',
        description: 'Tags describing what problem this product solves',
        color: 'teal',
        bgClass: 'bg-teal-100',
        textClass: 'text-teal-800',
        borderClass: 'border-teal-300',
        maxTags: TAG_CONFIG.MAX_SOLUTION_TAGS,
        displayTags: TAG_CONFIG.DISPLAY_SOLUTION_TAGS
    }
};

// Media configuration
export const MEDIA_CONFIG = {
    MAX_IMAGES: 6,
    MAX_VIDEOS: 1,
    MIN_IMAGE_WIDTH: 600,
    MIN_IMAGE_HEIGHT: 600,
    OUTPUT_SIZE: 600,
    ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ACCEPTED_VIDEO_TYPES: ['video/mp4']
};

// User role configuration
export const USER_ROLES = {
    SUPER_ADMIN: 'superAdmin',
    VENDOR: 'vendor',
    VIEWER: 'viewer'
};

// Helper function to check if user is a viewer
export const isViewer = (user) => {
    return user?.customClaims?.viewer === true;
};

// Helper function to check if user is a super admin
export const isSuperAdmin = (user, SUPER_ADMIN_UID) => {
    return (user?.customClaims?.superAdmin === true) || (user?.uid === SUPER_ADMIN_UID);
};

// Helper function to check if user can edit products
export const canEditProducts = (user, SUPER_ADMIN_UID) => {
    return isSuperAdmin(user, SUPER_ADMIN_UID) || (user?.customClaims?.class && !isViewer(user));
};
