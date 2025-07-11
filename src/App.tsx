import React, { useState, useEffect } from 'react';
import { SlideGeneratorState, Slide, ApiSettings, ThemeFont, ThemeTemplateOption, SlideBorderStyle } from './types';
import { ASPECT_RATIOS, DEFAULT_THEMES, TRANSLATIONS } from './constants';
import { AI_CONTENT_PROMPTS } from './constants/prompts';
import { generateSlides, generateSlideHTML } from './utils/slideGenerator';
import { ExportModal } from './components/ExportModal';
import { getDecryptedApiKey, saveEncryptedApiKey } from './utils/encryption';
import { createDefaultBackgroundOptions, generatePicsumImage } from './utils/imageSearch';
import { ThemeSelector } from './components/ThemeSelector';
import { AspectRatioSelector } from './components/AspectRatioSelector';
import { SlidesContainer } from './components/SlidesContainer';
import { ApiSettings as ApiSettingsComponent } from './components/ApiSettings';
import { SlideTypeSelector, SlideType } from './components/SlideTypeSelector';
import { ResizablePanel } from './components/ResizablePanel';
import { LoadingAnimation } from './components/LoadingAnimation';
import { ThemeFontSelector } from './components/ThemeFontSelector';
import { ThemeTemplateSelector } from './components/ThemeTemplateSelector';
import { SlideBorderStyleSelector } from './components/SlideBorderStyleSelector';
import { SlideCountSelector } from './components/SlideCountSelector';
import { 
  Sparkles, 
  Download, 
  Loader,
  Presentation,
  Lightbulb,
  Sun,
  Moon,
  Settings
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

  // 다크모드 상태 추가
  const [isDarkMode, setIsDarkMode] = useState(false);
  // 설정 팝업 상태
  const [showSettings, setShowSettings] = useState(false);
  // 내보내기 모달 상태
  const [showExportModal, setShowExportModal] = useState(false);

  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    geminiApiKey: '',
    isConfigured: false,
  });

  const [slideType, setSlideType] = useState<SlideType>('ppt');
  const [slideCount, setSlideCount] = useState<number>(5);
  const [themeFont, setThemeFont] = useState<ThemeFont>({
    id: 'modern-clean',
    name: '모던 클린',
    fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
    fontUrl: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/variable/pretendardvariable.css',
    effects: {
      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textStroke: 'none',
      letterSpacing: '-0.02em',
      fontWeight: '600'
    }
  });
  const [themeTemplate, setThemeTemplate] = useState<ThemeTemplateOption>({
    id: 'mixed-auto',
    name: '자동 혼합',
    description: '슬라이드마다 다양한 레이아웃 자동 적용',
    defaultLayout: 'title-top-content-bottom'
  });
  const [slideBorderStyle, setSlideBorderStyle] = useState<SlideBorderStyle>({
    id: 'clean-minimal',
    name: '깔끔한 선',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 8,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  });

  // Load saved settings from localStorage
  useEffect(() => {
    const savedApiKey = getDecryptedApiKey();
    const savedLanguage = localStorage.getItem('language') as 'ko' | 'en';
    const savedSlideType = localStorage.getItem('slideType') as SlideType;
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    
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

    setIsDarkMode(savedDarkMode);
  }, []);

  // 다크모드 변경시 localStorage에 저장
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Update slides when theme or aspect ratio changes
  useEffect(() => {
    if (state.slides.length > 0) {
      const updatedSlides = state.slides.map(slide => {
        // 화면 비율이 변경되면 배경 이미지도 새로 생성하지만 시드는 유지
        // 배경 타입에 따라 표시할 배경 결정
        const finalBackgroundImage = (slide.backgroundType === 'image' || !slide.backgroundType)
          ? (slide.backgroundSeed
              ? generatePicsumImage(
                  state.aspectRatio.width,
                  state.aspectRatio.height,
                  slide.backgroundSeed,
                  slide.backgroundBlur || 2,
                  slide.backgroundGrayscale || false
                )
              : slide.backgroundImage)
          : undefined;

        return {
          ...slide,
          backgroundImage: finalBackgroundImage,
          htmlContent: generateSlideHTML(
            slide.title,
            slide.content,
            state.theme,
            state.aspectRatio,
            slide.order,
            themeFont,
            slideBorderStyle,
            slide.template || themeTemplate.defaultLayout,
            finalBackgroundImage,
            slide.backgroundBlur || 2,
            slide.themeOverlay || 0.3,
            slide.backgroundType === 'color' ? slide.backgroundColor : undefined, // 배경 타입 유지
            slide.backgroundPattern, // 패턴도 유지
            slide.elements, // elements
            'ppt' // 기본값
          ),
        };
      });
      setState(prev => ({ ...prev, slides: updatedSlides }));
    }
  }, [state.theme, state.aspectRatio, themeFont, themeTemplate, slideBorderStyle]);

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

  // AI 콘텐츠 프롬프트 생성 함수
  const generateAIContentPrompt = async () => {
    if (!state.geminiApiKey) {
      alert(t.apiKeyRequired);
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true }));


    try {
      const prompts = AI_CONTENT_PROMPTS[state.language];
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      
      setState(prev => ({ 
        ...prev, 
        content: randomPrompt,
        isGenerating: false 
      }));
    } catch {
      // Error handled without logging sensitive information
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleGenerate = async () => {
    if (!state.content.trim()) {return;}
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
        slideType,
        slideCount,
        themeTemplate.id // 선택된 템플릿 사용
      );
      setState(prev => ({
        ...prev,
        slides,
        activeSlideId: slides[0]?.id || null,
        isGenerating: false,
      }));
    } catch {
      // Error handled without logging sensitive information
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

  const handleSlideMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= state.slides.length) {return;}
    
    setState(prev => {
      const newSlides = [...prev.slides];
      const [movedSlide] = newSlides.splice(fromIndex, 1);
      newSlides.splice(toIndex, 0, movedSlide);
      
      // 순서 번호 업데이트
      const updatedSlides = newSlides.map((slide, index) => ({
        ...slide,
        order: index
      }));
      
      return {
        ...prev,
        slides: updatedSlides,
      };
    });
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
        themeFont,
        slideBorderStyle,
        'title-center',
        backgroundImage,
        backgroundOptions.blur,
        0.3,
        undefined, // backgroundColor
        undefined, // backgroundPattern
        [], // elements
        'ppt' // 기본값
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
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 transition-colors`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Presentation className="w-8 h-8 text-blue-600" />
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 언어 선택: 한국어, 영어 */}
            <select
              value={state.language}
              onChange={(e) => handleLanguageChange(e.target.value as 'ko' | 'en')}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>

            {/* 설정 버튼 */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={state.language === 'ko' ? '제미나이 API 입력 및 저장' : 'Gemini API Settings'}
              >
                <div className="relative">
                  <Settings className="w-4 h-4" />
                  {apiSettings.isConfigured && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {state.language === 'ko' ? '제미나이 API' : 'Gemini API'}
                </span>
                {apiSettings.isConfigured && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </button>

              {/* 설정 팝업: API 키 입력 및 저장 */}
              {showSettings && (
                <div className={`absolute right-0 top-full mt-2 w-80 p-4 rounded-lg border shadow-lg z-50 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        API 설정
                      </h3>
                      <button
                        onClick={() => setShowSettings(false)}
                        className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        ✕
                      </button>
                    </div>
                    <ApiSettingsComponent
                      apiSettings={apiSettings}
                      language={state.language}
                      onApiKeyChange={handleApiKeyChange}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 다크모드 토글 버튼 */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isDarkMode ? '라이트모드로 변경' : '다크모드로 변경'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {state.slides.length > 0 && (
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="w-4 h-4" />
                {state.language === 'ko' ? '내보내기' : 'Export'}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Input & Settings */}
        <ResizablePanel 
          defaultWidth={320} 
          minWidth={300} 
          maxWidth={420} 
          position="left"
          className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r p-4 overflow-y-auto overflow-x-hidden transition-colors`}
        >
          <div className="space-y-4 max-w-full">
            <div className="w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {t.content}
                </label>
                <button
                  onClick={generateAIContentPrompt}
                  disabled={!state.geminiApiKey || state.isGenerating}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={state.language === 'ko' ? '프롬프트 예시를 생성합니다' : 'Generate prompt example'}
                >
                  {state.isGenerating ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <Lightbulb className="w-3 h-3" />
                  )}
                  {state.language === 'ko' ? '프롬프트 예시' : 'Prompt Example'}
                </button>
              </div>
              <textarea
                value={state.content}
                onChange={(e) => setState(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t.contentPlaceholder}
                className={`w-full h-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!state.content.trim() || state.isGenerating || !state.geminiApiKey}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-lg"
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

            <div className="w-full max-w-full overflow-hidden">
              <SlideTypeSelector
                selectedType={slideType}
                language={state.language}
                onTypeChange={handleSlideTypeChange}
                isDarkMode={isDarkMode}
              />
            </div>

            <div className="w-full max-w-full overflow-hidden">
              <AspectRatioSelector
                selectedRatio={state.aspectRatio}
                onRatioChange={(aspectRatio) => setState(prev => ({ ...prev, aspectRatio }))}
                language={state.language}
                isDarkMode={isDarkMode}
              />
            </div>

            <div className="w-full max-w-full overflow-hidden">
              <SlideCountSelector
                count={slideCount}
                onCountChange={setSlideCount}
                isDarkMode={isDarkMode}
                language={state.language}
              />
            </div>

            <div className="w-full max-w-full overflow-hidden">
              <ThemeSelector
                selectedTheme={state.theme}
                onThemeChange={(theme) => setState(prev => ({ ...prev, theme }))}
                language={state.language}
                isDarkMode={isDarkMode}
              />
            </div>

            <div className="w-full max-w-full overflow-hidden">
              <ThemeFontSelector
                currentFont={themeFont}
                onFontChange={setThemeFont}
                isDarkMode={isDarkMode}
                language={state.language}
              />
            </div>

            <div className="w-full max-w-full overflow-hidden">
              <ThemeTemplateSelector
                currentTemplate={themeTemplate}
                onTemplateChange={setThemeTemplate}
                isDarkMode={isDarkMode}
                language={state.language}
              />
            </div>

            <div className="w-full max-w-full overflow-hidden">
              <SlideBorderStyleSelector
                selectedStyle={slideBorderStyle}
                onStyleChange={setSlideBorderStyle}
                isDarkMode={isDarkMode}
                language={state.language}
              />
            </div>

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
              themeFont={themeFont}
              slideBorderStyle={slideBorderStyle}
              isDarkMode={isDarkMode}
              onTabChange={(tab) => setState(prev => ({ ...prev, activeTab: tab }))}
              onSlideSelect={(slideId) => setState(prev => ({ ...prev, activeSlideId: slideId }))}
              onSlideDelete={handleSlideDelete}
                                onAddSlide={handleAddSlide}
                  onSlideUpdate={handleSlideUpdate}
                  onSlideMove={handleSlideMove}
                />
          ) : (
            <div className={`h-full flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-center">
                <Presentation className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">{t.noSlidesGenerated}</p>
                <p className="text-sm">{t.addContentAndGenerate}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Animation Overlay */}
      <LoadingAnimation 
        isVisible={state.isGenerating} 
        isDarkMode={isDarkMode}
      />

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          slides={state.slides}
          aspectRatio={state.aspectRatio}
          language={state.language}
          isDarkMode={isDarkMode}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

export default App;