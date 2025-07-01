import React, { useState } from 'react';
import { Slide, Theme, AspectRatio } from '../types';
import { updateSlideContent } from '../utils/slideGenerator';
import { TRANSLATIONS } from '../constants';
import { TemplateSelector } from './TemplateSelector';
import { BackgroundChanger } from './BackgroundChanger';
import { Send, Loader } from 'lucide-react';

interface SlideEditorProps {
  slide: Slide;
  theme: Theme;
  aspectRatio: AspectRatio;
  apiKey: string;
  language: 'ko' | 'en';
  onSlideUpdate: (slide: Slide) => void;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  theme,
  aspectRatio,
  apiKey,
  language,
  onSlideUpdate,
}) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const t = TRANSLATIONS[language];

  const handleUpdate = async () => {
    if (!editPrompt.trim()) return;
    if (!apiKey) {
      alert(t.apiKeyRequired);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedSlide = await updateSlideContent(slide, editPrompt, theme, aspectRatio, apiKey, language);
      onSlideUpdate(updatedSlide);
      setEditPrompt('');
    } catch (error) {
      console.error('Error updating slide:', error);
      alert('Error updating slide. Please check your API key and try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    onSlideUpdate({
      ...slide,
      template: templateId,
    });
  };

  const handleBackgroundChange = (imageUrl: string) => {
    onSlideUpdate({
      ...slide,
      backgroundImage: imageUrl,
    });
  };

  return (
    <div className="space-y-6">
      {/* AI Edit Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-4">{t.editSlide}: {slide.title}</h3>
        
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            {t.modificationRequest}
          </label>
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            placeholder={t.modificationPlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
          
          <button
            onClick={handleUpdate}
            disabled={!editPrompt.trim() || isUpdating || !apiKey}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t.updating}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {t.updateSlide}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Template Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <TemplateSelector
          selectedTemplate={slide.template || 'title-center'}
          theme={theme}
          language={language}
          onTemplateChange={(template) => handleTemplateChange(template.id)}
        />
      </div>

      {/* Background Changer */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <BackgroundChanger
          currentBackground={slide.backgroundImage}
          language={language}
          onBackgroundChange={handleBackgroundChange}
        />
      </div>
    </div>
  );
};