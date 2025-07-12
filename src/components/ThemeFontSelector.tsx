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
  isDarkMode?: boolean;
  language?: 'ko' | 'en';
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
  isDarkMode = false,
  language = 'ko',
}) => {
  return (
    <div className={`rounded-lg border p-3 space-y-3 transition-colors ${
      isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
    }`}>
      <h4 className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        <Type className="w-4 h-4" />
        {language === 'ko' ? '폰트 스타일' : 'Font Style'}
      </h4>
      
      <div className="grid grid-cols-2 gap-2">
        {THEME_FONTS.map((font) => (
          <button
            key={font.id}
            onClick={() => onFontChange(font)}
            className={`relative p-3 rounded border-2 transition-all duration-200 group ${
              currentFont.id === font.id
                ? isDarkMode 
                  ? 'border-blue-400 bg-blue-900 bg-opacity-30' 
                  : 'border-blue-500 bg-blue-50'
                : isDarkMode
                  ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-600'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            title={language === 'ko' ? font.name : font.name}
          >
            <div className="text-left">
              <div className={`text-xs font-medium mb-1 ${
                currentFont.id === font.id 
                  ? isDarkMode ? 'text-blue-300' : 'text-blue-800'
                  : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {language === 'ko' ? font.name : font.id}
              </div>
              <div 
                className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                style={{
                  fontFamily: font.fontFamily,
                  fontWeight: font.effects.fontWeight,
                  letterSpacing: font.effects.letterSpacing,
                  lineHeight: '1.2', // Assuming a default line height for preview
                }}
              >
                {language === 'ko' ? '안녕하세요!' : 'Hello World!'}
              </div>
            </div>
            
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
              {language === 'ko' ? font.name : font.name}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; 