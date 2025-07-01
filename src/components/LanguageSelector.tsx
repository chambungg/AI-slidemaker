import React from 'react';
import { TRANSLATIONS } from '../constants';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  language: 'ko' | 'en';
  onLanguageChange: (language: 'ko' | 'en') => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onLanguageChange,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        <Globe className="w-4 h-4 inline mr-1" />
        {t.language}
      </label>
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as 'ko' | 'en')}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="ko">{t.korean}</option>
        <option value="en">{t.english}</option>
      </select>
    </div>
  );
};