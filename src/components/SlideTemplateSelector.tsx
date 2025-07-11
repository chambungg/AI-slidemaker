import React from 'react';
import { Layout, AlignLeft, AlignRight, AlignCenter, Maximize2, CornerUpLeft, CornerUpRight } from 'lucide-react';

export type SlideLayoutType = 
  | 'title-top-content-bottom'
  | 'title-left-content-right'
  | 'title-right-content-left'
  | 'title-only'
  | 'title-small-top-left'
  | 'title-small-top-right';

interface SlideTemplate {
  id: SlideLayoutType;
  name: string;
  icon: React.ReactNode;
  preview: string;
  description: string;
}

interface SlideTemplateSelectorProps {
  currentTemplate: SlideLayoutType;
  onTemplateChange: (template: SlideLayoutType) => void;
}

const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: 'title-top-content-bottom',
    name: '상하 분할',
    icon: <AlignCenter className="w-4 h-4" />,
    preview: '제목 상단\n내용 하단',
    description: '제목이 상단, 내용이 하단에 위치'
  },
  {
    id: 'title-left-content-right',
    name: '좌우 분할 (제목 좌측)',
    icon: <AlignLeft className="w-4 h-4" />,
    preview: '제목 | 내용',
    description: '제목이 좌측, 내용이 우측에 위치'
  },
  {
    id: 'title-right-content-left',
    name: '좌우 분할 (제목 우측)',
    icon: <AlignRight className="w-4 h-4" />,
    preview: '내용 | 제목',
    description: '내용이 좌측, 제목이 우측에 위치'
  },
  {
    id: 'title-only',
    name: '제목만',
    icon: <Maximize2 className="w-4 h-4" />,
    preview: '제목',
    description: '제목만 표시'
  },
  {
    id: 'title-small-top-left',
    name: '제목 작게 (좌상단)',
    icon: <CornerUpLeft className="w-4 h-4" />,
    preview: '제목\n내용 많이',
    description: '제목이 좌상단에 작게, 내용이 크게'
  },
  {
    id: 'title-small-top-right',
    name: '제목 작게 (우상단)',
    icon: <CornerUpRight className="w-4 h-4" />,
    preview: '    제목\n내용 많이',
    description: '제목이 우상단에 작게, 내용이 크게'
  }
];

export const SlideTemplateSelector: React.FC<SlideTemplateSelectorProps> = ({
  currentTemplate,
  onTemplateChange,
}) => {
  return (
    <div className="bg-white rounded-lg border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Layout className="w-4 h-4 text-gray-600" />
        <h4 className="text-sm font-semibold text-gray-800">슬라이드 템플릿</h4>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {SLIDE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateChange(template.id)}
            className={`
              relative p-2 rounded-lg border-2 transition-all text-center
              ${currentTemplate === template.id 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            title={template.description}
          >
            <div className="flex flex-col items-center gap-1">
              {template.icon}
              <span className="text-xs font-medium text-gray-700 truncate">
                {template.name}
              </span>
            </div>
            
            {/* 선택 표시 */}
            {currentTemplate === template.id && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}; 