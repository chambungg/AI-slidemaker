import React from 'react';
import { Layout, LayoutGrid } from 'lucide-react';

export interface ThemeTemplateOption {
  id: string;
  name: string;
  description: string;
  defaultLayout: string;
  icon: React.ReactNode;
}

interface ThemeTemplateSelectorProps {
  currentTemplate: ThemeTemplateOption;
  onTemplateChange: (template: ThemeTemplateOption) => void;
}

const THEME_TEMPLATE_OPTIONS: ThemeTemplateOption[] = [
  {
    id: 'mixed-auto',
    name: '자동 혼합',
    description: '슬라이드마다 다양한 레이아웃 자동 적용',
    defaultLayout: 'title-top-content-bottom',
    icon: (
      <div className="w-8 h-6 border border-gray-400 rounded flex flex-col">
        <div className="h-2 bg-blue-300 rounded-t"></div>
        <div className="flex-1 bg-gray-200 rounded-b flex">
          <div className="w-1/2 bg-green-200"></div>
          <div className="w-1/2 bg-yellow-200"></div>
        </div>
      </div>
    )
  },
  {
    id: 'presentation-formal',
    name: '정식 발표',
    description: '제목과 내용이 명확히 구분된 정형화된 레이아웃',
    defaultLayout: 'title-top-content-bottom',
    icon: (
      <div className="w-8 h-6 border border-gray-400 rounded flex flex-col">
        <div className="h-2 bg-blue-400 rounded-t"></div>
        <div className="flex-1 bg-gray-200 rounded-b"></div>
      </div>
    )
  },
  {
    id: 'side-by-side',
    name: '좌우 분할',
    description: '제목과 내용을 좌우로 나누어 배치',
    defaultLayout: 'title-left-content-right',
    icon: (
      <div className="w-8 h-6 border border-gray-400 rounded flex">
        <div className="w-1/2 bg-blue-300 rounded-l"></div>
        <div className="w-1/2 bg-gray-200 rounded-r"></div>
      </div>
    )
  },
  {
    id: 'title-focus',
    name: '제목 중심',
    description: '제목을 강조하는 임팩트 있는 레이아웃',
    defaultLayout: 'title-only',
    icon: (
      <div className="w-8 h-6 border border-gray-400 rounded flex items-center justify-center">
        <div className="w-6 h-3 bg-blue-500 rounded"></div>
      </div>
    )
  },
  {
    id: 'content-heavy',
    name: '내용 중심',
    description: '많은 내용을 효과적으로 표시하는 레이아웃',
    defaultLayout: 'title-small-top-left',
    icon: (
      <div className="w-8 h-6 border border-gray-400 rounded flex flex-col">
        <div className="h-1 bg-blue-300 rounded-t"></div>
        <div className="flex-1 bg-gray-300 rounded-b"></div>
      </div>
    )
  },
  {
    id: 'creative-asymmetric',
    name: '크리에이티브',
    description: '창의적이고 비대칭적인 레이아웃',
    defaultLayout: 'title-right-content-left',
    icon: (
      <div className="w-8 h-6 border border-gray-400 rounded flex">
        <div className="w-2/3 bg-gray-200 rounded-l"></div>
        <div className="w-1/3 bg-blue-300 rounded-r"></div>
      </div>
    )
  }
];

export const ThemeTemplateSelector: React.FC<ThemeTemplateSelectorProps> = ({
  currentTemplate,
  onTemplateChange,
}) => {
  return (
    <div className="bg-white rounded-lg border p-3 space-y-3">
      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <LayoutGrid className="w-4 h-4" />
        템플릿 스타일
      </h4>
      
      <div className="grid grid-cols-2 gap-2">
        {THEME_TEMPLATE_OPTIONS.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateChange(template)}
            className={`p-2 rounded border-2 transition-all duration-200 text-left ${
              currentTemplate.id === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            title={template.description}
          >
            <div className="flex items-center gap-2 mb-1">
              {template.icon}
              <div className="text-xs font-medium text-gray-800 truncate">
                {template.name}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* 현재 선택된 템플릿 정보 */}
      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
        <div>선택됨: <span className="font-medium">{currentTemplate.name}</span></div>
        <div className="text-gray-400 mt-1">{currentTemplate.description}</div>
      </div>
    </div>
  );
}; 