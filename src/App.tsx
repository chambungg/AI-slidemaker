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
import { ThemeFontSelector, ThemeFont } from './components/ThemeFontSelector';
import { ThemeTemplateSelector, ThemeTemplateOption } from './components/ThemeTemplateSelector';
import { SlideBorderStyleSelector, SlideBorderStyle } from './components/SlideBorderStyleSelector';
import { SlideCountSelector } from './components/SlideCountSelector';
import { 
  Sparkles, 
  Download, 
  FileText, 
  Globe, 
  Loader,
  Presentation,
  Lightbulb,
  Shuffle
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
        // 화면 비율이 변경되면 배경 이미지도 새로 생성하지만 시드는 유지
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
            themeFont,
            slideBorderStyle,
            slide.template || themeTemplate.defaultLayout,
            backgroundImage,
            slide.backgroundBlur || 2,
            slide.themeOverlay || 0.3
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

    const contentPrompts = {
      ko: [
        "최신 AI 기술 동향과 미래 전망에 대한 발표 자료를 만들어주세요",
        "지속가능한 환경을 위한 친환경 기술과 실천 방안에 대해 설명해주세요",
        "디지털 마케팅 전략과 소셜미디어 활용법에 대한 프레젠테이션을 준비해주세요",
        "창업을 위한 비즈니스 모델 구성과 투자 유치 방법을 소개해주세요",
        "팀워크 향상을 위한 의사소통 기법과 협업 도구 활용법을 알려주세요",
        "데이터 분석의 중요성과 비즈니스 인사이트 도출 방법을 설명해주세요",
        "온라인 교육의 효과적인 설계와 운영 방안에 대해 논의해주세요",
        "건강한 라이프스타일을 위한 운동과 영양 관리법을 제시해주세요",
        "글로벌 시장 진출을 위한 국제화 전략과 문화적 고려사항을 다뤄주세요",
        "미래 직업 트렌드와 필요한 역량 개발 방향에 대해 분석해주세요"
      ],
      en: [
        "Create a presentation about the latest AI technology trends and future prospects",
        "Explain eco-friendly technologies and practices for sustainable environment",
        "Prepare a presentation on digital marketing strategies and social media utilization",
        "Introduce business model composition and investment attraction methods for startups",
        "Share communication techniques and collaboration tools for improving teamwork",
        "Explain the importance of data analysis and methods for deriving business insights",
        "Discuss effective design and operation of online education",
        "Present exercise and nutrition management for a healthy lifestyle",
        "Cover internationalization strategies and cultural considerations for global market entry",
        "Analyze future job trends and necessary competency development directions"
      ]
    };

    try {
      const prompts = contentPrompts[state.language];
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      
      setState(prev => ({ 
        ...prev, 
        content: randomPrompt,
        isGenerating: false 
      }));
    } catch (error) {
      console.error('Error generating AI content prompt:', error);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
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

  const handleSlideMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= state.slides.length) return;
    
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
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  {t.content}
                </label>
                <button
                  onClick={generateAIContentPrompt}
                  disabled={!state.geminiApiKey || state.isGenerating}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="AI가 프롬프트 예시를 생성합니다"
                >
                  {state.isGenerating ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <Lightbulb className="w-3 h-3" />
                  )}
                  AI 예시
                </button>
              </div>
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

            <SlideCountSelector
              count={slideCount}
              onCountChange={setSlideCount}
            />

            <ThemeSelector
              selectedTheme={state.theme}
              onThemeChange={(theme) => setState(prev => ({ ...prev, theme }))}
              language={state.language}
            />

            <ThemeFontSelector
              currentFont={themeFont}
              onFontChange={setThemeFont}
            />

            <ThemeTemplateSelector
              currentTemplate={themeTemplate}
              onTemplateChange={setThemeTemplate}
            />

            <SlideBorderStyleSelector
              selectedStyle={slideBorderStyle}
              onStyleChange={setSlideBorderStyle}
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
                  onSlideMove={handleSlideMove}
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