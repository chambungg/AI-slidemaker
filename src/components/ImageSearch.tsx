import React, { useState, useEffect, useRef } from 'react';
import { searchImages, getRandomImages, PexelsImage } from '../utils/imageSearch';
import { TRANSLATIONS } from '../constants';
import { Search, Loader, Image as ImageIcon, RefreshCw } from 'lucide-react';

interface ImageSearchProps {
  language: 'ko' | 'en';
  onImageSelect: (imageUrl: string) => void;
}

export const ImageSearch: React.FC<ImageSearchProps> = ({
  language,
  onImageSelect,
}) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<PexelsImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<number, number>>({});
  const [retryingImages, setRetryingImages] = useState<Set<number>>(new Set());
  const retryTimeouts = useRef<Record<number, NodeJS.Timeout>>({});
  const t = TRANSLATIONS[language];

  const handleSearch = async () => {
    if (!query.trim()) {
      // Show random images if no query
      const randomImages = getRandomImages(6);
      setImages(randomImages);
      setShowResults(true);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchImages(query);
      setImages(results);
      setShowResults(true);
    } catch (error) {
      // Image search error handled without logging
      // Fallback to random images
      const randomImages = getRandomImages(6);
      setImages(randomImages);
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (image: PexelsImage) => {
    onImageSelect(image.src.large);
    setShowResults(false);
    setQuery('');
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(retryTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <ImageIcon className="w-4 h-4" />
        {t.searchImages}
      </label>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchImagesPlaceholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
      </div>

      {showResults && (
        <div className="border border-gray-200 rounded-lg p-3 bg-white max-h-64 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => handleImageSelect(image)}
                className="relative group overflow-hidden rounded border hover:border-blue-500 transition-colors h-[200px]"
              >
                {retryingImages.has(image.id) ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <img
                    src={image.src.small}
                    alt={`Image ${image.id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={() => {
                      const errorCount = imageLoadErrors[image.id] || 0;
                      if (errorCount < 5) {
                        setImageLoadErrors(prev => ({ ...prev, [image.id]: errorCount + 1 }));
                        setRetryingImages(prev => new Set(prev).add(image.id));
                        
                        // Clear any existing timeout
                        if (retryTimeouts.current[image.id]) {
                          clearTimeout(retryTimeouts.current[image.id]);
                        }
                        
                        // Retry after 5 seconds
                        retryTimeouts.current[image.id] = setTimeout(() => {
                          setRetryingImages(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(image.id);
                            return newSet;
                          });
                          // Force re-render by updating a dummy state
                          const img = new Image();
                          img.src = image.src.small;
                        }, 5000);
                      }
                    }}
                    onLoad={() => {
                      // Clear retry state on successful load
                      setImageLoadErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[image.id];
                        return newErrors;
                      });
                      setRetryingImages(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(image.id);
                        return newSet;
                      });
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />
              </button>
            ))}
          </div>
          
          {images.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 py-4">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t.noImagesFound}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};