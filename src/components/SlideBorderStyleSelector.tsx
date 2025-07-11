import React from 'react';
import { Square, Minus, CornerUpLeft, Palette } from 'lucide-react';

export interface SlideBorderStyle {
  id: string;
  name: string;
  borderWidth: number;
  borderStyle: string;
  borderRadius: number;
  boxShadow: string;
}

export interface SlideBorderStyleSelectorProps {
  selectedStyle: SlideBorderStyle;
  onStyleChange: (style: SlideBorderStyle) => void;
}

const BORDER_STYLES: SlideBorderStyle[] = [
  {
    id: 'none',
    name: '테두리 없음',
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: 0,
    boxShadow: 'none'
  },
  {
    id: 'clean-minimal',
    name: '깔끔한 선',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 8,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  {
    id: 'modern-card',
    name: '모던 카드',
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
  },
  {
    id: 'bold-frame',
    name: '굵은 프레임',
    borderWidth: 3,
    borderStyle: 'solid',
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
  },
  {
    id: 'dashed-creative',
    name: '점선 창의적',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  {
    id: 'dotted-playful',
    name: '점점 재미있는',
    borderWidth: 2,
    borderStyle: 'dotted',
    borderRadius: 16,
    boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
  },
  {
    id: 'double-professional',
    name: '이중선 전문적',
    borderWidth: 3,
    borderStyle: 'double',
    borderRadius: 4,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  {
    id: 'glow-effect',
    name: '글로우 효과',
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: 20,
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3), 0 8px 32px rgba(0,0,0,0.1)'
  }
];

export const SlideBorderStyleSelector: React.FC<SlideBorderStyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
}) => {
  return (
    <div className="bg-white rounded-lg border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Square className="w-4 h-4 text-gray-600" />
        <h4 className="text-sm font-semibold text-gray-800">테두리 스타일</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {BORDER_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleChange(style)}
            className={`
              relative p-3 rounded-lg border-2 transition-all text-left
              ${selectedStyle.id === style.id 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">
                {style.name}
              </div>
              
              {/* 스타일 미리보기 */}
              <div className="flex items-center justify-center">
                <div 
                  className="w-12 h-8 bg-gradient-to-r from-blue-100 to-purple-100"
                  style={{
                    borderWidth: style.borderWidth,
                    borderStyle: style.borderStyle,
                    borderColor: '#6366f1',
                    borderRadius: style.borderRadius,
                    boxShadow: style.boxShadow,
                  }}
                />
              </div>
            </div>
            
            {/* 선택 표시 */}
            {selectedStyle.id === style.id && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}; 