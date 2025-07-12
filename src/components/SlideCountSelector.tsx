import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface SlideCountSelectorProps {
  count: number;
  onCountChange: (count: number) => void;
  isDarkMode?: boolean;
  language?: 'ko' | 'en';
}

export const SlideCountSelector: React.FC<SlideCountSelectorProps> = ({
  count,
  onCountChange,
  isDarkMode = false,
  language = 'ko',
}) => {
  const handleDecrease = () => {
    if (count > 1) {
      onCountChange(count - 1);
    }
  };

  const handleIncrease = () => {
    if (count < 20) {
      onCountChange(count + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 20) {
      onCountChange(value);
    }
  };

  return (
    <div className={`rounded-lg border p-3 space-y-3 transition-colors ${
      isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {language === 'ko' ? '슬라이드 개수' : 'Number of Slides'}
        </h4>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={handleDecrease}
          disabled={count <= 1}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            isDarkMode 
              ? 'border-gray-600 hover:bg-gray-600 text-gray-300' 
              : 'border-gray-300 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <div className="flex-1 flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="20"
            value={count}
            onChange={handleInputChange}
            className={`w-16 px-2 py-1 text-center border rounded text-sm font-medium transition-colors ${
              isDarkMode 
                ? 'bg-gray-600 border-gray-500 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>개</span>
        </div>
        
        <button
          onClick={handleIncrease}
          disabled={count >= 20}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            isDarkMode 
              ? 'border-gray-600 hover:bg-gray-600 text-gray-300' 
              : 'border-gray-300 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      {/* 슬라이더 */}
      <div className="space-y-2">
        <input
          type="range"
          min="1"
          max="20"
          value={count}
          onChange={(e) => onCountChange(parseInt(e.target.value))}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
            isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
          }`}
        />
        <div className={`flex justify-between text-xs ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <span>1개</span>
          <span>20개</span>
        </div>
      </div>
      
      {/* 추천 개수 */}
      <div className="grid grid-cols-4 gap-2">
        {[3, 5, 8, 10].map((recommendedCount) => (
          <button
            key={recommendedCount}
            onClick={() => onCountChange(recommendedCount)}
            className={`
              px-2 py-1 rounded text-xs font-medium transition-colors
              ${count === recommendedCount
                ? isDarkMode 
                  ? 'bg-blue-600 text-blue-100 border border-blue-500'
                  : 'bg-blue-100 text-blue-700 border border-blue-300'
                : isDarkMode
                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {recommendedCount}개
          </button>
        ))}
      </div>
    </div>
  );
}; 