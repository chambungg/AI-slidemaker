import React, { useState } from 'react';
import { ApiSettings as ApiSettingsType } from '../types';
import { TRANSLATIONS } from '../constants';
import { saveEncryptedApiKey } from '../utils/encryption';
import { Key, Save, Settings, Shield } from 'lucide-react';

interface ApiSettingsProps {
  apiSettings: ApiSettingsType;
  language: 'ko' | 'en';
  onApiKeyChange: (apiKey: string) => void;
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({
  apiSettings,
  language,
  onApiKeyChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(!apiSettings.isConfigured);
  const [tempApiKey, setTempApiKey] = useState(apiSettings.geminiApiKey);
  const t = TRANSLATIONS[language];

  const handleSave = () => {
    saveEncryptedApiKey(tempApiKey);
    onApiKeyChange(tempApiKey);
    setIsExpanded(false);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {t.apiSettings}
        </div>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="w-4 h-4 inline mr-1" />
              {t.geminiApiKey}
            </label>
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder={t.geminiApiKeyPlaceholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Save className="w-4 h-4" />
            {t.saveApiKey}
          </button>
          
          {apiSettings.isConfigured && (
            <div className="flex items-center gap-2 text-xs text-green-600 text-center justify-center">
              <Shield className="w-3 h-3" />
              ✓ API key encrypted and saved
            </div>
          )}
        </div>
      )}
    </div>
  );
};