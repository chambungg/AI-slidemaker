import React from 'react';
import { Theme } from '../types';
import { DEFAULT_THEMES, TRANSLATIONS } from '../constants';

interface ThemeSelectorProps {
  selectedTheme: Theme;
  language: 'ko' | 'en';
  onThemeChange: (theme: Theme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedTheme,
  language,
  onThemeChange,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {t.themeColors}
      </label>
      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
        {DEFAULT_THEMES.map((theme, index) => (
          <button
            key={index}
            onClick={() => onThemeChange(theme)}
            className={`
              flex space-x-1 p-2 rounded-lg border-2 transition-all hover:scale-105
              ${JSON.stringify(theme) === JSON.stringify(selectedTheme)
                ? 'border-gray-400 ring-2 ring-blue-500'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            title={`Theme ${index + 1}`}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.primary }}
            />
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.secondary }}
            />
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};