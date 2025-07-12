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
  showTypingEffect?: boolean;
  typingDelay?: number;
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
  showTypingEffect = false,
  typingDelay = 0,
}) => {
  const t = TRANSLATIONS[language];
  const [copied, setCopied] = useState(false);

  const handleCopyHtml = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(slide.htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy HTML:', err);
    }
  };

  return (
    <div
      className={`
        border rounded-lg overflow-hidden transition-all cursor-pointer
        ${isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* 페이지 번호 */}
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            {slideNumber}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={(e) => { e.stopPropagation(); onTabChange('preview'); }}
              className={`
                flex items-center gap-1 px-2 py-1 text-xs rounded
                ${activeTab === 'preview' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              <Eye className="w-3 h-3" />
              {t.preview}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTabChange('code'); }}
              className={`
                flex items-center gap-1 px-2 py-1 text-xs rounded
                ${activeTab === 'code' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
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
                  ${copied ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}
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
          className="p-1 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      <div className="p-3">
        {activeTab === 'preview' ? (
          <div
            className="w-full overflow-hidden"
            style={containerStyle}
            dangerouslySetInnerHTML={{ __html: slide.htmlContent }}
          />
        ) : (
          <div 
            className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40 cursor-text select-all"
            onClick={(e) => {
              e.stopPropagation();
              // HTML 코드 영역 클릭 시 전체 선택
              const selection = window.getSelection();
              const range = document.createRange();
              range.selectNodeContents(e.currentTarget);
              selection?.removeAllRanges();
              selection?.addRange(range);
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