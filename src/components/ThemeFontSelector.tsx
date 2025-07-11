import React from 'react';
import { Type } from 'lucide-react';

export interface ThemeFont {
  id: string;
  name: string;
  fontFamily: string;
  fontUrl?: string;
  effects: {
    textShadow?: string;
    textStroke?: string;
    letterSpacing?: string;
    fontWeight?: string;
  };
}

interface ThemeFontSelectorProps {
  currentFont: ThemeFont;
  onFontChange: (font: ThemeFont) => void;
}

const THEME_FONTS: ThemeFont[] = [
  {
    id: 'modern-clean',
    name: '모던 클린',
    fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
    fontUrl: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/variable/pretendardvariable.css',
    effects: {
      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
      letterSpacing: '-0.02em',
      fontWeight: '600'
    }
  },
  {
    id: 'elegant-serif',
    name: '우아한 세리프',
    fontFamily: "'Noto Serif KR', serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap',
    effects: {
      textShadow: '0 1px 3px rgba(0,0,0,0.2)',
      letterSpacing: '0.02em',
      fontWeight: '600'
    }
  },
  {
    id: 'bold-impact',
    name: '임팩트 볼드',
    fontFamily: "'Black Han Sans', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap',
    effects: {
      textShadow: '3px 3px 0px rgba(0,0,0,0.3)',
      letterSpacing: '0.05em',
      fontWeight: '900'
    }
  },
  {
    id: 'playful-round',
    name: '귀여운 라운드',
    fontFamily: "'Jua', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Jua&display=swap',
    effects: {
      textShadow: '0 2px 8px rgba(0,0,0,0.15)',
      letterSpacing: '0.03em',
      fontWeight: '400'
    }
  },
  {
    id: 'minimal-light',
    name: '미니멀 라이트',
    fontFamily: "'Noto Sans KR', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500&display=swap',
    effects: {
      textShadow: 'none',
      letterSpacing: '0.01em',
      fontWeight: '300'
    }
  },
  {
    id: 'handwriting',
    name: '손글씨 스타일',
    fontFamily: "'Kalam', cursive",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap',
    effects: {
      textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
      letterSpacing: '0.02em',
      fontWeight: '400'
    }
  },
  {
    id: 'tech-mono',
    name: '테크 모노',
    fontFamily: "'JetBrains Mono', monospace",
    fontUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap',
    effects: {
      textShadow: '0 0 10px rgba(0,255,255,0.3)',
      letterSpacing: '0.1em',
      fontWeight: '600'
    }
  },
  {
    id: 'vintage-classic',
    name: '빈티지 클래식',
    fontFamily: "'Crimson Text', serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600&display=swap',
    effects: {
      textShadow: '2px 2px 4px rgba(139,69,19,0.3)',
      letterSpacing: '0.03em',
      fontWeight: '600'
    }
  },
  {
    id: 'futuristic',
    name: '미래적',
    fontFamily: "'Orbitron', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap',
    effects: {
      textShadow: '0 0 20px rgba(0,255,255,0.5), 0 0 30px rgba(0,255,255,0.3)',
      letterSpacing: '0.15em',
      fontWeight: '700'
    }
  },
  {
    id: 'artistic-brush',
    name: '아티스틱 브러시',
    fontFamily: "'Caveat', cursive",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap',
    effects: {
      textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
      letterSpacing: '0.02em',
      fontWeight: '600'
    }
  }
];

export const ThemeFontSelector: React.FC<ThemeFontSelectorProps> = ({
  currentFont,
  onFontChange,
}) => {
  return (
    <div className="bg-white rounded-lg border p-3 space-y-3">
      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <Type className="w-4 h-4" />
        폰트 스타일
      </h4>
      
      <div className="grid grid-cols-2 gap-2">
        {THEME_FONTS.map((font) => (
          <button
            key={font.id}
            onClick={() => onFontChange(font)}
            className={`p-2 rounded border-2 transition-all duration-200 text-left ${
              currentFont.id === font.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div 
              className="text-sm font-medium mb-1"
              style={{
                fontFamily: font.fontFamily,
                textShadow: font.effects.textShadow,
                letterSpacing: font.effects.letterSpacing,
                fontWeight: font.effects.fontWeight,
              }}
            >
              예시 텍스트
            </div>
            <div className="text-xs text-gray-600 truncate">
              {font.name}
            </div>
          </button>
        ))}
      </div>
      
      {/* 현재 선택된 폰트 정보 */}
      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
        <div>선택됨: <span className="font-medium">{currentFont.name}</span></div>
      </div>
    </div>
  );
}; 