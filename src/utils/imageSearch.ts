// Unsplash API integration for high-quality free images
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // Users would need to get their own key

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

export interface PexelsImage {
  id: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

// High-quality curated images from various free sources
const CURATED_BACKGROUND_IMAGES = [
  // Business & Professional
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=800&fit=crop',
  
  // Technology
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=800&fit=crop',
  
  // Nature & Abstract
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=800&fit=crop',
  
  // Education & Learning
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=800&fit=crop',
  
  // Creative & Design
  'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=800&fit=crop',
  
  // Minimal & Clean
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1557683304-673a23048d34?w=1200&h=800&fit=crop',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=800&fit=crop',
];

// Category-based image collections
const IMAGE_CATEGORIES = {
  business: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop',
  ],
  technology: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=800&fit=crop',
  ],
  nature: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
  ],
  education: [
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&h=800&fit=crop',
  ],
  minimal: [
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1557683304-673a23048d34?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=800&fit=crop',
  ],
};

export const searchImages = async (query: string, page: number = 1): Promise<PexelsImage[]> => {
  // Determine category based on query
  const lowerQuery = query.toLowerCase();
  let categoryImages: string[] = [];
  
  if (lowerQuery.includes('business') || lowerQuery.includes('office') || lowerQuery.includes('meeting')) {
    categoryImages = IMAGE_CATEGORIES.business;
  } else if (lowerQuery.includes('tech') || lowerQuery.includes('computer') || lowerQuery.includes('digital')) {
    categoryImages = IMAGE_CATEGORIES.technology;
  } else if (lowerQuery.includes('nature') || lowerQuery.includes('landscape') || lowerQuery.includes('outdoor')) {
    categoryImages = IMAGE_CATEGORIES.nature;
  } else if (lowerQuery.includes('education') || lowerQuery.includes('learn') || lowerQuery.includes('study')) {
    categoryImages = IMAGE_CATEGORIES.education;
  } else if (lowerQuery.includes('minimal') || lowerQuery.includes('clean') || lowerQuery.includes('simple')) {
    categoryImages = IMAGE_CATEGORIES.minimal;
  } else {
    // Mix of all categories for general searches
    categoryImages = [
      ...IMAGE_CATEGORIES.business.slice(0, 2),
      ...IMAGE_CATEGORIES.technology.slice(0, 2),
      ...IMAGE_CATEGORIES.nature.slice(0, 2),
    ];
  }

  // Convert to PexelsImage format
  const images = categoryImages.map((url, index) => ({
    id: index + 1,
    url,
    photographer: 'Unsplash',
    src: {
      original: url,
      large2x: url,
      large: url,
      medium: url,
      small: url,
      portrait: url,
      landscape: url,
      tiny: url,
    },
  }));

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return images.slice(0, 8);
};

export const getRandomImages = (count: number = 6): PexelsImage[] => {
  const shuffled = [...CURATED_BACKGROUND_IMAGES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((url, index) => ({
    id: index + 1,
    url,
    photographer: 'Unsplash',
    src: {
      original: url,
      large2x: url,
      large: url,
      medium: url,
      small: url,
      portrait: url,
      landscape: url,
      tiny: url,
    },
  }));
};

export const getBackgroundForContent = (content: string): string => {
  const lowerContent = content.toLowerCase();
  
  // Business related content
  if (lowerContent.includes('business') || lowerContent.includes('company') || 
      lowerContent.includes('meeting') || lowerContent.includes('office') ||
      lowerContent.includes('team') || lowerContent.includes('work')) {
    return IMAGE_CATEGORIES.business[Math.floor(Math.random() * IMAGE_CATEGORIES.business.length)];
  }
  
  // Technology related content
  if (lowerContent.includes('technology') || lowerContent.includes('digital') || 
      lowerContent.includes('computer') || lowerContent.includes('software') ||
      lowerContent.includes('app') || lowerContent.includes('tech')) {
    return IMAGE_CATEGORIES.technology[Math.floor(Math.random() * IMAGE_CATEGORIES.technology.length)];
  }
  
  // Education related content
  if (lowerContent.includes('education') || lowerContent.includes('learn') || 
      lowerContent.includes('study') || lowerContent.includes('school') ||
      lowerContent.includes('course') || lowerContent.includes('training')) {
    return IMAGE_CATEGORIES.education[Math.floor(Math.random() * IMAGE_CATEGORIES.education.length)];
  }
  
  // Nature related content
  if (lowerContent.includes('nature') || lowerContent.includes('environment') || 
      lowerContent.includes('green') || lowerContent.includes('eco') ||
      lowerContent.includes('outdoor') || lowerContent.includes('landscape')) {
    return IMAGE_CATEGORIES.nature[Math.floor(Math.random() * IMAGE_CATEGORIES.nature.length)];
  }
  
  // Default to minimal/clean backgrounds
  return IMAGE_CATEGORIES.minimal[Math.floor(Math.random() * IMAGE_CATEGORIES.minimal.length)];
};