import React from 'react';
import { Type, Palette } from 'lucide-react';

export interface ThemeFont {
  id: string;
  name: string;
  fontFamily: string;
  fontUrl?: string;
  effects: {
    textShadow: string;
    textStroke: string;
    letterSpacing: string;
    fontWeight: string;
  };
}

export interface ThemeFontSelectorProps {
  selectedFont: ThemeFont;
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
      textStroke: 'none',
      letterSpacing: '-0.02em',
      fontWeight: '600'
    }
  },
  {
    id: 'bold-impact',
    name: '볼드 임팩트',
    fontFamily: "'Montserrat', 'Noto Sans KR', sans-serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap',
    effects: {
      textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
      textStroke: '1px rgba(255,255,255,0.3)',
      letterSpacing: '0.05em',
      fontWeight: '800'
    }
  },
  {
    id: 'elegant-serif',
    name: '우아한 세리프',
    fontFamily: "'Playfair Display', 'Noto Serif KR', serif",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap',
    effects: {
      textShadow: '1px 1px 3px rgba(0,0,0,0.2)',
      textStroke: 'none',
      letterSpacing: '0.02em',
      fontWeight: '700'
    }
  },
  {
    id: 'tech-futuristic',
    name: '테크 퓨처',
    fontFamily: "'Orbitron', 'Noto Sans KR', monospace",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap',
    effects: {
      textShadow: '0 0 10px rgba(0,255,255,0.5), 2px 2px 4px rgba(0,0,0,0.3)',
      textStroke: '1px rgba(0,255,255,0.3)',
      letterSpacing: '0.1em',
      fontWeight: '900'
    }
  },
  {
    id: 'handwritten',
    name: '손글씨 스타일',
    fontFamily: "'Caveat', 'Noto Sans KR', cursive",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap',
    effects: {
      textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
      textStroke: 'none',
      letterSpacing: '0.05em',
      fontWeight: '600'
    }
  },
  {
    id: 'retro-vintage',
    name: '레트로 빈티지',
    fontFamily: "'Fredoka One', 'Noto Sans KR', cursive",
    fontUrl: 'https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap',
    effects: {
      textShadow: '3px 3px 0px rgba(0,0,0,0.3), 6px 6px 0px rgba(0,0,0,0.1)',
      textStroke: '2px rgba(255,255,255,0.8)',
      letterSpacing: '0.05em',
      fontWeight: '400'
    }
  }
];

export const ThemeFontSelector: React.FC<ThemeFontSelectorProps> = ({
  selectedFont,
  onFontChange,
}) => {
  // 폰트 로드
  React.useEffect(() => {
    THEME_FONTS.forEach(font => {
      if (font.fontUrl) {
        const link = document.createElement('link');
        link.href = font.fontUrl;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    });
  }, []);

  return (
    <div className="bg-white rounded-lg border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-gray-600" />
        <h4 className="text-sm font-semibold text-gray-800">테마 폰트</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {THEME_FONTS.map((font) => (
          <button
            key={font.id}
            onClick={() => onFontChange(font)}
            className={`
              relative p-3 rounded-lg border-2 transition-all text-left
              ${selectedFont.id === font.id 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">
                {font.name}
              </div>
              
              {/* 폰트 미리보기 */}
              <div 
                className="text-sm text-gray-800 min-h-[40px] flex items-center justify-center bg-gray-100 rounded p-2"
                style={{
                  fontFamily: font.fontFamily,
                  textShadow: font.effects.textShadow,
                  WebkitTextStroke: font.effects.textStroke,
                  letterSpacing: font.effects.letterSpacing,
                  fontWeight: font.effects.fontWeight,
                }}
              >
                슬라이드 제목
              </div>
            </div>
            
            {/* 선택 표시 */}
            {selectedFont.id === font.id && (
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