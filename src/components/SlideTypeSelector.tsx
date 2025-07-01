import React from 'react';
import { TRANSLATIONS } from '../constants';
import { FileText, Presentation, Image } from 'lucide-react';

export type SlideType = 'card-news' | 'ppt' | 'image-card';

interface SlideTypeSelectorProps {
  selectedType: SlideType;
  language: 'ko' | 'en';
  onTypeChange: (type: SlideType) => void;
}

export const SlideTypeSelector: React.FC<SlideTypeSelectorProps> = ({
  selectedType,
  language,
  onTypeChange,
}) => {
  const t = TRANSLATIONS[language];

  const slideTypes = [
    {
      id: 'card-news' as SlideType,
      name: language === 'ko' ? '카드뉴스' : 'Card News',
      description: language === 'ko' 
        ? '짧고 요약된 문구 위주의 카드 형태' 
        : 'Short and summarized card format',
      icon: FileText,
    },
    {
      id: 'ppt' as SlideType,
      name: language === 'ko' ? 'PPT' : 'PPT',
      description: language === 'ko' 
        ? '일반적인 프레젠테이션 스타일' 
        : 'Standard presentation style',
      icon: Presentation,
    },
    {
      id: 'image-card' as SlideType,
      name: language === 'ko' ? '이미지카드' : 'Image Card',
      description: language === 'ko' 
        ? '이미지와 메시지가 조합된 형태' 
        : 'Image with message combination',
      icon: Image,
    },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {language === 'ko' ? '슬라이드 타입' : 'Slide Type'}
      </label>
      
      <div className="grid grid-cols-1 gap-3">
        {slideTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => onTypeChange(type.id)}
              className={`
                flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                ${selectedType === type.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${selectedType === type.id ? 'text-blue-600' : 'text-gray-500'}`} />
              <div>
                <div className={`font-medium ${selectedType === type.id ? 'text-blue-900' : 'text-gray-900'}`}>
                  {type.name}
                </div>
                <div className={`text-sm ${selectedType === type.id ? 'text-blue-700' : 'text-gray-600'}`}>
                  {type.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};