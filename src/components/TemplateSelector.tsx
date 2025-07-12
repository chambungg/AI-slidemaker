import React from 'react';
import { SlideTemplate } from '../types';
import { SLIDE_TEMPLATES, TRANSLATIONS } from '../constants';
import { Palette } from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplate: string;
  language: 'ko' | 'en';
  onTemplateChange: (template: SlideTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  language,
  onTemplateChange,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Palette className="w-4 h-4" />
        {t.templates}
      </label>
      
      <div className="grid grid-cols-3 gap-2">
        {SLIDE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateChange(template)}
            className={`
              p-3 rounded-lg border-2 transition-all hover:scale-105 text-center
              ${selectedTemplate === template.id
                ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
          >
            <div className="text-2xl mb-1">{template.preview}</div>
            <div className="text-xs font-medium text-gray-700">
              {template.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};