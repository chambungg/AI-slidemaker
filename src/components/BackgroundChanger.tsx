import React, { useRef, useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Image, Upload, Sliders } from 'lucide-react';
import { ImageSearch } from './ImageSearch';

interface BackgroundChangerProps {
  currentBackground?: string;
  backgroundBlur?: number;
  themeOverlay?: number;
  language: 'ko' | 'en';
  onBackgroundChange: (imageUrl: string) => void;
  onBackgroundBlurChange?: (blur: number) => void;
  onThemeOverlayChange?: (overlay: number) => void;
}

export const BackgroundChanger: React.FC<BackgroundChangerProps> = ({
  currentBackground,
  backgroundBlur = 0,
  themeOverlay = 0.2,
  language,
  onBackgroundChange,
  onBackgroundBlurChange,
  onThemeOverlayChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onBackgroundChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Image className="w-4 h-4" />
        {t.changeBackground}
      </label>
      
      <div className="space-y-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Upload className="w-4 h-4" />
          {t.uploadImage}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {currentBackground && (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={currentBackground}
                alt="Current background"
                className="w-full h-20 object-cover rounded border"
                style={{
                  filter: `blur(${backgroundBlur}px)`,
                }}
              />
              <button
                onClick={() => onBackgroundChange('')}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>

            {/* Background Effects Controls */}
            {(onBackgroundBlurChange || onThemeOverlayChange) && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Sliders className="w-4 h-4" />
                  배경 효과 조절
                </h4>
                
                {onBackgroundBlurChange && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      흐림 정도
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={backgroundBlur}
                      onChange={(e) => onBackgroundBlurChange(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{backgroundBlur.toFixed(1)}px</span>
                  </div>
                )}

                {onThemeOverlayChange && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      테마 색상 오버레이
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="0.8"
                      step="0.05"
                      value={themeOverlay}
                      onChange={(e) => onThemeOverlayChange(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{Math.round(themeOverlay * 100)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Image Search Component */}
        <ImageSearch
          language={language}
          onImageSelect={onBackgroundChange}
        />
      </div>
    </div>
  );
};