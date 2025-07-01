import React from 'react';
import { AspectRatio } from '../types';
import { ASPECT_RATIOS, TRANSLATIONS } from '../constants';

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio;
  language: 'ko' | 'en';
  onRatioChange: (ratio: AspectRatio) => void;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  selectedRatio,
  language,
  onRatioChange,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {t.slideAspectRatio}
      </label>
      <select
        value={selectedRatio.value}
        onChange={(e) => {
          const ratio = ASPECT_RATIOS.find(r => r.value === e.target.value);
          if (ratio) onRatioChange(ratio);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {ASPECT_RATIOS.map((ratio) => (
          <option key={ratio.value} value={ratio.value}>
            {ratio.label}
          </option>
        ))}
      </select>
    </div>
  );
};