// Unsplash API integration for high-quality free images

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

export const searchImages = async (query: string): Promise<PexelsImage[]> => {
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

export const getRandomImages = (count = 6): PexelsImage[] => {
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

// Lorem Picsum API를 사용한 배경 이미지 생성 (ID 방식)
export const generatePicsumImage = (
  width = 1200,
  height = 800,
  seed?: string,
  blur?: number,
  grayscale?: boolean
): string => {
  // 시드를 기반으로 일관된 이미지 ID 생성 (1-1000 범위)
  const imageId = seed ? (generateSeedFromContent(seed) % 1000) + 1 : Math.floor(Math.random() * 1000) + 1;
  
  let url = `https://picsum.photos/id/${imageId}/${width}/${height}`;
  
  const params = new URLSearchParams();
  // Issue #9 fix: Support blur 0 (only add blur param if blur > 0)
  if (blur && blur > 0) {params.append('blur', blur.toString());}
  if (grayscale) {params.append('grayscale', '');}
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return url;
};

// 콘텐츠 기반 시드 생성 - 숫자 반환
export const generateSeedFromContent = (content: string): number => {
  // 콘텐츠를 기반으로 일관된 해시 생성
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  return Math.abs(hash);
};

// 콘텐츠 분석 기반 카테고리별 시드 생성
export const getCategoryBasedSeed = (content: string): string => {
  const lowerContent = content.toLowerCase();
  
  // 카테고리별 시드 베이스
  const categorySeeds = {
    business: ['business', 'meeting', 'office', 'work', 'team', 'company'],
    technology: ['tech', 'digital', 'computer', 'software', 'app', 'data'],
    nature: ['nature', 'environment', 'green', 'eco', 'outdoor', 'landscape'],
    education: ['education', 'learn', 'study', 'school', 'course', 'training'],
    creative: ['creative', 'design', 'art', 'innovation', 'idea', 'inspiration'],
    health: ['health', 'medical', 'wellness', 'fitness', 'care', 'hospital'],
    finance: ['finance', 'money', 'investment', 'banking', 'economy', 'market'],
    travel: ['travel', 'vacation', 'journey', 'destination', 'explore', 'adventure']
  };
  
  // 콘텐츠에서 카테고리 매칭
  for (const [category, keywords] of Object.entries(categorySeeds)) {
    if (keywords.some(keyword => lowerContent.includes(keyword))) {
      const baseHash = generateSeedFromContent(content);
      return `${category}-${baseHash}`;
    }
  }
  
  // 기본 시드
  return generateSeedFromContent(content).toString();
};

// 배경 이미지 옵션 인터페이스
export interface BackgroundImageOptions {
  seed: string;
  blur: number;
  grayscale: boolean;
  width: number;
  height: number;
}

// 기본 배경 이미지 옵션 생성
export const createDefaultBackgroundOptions = (content: string): BackgroundImageOptions => {
  return {
    seed: getCategoryBasedSeed(content),
    blur: 2,
    grayscale: false,
    width: 1200,
    height: 800
  };
};

// 다음/이전 시드 생성 (좌우 버튼용)
export const getNextSeed = (currentSeed: string): string => {
  const hash = generateSeedFromContent(currentSeed + 'next');
  return hash.toString();
};

export const getPreviousSeed = (currentSeed: string): string => {
  const hash = generateSeedFromContent(currentSeed + 'prev');
  return hash.toString();
};

// 랜덤 시드 생성
export const getRandomSeed = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// 기존 getBackgroundForContent 함수를 Lorem Picsum으로 대체
export const getBackgroundForContent = (content: string): string => {
  const options = createDefaultBackgroundOptions(content);
  return generatePicsumImage(
    options.width,
    options.height,
    options.seed,
    options.blur,
    options.grayscale
  );
};