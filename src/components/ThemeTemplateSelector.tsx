import React from 'react';
import { Layout, LayoutGrid } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

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
  language: 'ko' | 'en';
  isDarkMode?: boolean;
}

const THEME_TEMPLATE_OPTIONS: ThemeTemplateOption[] = [
  {
    id: 'mixed-auto',
    name: 'mixedAuto',
    description: 'mixedAutoDesc',
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
    name: 'presentationFormal',
    description: 'presentationFormalDesc',
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
    name: 'sideBySide',
    description: 'sideBySideDesc',
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
    name: 'titleFocus',
    description: 'titleFocusDesc',
    defaultLayout: 'title-only',
    icon: (
      <div className="w-8 h-6 border border-gray-400 rounded flex items-center justify-center">
        <div className="w-6 h-3 bg-blue-500 rounded"></div>
      </div>
    )
  },
  {
    id: 'content-heavy',
    name: 'contentHeavy',
    description: 'contentHeavyDesc',
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
    name: 'creativeAsymmetric',
    description: 'creativeAsymmetricDesc',
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
  language,
  isDarkMode = false,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-lg border p-3 space-y-3 transition-colors`}>
      <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} flex items-center gap-2`}>
        <LayoutGrid className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        {t.templateStyle}
      </h4>
      
      <div className="grid grid-cols-2 gap-2">
        {THEME_TEMPLATE_OPTIONS.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateChange(template)}
            className={`p-2 rounded border-2 transition-all duration-200 text-left ${
              currentTemplate.id === template.id
                ? isDarkMode
                  ? 'border-blue-500 bg-blue-900/50'
                  : 'border-blue-500 bg-blue-50'
                : isDarkMode
                  ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-600'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            title={t[template.description as keyof typeof t]}
          >
            <div className="flex items-center gap-2 mb-1">
              {template.icon}
              <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-800'} truncate`}>
                {t[template.name as keyof typeof t]}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {/* 현재 선택된 템플릿 정보 */}
      <div className={`text-xs ${isDarkMode ? 'text-gray-400 bg-gray-600' : 'text-gray-500 bg-gray-50'} p-2 rounded transition-colors`}>
        <div>{t.selected}: <span className="font-medium">{t[currentTemplate.name as keyof typeof t]}</span></div>
        <div className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>{t[currentTemplate.description as keyof typeof t]}</div>
      </div>
    </div>
  );
}; 