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
  Shuffle,
  Sun,
  Moon,
  Settings,
  Languages
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
        // 기술 분야
        "최신 AI 기술 동향과 미래 전망에 대한 발표 자료를 만들어주세요",
        "블록체인 기술의 원리와 실생활 적용 사례를 소개해주세요",
        "사물인터넷(IoT)의 발전과 스마트 시티 구축 방안을 설명해주세요",
        "클라우드 컴퓨팅의 장점과 기업 도입 전략을 다뤄주세요",
        "빅데이터 분석의 중요성과 활용 방법을 제시해주세요",
        
        // 비즈니스 분야
        "창업을 위한 비즈니스 모델 구성과 투자 유치 방법을 소개해주세요",
        "디지털 마케팅 전략과 소셜미디어 활용법에 대한 프레젠테이션을 준비해주세요",
        "고객 경험(CX) 향상을 위한 서비스 디자인 방법론을 설명해주세요",
        "원격 근무 시대의 팀 관리와 생산성 향상 방안을 다뤄주세요",
        "ESG 경영의 중요성과 기업의 지속가능성 전략을 소개해주세요",
        
        // 교육 분야
        "온라인 교육의 효과적인 설계와 운영 방안에 대해 논의해주세요",
        "메타버스를 활용한 몰입형 학습 환경 구축 방법을 설명해주세요",
        "개인 맞춤형 학습 시스템과 적응형 교육 기술을 다뤄주세요",
        "디지털 리터러시 교육의 필요성과 실천 방안을 제시해주세요",
        
        // 환경/사회 분야
        "지속가능한 환경을 위한 친환경 기술과 실천 방안에 대해 설명해주세요",
        "재생에너지의 종류와 효율적인 활용 방법을 소개해주세요",
        "순환경제 시스템 구축과 폐기물 관리 혁신을 다뤄주세요",
        "도시농업과 스마트팜 기술의 발전 방향을 설명해주세요",
        
        // 건강/라이프스타일 분야
        "건강한 라이프스타일을 위한 운동과 영양 관리법을 제시해주세요",
        "정신건강 관리와 스트레스 해소 방법을 소개해주세요",
        "디지털 헬스케어 기술과 개인 건강 관리 도구를 다뤄주세요",
        "일과 삶의 균형을 위한 시간 관리 기법을 설명해주세요",
        
        // 글로벌/문화 분야
        "글로벌 시장 진출을 위한 국제화 전략과 문화적 고려사항을 다뤄주세요",
        "다문화 사회의 이해와 상호 존중 문화 조성 방안을 제시해주세요",
        "K-컬처의 세계적 확산과 문화 콘텐츠 산업 전망을 소개해주세요",
        
        // 미래/트렌드 분야
        "미래 직업 트렌드와 필요한 역량 개발 방향에 대해 분석해주세요",
        "인구 고령화 사회의 도전과 기회를 다뤄주세요"
      ],
      en: [
        // Technology
        "Create a presentation about the latest AI technology trends and future prospects",
        "Introduce blockchain technology principles and real-life application cases",
        "Explain IoT development and smart city construction strategies",
        "Cover cloud computing advantages and enterprise adoption strategies",
        "Present the importance and utilization methods of big data analysis",
        
        // Business
        "Introduce business model composition and investment attraction methods for startups",
        "Prepare a presentation on digital marketing strategies and social media utilization",
        "Explain service design methodologies for improving customer experience (CX)",
        "Cover team management and productivity improvement in the remote work era",
        "Introduce ESG management importance and corporate sustainability strategies",
        
        // Education
        "Discuss effective design and operation of online education",
        "Explain methods for building immersive learning environments using metaverse",
        "Cover personalized learning systems and adaptive education technologies",
        "Present the necessity and practical plans for digital literacy education",
        
        // Environment/Society
        "Explain eco-friendly technologies and practices for sustainable environment",
        "Introduce types of renewable energy and efficient utilization methods",
        "Cover circular economy system construction and waste management innovation",
        "Explain the development direction of urban agriculture and smart farm technology",
        
        // Health/Lifestyle
        "Present exercise and nutrition management for a healthy lifestyle",
        "Introduce mental health management and stress relief methods",
        "Cover digital healthcare technology and personal health management tools",
        "Explain time management techniques for work-life balance",
        
        // Global/Culture
        "Cover internationalization strategies and cultural considerations for global market entry",
        "Present understanding of multicultural society and mutual respect culture creation",
        "Introduce K-culture's global expansion and cultural content industry prospects",
        
        // Future/Trends
        "Analyze future job trends and necessary competency development directions",
        "Cover challenges and opportunities in an aging society"
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
        slideType,
        slideCount,
        'mixed-auto' // 혼합 템플릿 사용
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
        themeFont,
        slideBorderStyle,
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
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {state.language === 'ko' ? '제미나이 API' : 'Gemini API'}
                </span>
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
              <>
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
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Input & Settings */}
        <ResizablePanel 
          defaultWidth={280} 
          minWidth={250} 
          maxWidth={350} 
          position="left"
          className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r p-4 overflow-y-auto transition-colors`}
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t.content}
                </label>
                <button
                  onClick={generateAIContentPrompt}
                  disabled={!state.geminiApiKey || state.isGenerating}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="프롬프트 예시를 생성합니다"
                >
                  {state.isGenerating ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <Lightbulb className="w-3 h-3" />
                  )}
                  프롬프트 예시
                </button>
              </div>
              <textarea
                value={state.content}
                onChange={(e) => setState(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t.contentPlaceholder}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <SlideTypeSelector
              selectedType={slideType}
              language={state.language}
              onTypeChange={handleSlideTypeChange}
              isDarkMode={isDarkMode}
            />

            <SlideCountSelector
              count={slideCount}
              onCountChange={setSlideCount}
              isDarkMode={isDarkMode}
            />

            <ThemeSelector
              selectedTheme={state.theme}
              onThemeChange={(theme) => setState(prev => ({ ...prev, theme }))}
              language={state.language}
              isDarkMode={isDarkMode}
            />

            <ThemeFontSelector
              currentFont={themeFont}
              onFontChange={setThemeFont}
              isDarkMode={isDarkMode}
            />

            <ThemeTemplateSelector
              currentTemplate={themeTemplate}
              onTemplateChange={setThemeTemplate}
              isDarkMode={isDarkMode}
            />

            <SlideBorderStyleSelector
              selectedStyle={slideBorderStyle}
              onStyleChange={setSlideBorderStyle}
              isDarkMode={isDarkMode}
            />

            <AspectRatioSelector
              selectedRatio={state.aspectRatio}
              onRatioChange={(aspectRatio) => setState(prev => ({ ...prev, aspectRatio }))}
              language={state.language}
              isDarkMode={isDarkMode}
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
    </div>
  );
}

export default App;