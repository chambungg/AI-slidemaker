import React, { useState } from 'react';
import { Slide } from '../types';
import { TRANSLATIONS } from '../constants';
import { Eye, Code, Trash2, Copy, Check } from 'lucide-react';

interface SlidePreviewProps {
  slide: Slide;
  slideNumber: number;
  activeTab: 'preview' | 'code';
  language: 'ko' | 'en';
  onTabChange: (tab: 'preview' | 'code') => void;
  onDelete: () => void;
  isActive: boolean;
  onClick: () => void;
  containerStyle?: React.CSSProperties;
  isDarkMode?: boolean;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({
  slide,
  slideNumber,
  activeTab,
  language,
  onTabChange,
  onDelete,
  isActive,
  onClick,
  containerStyle,
  isDarkMode = false,
}) => {
  const t = TRANSLATIONS[language];
  const [copied, setCopied] = useState(false);

  const handleCopyHtml = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(slide.htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy error handled silently
    }
  };

  return (
    <div
      className={`
        border rounded-lg overflow-hidden transition-all cursor-pointer
        ${isActive 
          ? 'border-blue-500 ring-2 ring-blue-200' 
          : isDarkMode 
            ? 'border-gray-600 hover:border-gray-500' 
            : 'border-gray-200 hover:border-gray-300'
        }
      `}
      onClick={onClick}
    >
      <div className={`flex items-center justify-between p-3 border-b transition-colors ${
        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          {/* 페이지 번호 */}
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
            isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'
          }`}>
            {slideNumber}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={(e) => { e.stopPropagation(); onTabChange('preview'); }}
              className={`
                flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors
                ${activeTab === 'preview' 
                  ? isDarkMode 
                    ? 'bg-blue-900 text-blue-200' 
                    : 'bg-blue-100 text-blue-700'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <Eye className="w-3 h-3" />
              {t.preview}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTabChange('code'); }}
              className={`
                flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors
                ${activeTab === 'code' 
                  ? isDarkMode 
                    ? 'bg-blue-900 text-blue-200' 
                    : 'bg-blue-100 text-blue-700'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <Code className="w-3 h-3" />
              {t.html}
            </button>
            {activeTab === 'code' && (
              <button
                onClick={handleCopyHtml}
                className={`
                  flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors
                  ${copied 
                    ? isDarkMode 
                      ? 'bg-green-900 text-green-200' 
                      : 'bg-green-100 text-green-700'
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
                title="HTML 코드 복사"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? '복사됨' : '복사'}
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className={`p-1 rounded transition-colors ${
            isDarkMode 
              ? 'text-red-400 hover:bg-red-900/20' 
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      <div className="p-3">
        {activeTab === 'preview' ? (
          <div
            className="w-full overflow-hidden relative bg-white rounded-lg border border-gray-200"
            style={{
              width: containerStyle?.width || '500px',
              height: containerStyle?.height || '300px',
              minHeight: '200px', // 최소 높이 보장
              maxWidth: '100%'
            }}
          >
            <div
              className="slide-preview-content absolute inset-0"
              style={{
                transformOrigin: 'top left',
                transform: 'scale(1)', // 스케일 1로 고정
                overflow: 'hidden',
                width: '100%',
                height: '100%',
                clipPath: 'inset(0)' // 컨테이너 경계 밖 내용 잘라내기
              }}
              dangerouslySetInnerHTML={{ __html: slide.htmlContent }}
            />
          </div>
        ) : (
          <div 
            className={`text-xs p-3 rounded overflow-auto h-96 cursor-text transition-colors ${
              isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-900'
            }`}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <pre className="whitespace-pre-wrap font-mono">
              <code>{slide.htmlContent}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};