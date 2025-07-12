import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface BackgroundImageLoaderProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  children?: React.ReactNode;
}

export const BackgroundImageLoader: React.FC<BackgroundImageLoaderProps> = ({
  src,
  alt = '',
  className = '',
  style = {},
  onLoad,
  onError,
  children
}) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!src) {
      setImageStatus('error');
      return;
    }

    setImageStatus('loading');
    const img = new Image();
    
    const handleLoad = () => {
      setImageStatus('loaded');
      onLoad?.();
    };

    const handleError = () => {
      if (retryCount < maxRetries) {
        // 재시도 전 잠시 대기
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setImageStatus('loading');
        }, 1000 * (retryCount + 1)); // 점진적으로 대기 시간 증가
      } else {
        setImageStatus('error');
        onError?.();
      }
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, retryCount, maxRetries, onLoad, onError]);

  const handleManualRetry = () => {
    setRetryCount(0);
    setImageStatus('loading');
  };

  return (
    <div 
      className={`relative ${className}`} 
      style={style}
    >
      {imageStatus === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">
              이미지 로딩 중... {retryCount > 0 && `(${retryCount}/${maxRetries})`}
            </p>
          </div>
        </div>
      )}

      {imageStatus === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-10">
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-gray-600 text-xs">❌</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">이미지 로드 실패</p>
            <button
              onClick={handleManualRetry}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mx-auto"
            >
              <RefreshCw className="w-3 h-3" />
              다시 시도
            </button>
          </div>
        </div>
      )}

      {imageStatus === 'loaded' && (
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full object-cover"
        />
      )}

      {children}
    </div>
  );
};