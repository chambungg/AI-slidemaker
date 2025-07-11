import React, { useState, useEffect } from 'react';
import { SlideGeneratorState, Slide, Theme, AspectRatio, ApiSettings } from './types';
import { ASPECT_RATIOS, DEFAULT_THEMES, TRANSLATIONS } from './constants';
import { generateSlides, generateSlideHTML } from './utils/slideGenerator';
import { exportToPDF, exportToHTML } from './utils/exportUtils';
import { getDecryptedApiKey, saveEncryptedApiKey } from './utils/encryption';
import { createDefaultBackgroundOptions, generatePicsumImage } from './utils/imageSearch';
import { ThemeSelector } from './components/ThemeSelector';
import { AspectRatioSelector } from './components/AspectRatioSelector';
import { SlidesContainer } from './components/SlidesContainer';
import { ApiSettings as ApiSettingsComponent } from './components/ApiSettings';
import { LanguageSelector } from './components/LanguageSelector';
import { SlideTypeSelector, SlideType } from './components/SlideTypeSelector';
import { ResizablePanel } from './components/ResizablePanel';
import { 
  Sparkles, 
  Download, 
  FileText, 
  Globe, 
  Loader,
  Presentation
} from 'lucide-react';
// Hello World!
function App() {
  const [state, setState] = useState<SlideGeneratorState>({
    content: '',
    theme: DEFAULT_THEMES[0],
    aspectRatio: ASPECT_RATIOS[0],
    slides: [],
    activeSlideId: null,
    isGenerating: false,
    activeTab: 'preview',
    geminiApiKey: '',
    language: 'ko',
    selectedElementId: undefined,
  });

  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    geminiApiKey: '',
    isConfigured: false,
  });

  const [slideType, setSlideType] = useState<SlideType>('ppt');

  // Load saved settings from localStorage
  useEffect(() => {
    const savedApiKey = getDecryptedApiKey();
    const savedLanguage = localStorage.getItem('language') as 'ko' | 'en';
    const savedSlideType = localStorage.getItem('slideType') as SlideType;
    
    if (savedApiKey) {
      setApiSettings({
        geminiApiKey: savedApiKey,
        isConfigured: true,
      });
      setState(prev => ({ ...prev, geminiApiKey: savedApiKey }));
    }
    
    if (savedLanguage) {
      setState(prev => ({ ...prev, language: savedLanguage }));
    }

    if (savedSlideType) {
      setSlideType(savedSlideType);
    }
  }, []);

  // Update slides when theme or aspect ratio changes
  useEffect(() => {
    if (state.slides.length > 0) {
      const updatedSlides = state.slides.map(slide => {
        // 화면 비율이 변경되면 배경 이미지도 새로 생성
        const backgroundImage = slide.backgroundSeed 
          ? generatePicsumImage(
              state.aspectRatio.width,
              state.aspectRatio.height,
              slide.backgroundSeed,
              slide.backgroundBlur || 2,
              slide.backgroundGrayscale || false
            )
          : slide.backgroundImage;

        return {
          ...slide,
          backgroundImage,
          htmlContent: generateSlideHTML(
            slide.title,
            slide.content,
            state.theme,
            state.aspectRatio,
            slide.order,
            undefined,
            undefined,
            slide.template || 'title-center',
            backgroundImage,
            slide.backgroundBlur || 2,
            slide.themeOverlay || 0.3
          ),
        };
      });
      setState(prev => ({ ...prev, slides: updatedSlides }));
    }
  }, [state.theme, state.aspectRatio]);

  const t = TRANSLATIONS[state.language];

  const handleApiKeyChange = (apiKey: string) => {
    saveEncryptedApiKey(apiKey);
    setApiSettings({
      geminiApiKey: apiKey,
      isConfigured: !!apiKey,
    });
    setState(prev => ({ ...prev, geminiApiKey: apiKey }));
  };

  const handleLanguageChange = (language: 'ko' | 'en') => {
    localStorage.setItem('language', language);
    setState(prev => ({ ...prev, language }));
  };

  const handleSlideTypeChange = (type: SlideType) => {
    localStorage.setItem('slideType', type);
    setSlideType(type);
  };

  const handleGenerate = async () => {
    if (!state.content.trim()) return;
    if (!state.geminiApiKey) {
      alert(t.apiKeyRequired);
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true }));
    
    try {
      const slides = await generateSlides(
        state.content, 
        state.theme, 
        state.aspectRatio, 
        state.geminiApiKey,
        state.language,
        slideType
      );
      setState(prev => ({
        ...prev,
        slides,
        activeSlideId: slides[0]?.id || null,
        isGenerating: false,
      }));
    } catch (error) {
      console.error('Error generating slides:', error);
      alert('Error generating slides. Please check your API key and try again.');
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleSlideUpdate = (updatedSlide: Slide) => {
    setState(prev => ({
      ...prev,
      slides: prev.slides.map(slide =>
        slide.id === updatedSlide.id ? updatedSlide : slide
      ),
    }));
  };

  const handleSlideDelete = (slideId: string) => {
    setState(prev => ({
      ...prev,
      slides: prev.slides.filter(slide => slide.id !== slideId),
      activeSlideId: prev.activeSlideId === slideId ? null : prev.activeSlideId,
    }));
  };

  const handleAddSlide = (afterIndex?: number) => {
    const backgroundOptions = createDefaultBackgroundOptions(t.addContentHere);
    const backgroundImage = generatePicsumImage(
      state.aspectRatio.width,
      state.aspectRatio.height,
      backgroundOptions.seed,
      backgroundOptions.blur,
      backgroundOptions.grayscale
    );

    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      title: t.newSlide,
      content: t.addContentHere,
      htmlContent: generateSlideHTML(
        t.newSlide, 
        t.addContentHere, 
        state.theme, 
        state.aspectRatio, 
        0,
        undefined,
        undefined,
        'title-center',
        backgroundImage,
        backgroundOptions.blur,
        0.3
      ),
      order: afterIndex !== undefined ? afterIndex + 1 : state.slides.length,
      template: 'title-center',
      backgroundImage,
      backgroundBlur: backgroundOptions.blur,
      backgroundSeed: backgroundOptions.seed,
      backgroundGrayscale: backgroundOptions.grayscale,
      slideLayout: 'title-top-content-bottom',
      themeOverlay: 0.3,
      elements: [],
      history: [],
      historyIndex: 0,
    };

    setState(prev => ({
      ...prev,
      slides: afterIndex !== undefined 
        ? [
            ...prev.slides.slice(0, afterIndex + 1),
            newSlide,
            ...prev.slides.slice(afterIndex + 1)
          ]
        : [...prev.slides, newSlide],
      activeSlideId: newSlide.id,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Presentation className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          </div>
          
          {state.slides.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportToPDF(state.slides, state.aspectRatio)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                {t.exportPDF}
              </button>
              <button
                onClick={() => exportToHTML(state.slides, state.aspectRatio)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Globe className="w-4 h-4" />
                {t.exportHTML}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Input & Settings */}
        <ResizablePanel 
          defaultWidth={350} 
          minWidth={300} 
          maxWidth={500} 
          position="left"
          className="bg-white border-r border-gray-200 p-6 overflow-y-auto"
        >
          <div className="space-y-6">
            <LanguageSelector
              language={state.language}
              onLanguageChange={handleLanguageChange}
            />

            <ApiSettingsComponent
              apiSettings={apiSettings}
              language={state.language}
              onApiKeyChange={handleApiKeyChange}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t.content}
              </label>
              <textarea
                value={state.content}
                onChange={(e) => setState(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t.contentPlaceholder}
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <SlideTypeSelector
              selectedType={slideType}
              language={state.language}
              onTypeChange={handleSlideTypeChange}
            />

            <ThemeSelector
              selectedTheme={state.theme}
              onThemeChange={(theme) => setState(prev => ({ ...prev, theme }))}
              language={state.language}
            />

            <AspectRatioSelector
              selectedRatio={state.aspectRatio}
              onRatioChange={(aspectRatio) => setState(prev => ({ ...prev, aspectRatio }))}
              language={state.language}
            />

            <button
              onClick={handleGenerate}
              disabled={!state.content.trim() || state.isGenerating || !state.geminiApiKey}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state.isGenerating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {t.generating}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t.generateSlides}
                </>
              )}
            </button>
          </div>
        </ResizablePanel>

        {/* Center Panel - Slides with Direct WYSIWYG Editing */}
        <div className="flex-1 p-6 overflow-y-auto">
          {state.slides.length > 0 ? (
            <SlidesContainer
              slides={state.slides}
              activeSlideId={state.activeSlideId}
              activeTab={state.activeTab}
              language={state.language}
              theme={state.theme}
              aspectRatio={state.aspectRatio}
              onTabChange={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}
              onSlideSelect={(slideId) => setState(prev => ({ ...prev, activeSlideId: slideId }))}
              onSlideDelete={handleSlideDelete}
              onAddSlide={handleAddSlide}
              onSlideUpdate={handleSlideUpdate}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Presentation className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">{t.noSlidesGenerated}</p>
                <p className="text-sm">{t.addContentAndGenerate}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;