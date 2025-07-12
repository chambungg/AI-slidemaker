import React from 'react';
import { Presentation, CreditCard, Image } from 'lucide-react';

export type SlideType = 'ppt' | 'cardnews' | 'imagecard';

interface SlideTypeOption {
  id: SlideType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface SlideTypeSelectorProps {
  selectedType: SlideType;
  language: 'ko' | 'en';
  onTypeChange: (type: SlideType) => void;
  isDarkMode?: boolean;
}

const SLIDE_TYPE_OPTIONS: Record<'ko' | 'en', SlideTypeOption[]> = {
  ko: [
    {
      id: 'ppt',
      name: 'PPT',
      description: '일반적인 프레젠테이션 형식으로 제목과 내용이 구분된 슬라이드',
      icon: <Presentation className="w-5 h-5" />
    },
    {
      id: 'cardnews',
      name: '카드뉴스',
      description: '소셜미디어에 적합한 카드 형식의 정보 전달 슬라이드',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'imagecard',
      name: '이미지카드',
      description: '이미지 중심의 시각적 임팩트가 강한 카드 형식',
      icon: <Image className="w-5 h-5" />
    }
  ],
  en: [
    {
      id: 'ppt',
      name: 'PPT',
      description: 'Standard presentation format with distinct titles and content',
      icon: <Presentation className="w-5 h-5" />
    },
    {
      id: 'cardnews',
      name: 'Card News',
      description: 'Card-style information delivery slides suitable for social media',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'imagecard',
      name: 'Image Card',
      description: 'Image-focused card format with strong visual impact',
      icon: <Image className="w-5 h-5" />
    }
  ]
};

export const SlideTypeSelector: React.FC<SlideTypeSelectorProps> = ({
  selectedType,
  language,
  onTypeChange,
  isDarkMode = false,
}) => {
  const options = SLIDE_TYPE_OPTIONS[language];

  return (
    <div className={`rounded-lg border p-3 space-y-3 transition-colors ${
      isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
    }`}>
      <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        {language === 'ko' ? '슬라이드 타입' : 'Slide Type'}
      </h4>
      
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onTypeChange(option.id)}
            className={`relative p-3 rounded border-2 transition-all duration-200 group ${
              selectedType === option.id
                ? isDarkMode 
                  ? 'border-blue-400 bg-blue-900 bg-opacity-30' 
                  : 'border-blue-500 bg-blue-50'
                : isDarkMode
                  ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-600'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            title={option.description}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`${selectedType === option.id ? 'text-blue-400' : isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {option.icon}
              </div>
              <span className={`text-xs font-medium ${
                selectedType === option.id 
                  ? isDarkMode ? 'text-blue-300' : 'text-blue-800'
                  : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {option.name}
              </span>
            </div>
            
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
              {option.description}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};