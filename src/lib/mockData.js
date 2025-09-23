export const mockProducts = [
  {
    id: 1,
    name: 'Quantum-Core Laptop Pro 15"',
    subtitle: '16-Core Powerhouse for Professionals',
    price: 1299.99,
    imageUrl: 'https://placehold.co/600x400/e2e8f0/4a5568?text=Laptop+Pro',
    vendor: 'ElectroGadgets',
    rating: 4.5,
    reviewCount: 120,
    category: 'Electronics',
    shortDescription: 'High-performance laptop with a 16-core CPU, 32GB RAM, and a stunning 4K display.',
    longDescription: 'The future of computing is here. With a 16-core processor, 32GB of RAM, and a stunning 4K display, the Quantum-Core Laptop Pro is built for professionals who demand performance.',
    tags: ['laptop', 'pro', '4k display', 'developer', 'designer'],
    images: [
        'https://placehold.co/600x400/e2e8f0/4a5568?text=Laptop+View+1',
        'https://placehold.co/600x400/d1d5db/4a5568?text=Laptop+View+2',
        'https://placehold.co/600x400/9ca3af/4a5568?text=Laptop+View+3'
    ],
    videoUrl: null
  },
  {
    id: 2,
    name: 'ErgoComfort Office Chair',
    subtitle: 'Support Your Body, Boost Your Productivity',
    price: 349.50,
    imageUrl: 'https://placehold.co/600x400/e2e8f0/4a5568?text=Office+Chair',
    vendor: 'FurnitureWorld',
    rating: 4.8,
    reviewCount: 350,
    category: 'Home & Office',
    shortDescription: 'Ergonomic mesh chair with adjustable lumbar support for all-day comfort.',
    longDescription: 'Experience unparalleled comfort with the ErgoComfort chair. Featuring lumbar support, adjustable armrests, and a breathable mesh back, it\'s the perfect upgrade for your workspace.',
    tags: ['office', 'furniture', 'ergonomic', 'comfort', 'health'],
    images: [
        'https://placehold.co/600x400/e2e8f0/4a5568?text=Chair+View+1'
    ],
    videoUrl: 'https://placehold.co/600x400/000000/ffffff?text=Product+Video'
  },
    {
    id: 3,
    name: 'Organic Fair-Trade Coffee Beans',
    subtitle: 'Rich, Aromatic, and Ethically Sourced',
    price: 22.00,
    imageUrl: 'https://placehold.co/600x400/e2e8f0/4a5568?text=Coffee+Beans',
    vendor: 'The Daily Grind',
    rating: 4.9,
    reviewCount: 890,
    category: 'Groceries',
    shortDescription: 'Premium single-origin organic coffee beans, roasted to perfection for a smooth flavor.',
    longDescription: 'Start your day right with our premium, single-origin organic coffee beans. Sourced from fair-trade farms, each batch is roasted to perfection for a smooth, rich flavor.',
    tags: ['coffee', 'organic', 'fair-trade', 'grocery', 'beverage'],
    images: [
        'https://placehold.co/600x400/e2e8f0/4a5568?text=Coffee+View+1'
    ],
    videoUrl: null
  },
  {
    id: 4,
    name: 'Pro-Grip Dumbbell Set',
    subtitle: 'Your Complete Home Gym Solution',
    price: 199.99,
    imageUrl: 'https://placehold.co/600x400/e2e8f0/4a5568?text=Dumbbells',
    vendor: 'FitLife Equipment',
    rating: 4.7,
    reviewCount: 215,
    category: 'Sports & Outdoors',
    shortDescription: 'Versatile and adjustable dumbbell set with safe, comfortable pro-grip handles.',
    longDescription: 'A versatile dumbbell set perfect for home workouts. The pro-grip handles ensure safety and comfort, while the adjustable weights allow you to progress at your own pace.',
    tags: ['fitness', 'home gym', 'weights', 'workout', 'sports'],
    images: [
        'https://placehold.co/600x400/e2e8f0/4a5568?text=Dumbbell+View+1',
        'https://placehold.co/600x400/d1d5db/4a5568?text=Dumbbell+View+2'
    ],
    videoUrl: null
  },
];

export const mockReviews = {
    1: [{ user: 'Alex', rating: 5, comment: 'Incredible speed and display quality!' }, { user: 'Beth', rating: 4, comment: 'Great for work, but battery could be better.' }],
    2: [{ user: 'Charlie', rating: 5, comment: 'My back has never been happier. Worth every penny!' }],
    3: [{ user: 'Diana', rating: 5, comment: 'The best coffee I have ever made at home. So smooth!' }],
    4: [{ user: 'Ethan', rating: 4, comment: 'Solid set for the price. The grips are very comfortable.' }],
};

export const mockVendorProducts = [mockProducts[0], mockProducts[3]];