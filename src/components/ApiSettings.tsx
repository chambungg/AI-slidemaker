import React, { useState } from 'react';
import { ApiSettings as ApiSettingsType } from '../types';
import { TRANSLATIONS } from '../constants';
import { saveEncryptedApiKey, deleteApiKey, isApiKeyStored, getApiKeySavedTime } from '../utils/encryption';
import { Key, Save, Settings, Shield, Trash2, Clock } from 'lucide-react';

interface ApiSettingsProps {
  apiSettings: ApiSettingsType;
  language: 'ko' | 'en';
  onApiKeyChange: (apiKey: string) => void;
  isDarkMode?: boolean;
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({
  apiSettings,
  language,
  onApiKeyChange,
  isDarkMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!apiSettings.isConfigured);
  const [tempApiKey, setTempApiKey] = useState(apiSettings.geminiApiKey);
  const t = TRANSLATIONS[language];

  const handleSave = () => {
    saveEncryptedApiKey(tempApiKey);
    onApiKeyChange(tempApiKey);
    setIsExpanded(false);
  };

  const handleDelete = () => {
    if (confirm('저장된 API 키를 삭제하시겠습니까?')) {
      deleteApiKey();
      setTempApiKey('');
      onApiKeyChange('');
      setIsExpanded(true);
    }
  };

  const savedTime = getApiKeySavedTime();
  const formatSavedTime = (date: Date) => {
    return date.toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between w-full text-left text-sm font-medium ${
          isDarkMode 
            ? 'text-gray-300 hover:text-white' 
            : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          {t.apiSettings}
          {apiSettings.isConfigured && (
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          )}
        </div>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {isExpanded && (
        <div className={`space-y-3 p-3 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <Key className="w-4 h-4 inline mr-1" />
              {t.geminiApiKey}
            </label>
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder={t.geminiApiKeyPlaceholder}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                isDarkMode 
                  ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Save className="w-4 h-4" />
              {t.saveApiKey}
            </button>
            
            {apiSettings.isConfigured && (
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                title="API 키 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {apiSettings.isConfigured && (
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-xs text-center justify-center ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                <Shield className="w-3 h-3" />
                ✓ 256비트 + Base64 이중 암호화로 안전하게 저장됨
              </div>
              
              {savedTime && (
                <div className={`flex items-center gap-2 text-xs text-center justify-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Clock className="w-3 h-3" />
                  저장 시간: {formatSavedTime(savedTime)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};