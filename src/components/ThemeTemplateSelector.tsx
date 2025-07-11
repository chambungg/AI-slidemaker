import React from 'react';
import { Layout, Grid3X3 } from 'lucide-react';
import { SlideLayoutType } from './SlideTemplateSelector';

export interface ThemeTemplateOption {
  id: string;
  name: string;
  description: string;
  defaultLayout: SlideLayoutType;
}

export interface ThemeTemplateSelectorProps {
  selectedTemplate: ThemeTemplateOption;
  onTemplateChange: (template: ThemeTemplateOption) => void;
}

const THEME_TEMPLATES: ThemeTemplateOption[] = [
  {
    id: 'mixed-auto',
    name: '자동 혼합',
    description: '슬라이드마다 다양한 레이아웃 자동 적용',
    defaultLayout: 'title-top-content-bottom'
  },
  {
    id: 'title-top-unified',
    name: '상하 통일',
    description: '모든 슬라이드를 상하 분할로 통일',
    defaultLayout: 'title-top-content-bottom'
  },
  {
    id: 'title-left-unified',
    name: '좌우 통일 (제목 좌측)',
    description: '모든 슬라이드를 좌우 분할 (제목 좌측)로 통일',
    defaultLayout: 'title-left-content-right'
  },
  {
    id: 'title-right-unified',
    name: '좌우 통일 (제목 우측)',
    description: '모든 슬라이드를 좌우 분할 (제목 우측)로 통일',
    defaultLayout: 'title-right-content-left'
  },
  {
    id: 'title-small-left-unified',
    name: '제목 작게 (좌상단)',
    description: '모든 슬라이드를 제목 작게 (좌상단)로 통일',
    defaultLayout: 'title-small-top-left'
  },
  {
    id: 'title-small-right-unified',
    name: '제목 작게 (우상단)',
    description: '모든 슬라이드를 제목 작게 (우상단)로 통일',
    defaultLayout: 'title-small-top-right'
  }
];

export const ThemeTemplateSelector: React.FC<ThemeTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateChange,
}) => {
  return (
    <div className="bg-white rounded-lg border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Grid3X3 className="w-4 h-4 text-gray-600" />
        <h4 className="text-sm font-semibold text-gray-800">테마 템플릿</h4>
      </div>
      
      <div className="space-y-2">
        {THEME_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateChange(template)}
            className={`
              w-full p-3 rounded-lg border-2 transition-all text-left
              ${selectedTemplate.id === template.id 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800">
                  {template.name}
                </span>
                {selectedTemplate.id === template.id && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600">
                {template.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; 