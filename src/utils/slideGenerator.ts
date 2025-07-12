import { Slide, Theme, AspectRatio, SlideElement } from '../types';
import { generateSlidesWithGemini, updateSlideWithGemini } from './geminiApi';
import { SlideType } from '../components/SlideTypeSelector';
import { ThemeFont } from '../components/ThemeFontSelector';
import { SlideBorderStyle } from '../components/SlideBorderStyleSelector';
import { getBackgroundForContent, createDefaultBackgroundOptions, generatePicsumImage } from './imageSearch';

// 간단한 마크다운 렌더러
const renderMarkdown = (text: string): string => {
  return text
    // 헤딩 처리
    .replace(/### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/# (.*?)$/gm, '<h1>$1</h1>')
    // 볼드 처리
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // 이탤릭 처리
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // 코드 처리
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // 링크 처리
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // 불릿 포인트 처리
    .replace(/^\* (.*?)$/gm, '<li>$1</li>')
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/^\+ (.*?)$/gm, '<li>$1</li>')
    // 번호 목록 처리
    .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
    // 줄바꿈 처리
    .replace(/\n/g, '<br>');
};

// 마크다운 목록을 <ul> 또는 <ol>로 래핑
const wrapLists = (html: string): string => {
  // 연속된 <li> 태그들을 <ul>로 래핑
  html = html.replace(/(<li>.*?<\/li>\s*)+/g, (match) => {
    const isNumbered = /^\d+\./.test(match);
    const tag = isNumbered ? 'ol' : 'ul';
    return `<${tag}>${match}</${tag}>`;
  });
  
  return html;
};

const SLIDE_LAYOUTS = [
  'title-center',
  'title-left',
  'title-top',
  'split-content',
  'title-bottom',
  'title-right'
];

// 기본 제목/내용 요소 생성 함수
const createDefaultElements = (
  title: string,
  content: string,
  layout: string,
  aspectRatio: AspectRatio,
  fontSizes: any,
  themeFont?: ThemeFont,
  theme?: Theme,
  backgroundImage?: string
): SlideElement[] => {
  const elements: SlideElement[] = [];
  const slideWidth = aspectRatio.width;
  const slideHeight = aspectRatio.height;
  
  // 레이아웃에 따른 기본 위치 계산
  const getLayoutPositions = () => {
    switch (layout) {
      case 'title-top-content-bottom':
        return {
          title: { x: slideWidth * 0.05, y: slideHeight * 0.1, width: slideWidth * 0.9, height: slideHeight * 0.3 },
          content: { x: slideWidth * 0.05, y: slideHeight * 0.45, width: slideWidth * 0.9, height: slideHeight * 0.45 }
        };
      case 'title-left-content-right':
        return {
          title: { x: slideWidth * 0.05, y: slideHeight * 0.2, width: slideWidth * 0.4, height: slideHeight * 0.6 },
          content: { x: slideWidth * 0.5, y: slideHeight * 0.2, width: slideWidth * 0.45, height: slideHeight * 0.6 }
        };
      case 'title-right-content-left':
        return {
          title: { x: slideWidth * 0.55, y: slideHeight * 0.2, width: slideWidth * 0.4, height: slideHeight * 0.6 },
          content: { x: slideWidth * 0.05, y: slideHeight * 0.2, width: slideWidth * 0.45, height: slideHeight * 0.6 }
        };
      case 'title-only':
        return {
          title: { x: slideWidth * 0.1, y: slideHeight * 0.3, width: slideWidth * 0.8, height: slideHeight * 0.4 },
          content: { x: 0, y: 0, width: 0, height: 0 }
        };
      case 'title-small-top-left':
        return {
          title: { x: slideWidth * 0.05, y: slideHeight * 0.05, width: slideWidth * 0.6, height: slideHeight * 0.2 },
          content: { x: slideWidth * 0.05, y: slideHeight * 0.3, width: slideWidth * 0.9, height: slideHeight * 0.65 }
        };
      case 'title-small-top-right':
        return {
          title: { x: slideWidth * 0.35, y: slideHeight * 0.05, width: slideWidth * 0.6, height: slideHeight * 0.2 },
          content: { x: slideWidth * 0.05, y: slideHeight * 0.3, width: slideWidth * 0.9, height: slideHeight * 0.65 }
        };
      default: // title-center
        return {
          title: { x: slideWidth * 0.1, y: slideHeight * 0.2, width: slideWidth * 0.8, height: slideHeight * 0.3 },
          content: { x: slideWidth * 0.1, y: slideHeight * 0.55, width: slideWidth * 0.8, height: slideHeight * 0.35 }
        };
    }
  };

  const positions = getLayoutPositions();
  
  // 폰트 스타일 가져오기
  const fontFamily = themeFont?.fontFamily || "'Segoe UI', system-ui, -apple-system, sans-serif";
  const fontWeight = themeFont?.effects.fontWeight || '600';
  
  // 제목 요소 생성
  if (title && positions.title.width > 0) {
    elements.push({
      id: 'default-title',
      type: 'text',
      content: title,
      x: positions.title.x,
      y: positions.title.y,
      width: positions.title.width,
      height: positions.title.height,
      fontSize: fontSizes.title * 16, // rem을 px로 변환
      fontFamily: fontFamily,
      color: backgroundImage ? '#FFFFFF' : (theme?.primary || '#000000'),
      fontWeight: fontWeight,
      textAlign: layout.includes('right') ? 'right' : layout.includes('left') ? 'left' : 'center',
      zIndex: 10,
      backgroundColor: 'transparent'
    });
  }

  // 내용 요소 생성
  if (content && positions.content.width > 0) {
    elements.push({
      id: 'default-content',
      type: 'text',
      content: content,
      x: positions.content.x,
      y: positions.content.y,
      width: positions.content.width,
      height: positions.content.height,
      fontSize: fontSizes.content * 16, // rem을 px로 변환
      fontFamily: fontFamily,
      color: backgroundImage ? '#F5F5F5' : (theme?.secondary || '#333333'),
      fontWeight: '400',
      textAlign: layout.includes('right') ? 'right' : layout.includes('left') ? 'left' : 'center',
      zIndex: 9,
      backgroundColor: 'transparent'
    });
  }

  return elements;
};

export const generateSlides = async (
  content: string,
  theme: Theme,
  aspectRatio: AspectRatio,
  apiKey: string,
  language: 'ko' | 'en',
  slideType: SlideType = 'ppt',
  slideCount = 5,
  templateStyle?: string
): Promise<Slide[]> => {
  try {
    const slideData = await generateSlidesWithGemini(content, apiKey, language, slideType, slideCount);
    
    const slides: Slide[] = slideData.map((slide, index) => {
      const layout = getLayoutForSlideType(slideType, index, templateStyle);
      const backgroundOptions = createDefaultBackgroundOptions(slide.content);
      const backgroundImage = generatePicsumImage(
        aspectRatio.width,
        aspectRatio.height,
        backgroundOptions.seed,
        backgroundOptions.blur,
        backgroundOptions.grayscale
      );
      
      const htmlContent = generateSlideHTML(
        slide.title, 
        slide.content, 
        theme, 
        aspectRatio, 
        index,
        undefined, // themeFont
        undefined, // borderStyle
        layout,
        backgroundImage,
        backgroundOptions.blur,
        0.3, // 기본 오버레이
        undefined, // backgroundColor
        undefined, // backgroundPattern
        undefined, // elements
        slideType
      );
      
      return {
        id: `slide-${Date.now()}-${index}`,
        title: slide.title,
        content: slide.content,
        htmlContent,
        order: index,
        template: layout,
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
    });

    return slides;
  } catch (error) {
    console.error('Error generating slides with Gemini:', error);
    // Fallback to simple parsing if API fails
    return generateSlidesSimple(content, theme, aspectRatio, slideType, templateStyle);
  }
};

const getLayoutForSlideType = (slideType: SlideType, index: number, templateStyle?: string): string => {
  // 템플릿 스타일이 지정된 경우
  if (templateStyle && templateStyle !== 'mixed-auto') {
    switch (templateStyle) {
      case 'presentation-formal':
        return 'title-top-content-bottom';
      case 'side-by-side':
        return 'title-left-content-right';
      case 'title-focus':
        return 'title-only';
      default:
        return 'title-top-content-bottom';
    }
  }

  // 자동 혼합 모드이거나 템플릿이 지정되지 않은 경우
  switch (slideType) {
    case 'cardnews':
      return 'title-center'; 
    case 'imagecard':
      return 'title-center';
    case 'ppt':
    default:
      // 첫 번째 슬라이드는 제목 중심
      if (index === 0) {
        return 'title-only';
      }
      // 이후 슬라이드는 다양한 레이아웃을 순환
      return SLIDE_LAYOUTS[(index - 1) % SLIDE_LAYOUTS.length];
  }
};

const generateSlidesSimple = (
  content: string,
  theme: Theme,
  aspectRatio: AspectRatio,
  slideType: SlideType,
  templateStyle?: string
): Slide[] => {
  // 섹션 분할
  const sections = content.split(/\n\s*\n/).filter(section => section.trim());
  
  // 자르기
  const slides: Slide[] = [];
  
  sections.forEach((section, sectionIndex) => {
    const lines = section.split('\n').filter(line => line.trim());
    const wordsCount = section.split(' ').length;
    
    // 살라이드 타입
    const maxWords = slideType === 'cardnews' ? 30 : slideType === 'imagecard' ? 50 : 100;
    
    // 너무 길 때 자르기
    if (wordsCount > maxWords) {
      const sentences = section.split(/[.!?]+/).filter(s => s.trim());
      let currentSlideContent = '';
      let slideCount = 0;
      
      sentences.forEach((sentence, sentenceIndex) => {
        const maxWordsPerSlide = slideType === 'cardnews' ? 20 : slideType === 'imagecard' ? 40 : 80;
        
        if (currentSlideContent.split(' ').length + sentence.split(' ').length > maxWordsPerSlide) {
          // 슬라이드 만들기
          const title = lines[0] || `${sectionIndex + 1}.${slideCount + 1} 주요 내용`;
          const layout = getLayoutForSlideType(slideType, slides.length, templateStyle);
          const backgroundImage = getBackgroundForContent(currentSlideContent);
          const htmlContent = generateSlideHTML(title, currentSlideContent.trim(), theme, aspectRatio, slides.length, undefined, undefined, layout, backgroundImage, 2, 0.3, undefined, undefined, undefined, slideType);
          
          slides.push({
            id: `slide-${Date.now()}-${slides.length}`,
            title,
            content: currentSlideContent.trim(),
            htmlContent,
            order: slides.length,
            template: layout,
            backgroundImage,
            backgroundBlur: 2,
            themeOverlay: 0.3,
            elements: [],
            history: [],
            historyIndex: 0,
          });
          
          currentSlideContent = sentence.trim() + '.';
          slideCount++;
        } else {
          currentSlideContent += (currentSlideContent ? ' ' : '') + sentence.trim() + '.';
        }
      });
      
      // 마지막 슬라이드 처리
      if (currentSlideContent.trim()) {
        const title = lines[0] || `${sectionIndex + 1}.${slideCount + 1} 주요 내용`;
        const layout = getLayoutForSlideType(slideType, slides.length, templateStyle);
        const backgroundImage = getBackgroundForContent(currentSlideContent);
        const htmlContent = generateSlideHTML(title, currentSlideContent.trim(), theme, aspectRatio, slides.length, undefined, undefined, layout, backgroundImage, 2, 0.3, undefined, undefined, undefined, slideType);
        
        slides.push({
          id: `slide-${Date.now()}-${slides.length}`,
          title,
          content: currentSlideContent.trim(),
          htmlContent,
          order: slides.length,
          template: layout,
          backgroundImage,
          backgroundBlur: 2,
          themeOverlay: 0.3,
          elements: [],
          history: [],
          historyIndex: 0,
        });
      }
    } else {
      // 일반적인 슬라이드 생성
      const title = lines[0] || `슬라이드 ${slides.length + 1}`;
      const slideContent = lines.slice(1).join('\n') || section;
      const layout = getLayoutForSlideType(slideType, slides.length, templateStyle);
      const backgroundImage = getBackgroundForContent(slideContent);
      const htmlContent = generateSlideHTML(title, slideContent, theme, aspectRatio, slides.length, undefined, undefined, layout, backgroundImage, 2, 0.3, undefined, undefined, undefined, slideType);
      
      slides.push({
        id: `slide-${Date.now()}-${slides.length}`,
        title,
        content: slideContent,
        htmlContent,
        order: slides.length,
        template: layout,
        backgroundImage,
        backgroundBlur: 2,
        themeOverlay: 0.3,
        elements: [],
        history: [],
        historyIndex: 0,
      });
    }
  });

  return slides.length > 0 ? slides : [{
    id: `slide-${Date.now()}-0`,
    title: '기본 슬라이드',
    content: content,
    htmlContent: generateSlideHTML('기본 슬라이드', content, theme, aspectRatio, 0, undefined, undefined, 'title-center', getBackgroundForContent(content), 2, 0.3, undefined, undefined, undefined, slideType),
    order: 0,
    template: 'title-center',
    backgroundImage: getBackgroundForContent(content),
    backgroundBlur: 2,
    themeOverlay: 0.3,
    elements: [],
    history: [],
    historyIndex: 0,
  }];
};

export const generateSlideHTML = (
  title: string,
  content: string,
  theme: Theme,
  aspectRatio: AspectRatio,
  slideIndex: number,
  themeFont?: ThemeFont,
  borderStyle?: SlideBorderStyle,
  layout = 'title-center',
  backgroundImage?: string,
  backgroundBlur = 2,
  themeOverlay = 0.3,
  backgroundColor?: string,
  backgroundPattern?: string,
  elements?: SlideElement[],
  slideType?: string
): string => {
  // 슬라이드 타입과 화면 비율에 따른 동적 폰트 크기 계산
  const getResponsiveFontSizes = () => {
    const baseWidth = 1200; // 기준 너비
    const currentWidth = aspectRatio.width;
    const scaleFactor = Math.min(currentWidth / baseWidth, 1.5); // 최대 1.5배까지만 확대
    
    // 슬라이드 타입별 기본 크기 조정
    let titleMultiplier = 3.2;
    let contentMultiplier = 1.3;
    
    switch (slideType) {
      case 'cardnews':
        // 카드뉴스: 큰 제목, 중간 내용
        titleMultiplier = 4.0;
        contentMultiplier = 1.6;
        break;
      case 'imagecard':
        // 이미지카드: 매우 큰 제목, 작은 내용
        titleMultiplier = 5.0;
        contentMultiplier = 1.2;
        break;
      case 'ppt':
      default:
        // PPT: 표준 크기
        titleMultiplier = 3.2;
        contentMultiplier = 1.3;
        break;
    }
    
    return {
      title: Math.max(2.2, titleMultiplier * scaleFactor),
      subtitle: Math.max(1.2, 1.6 * scaleFactor),
      content: Math.max(1.0, contentMultiplier * scaleFactor),
      bullet: Math.max(0.95, 1.1 * scaleFactor),
    };
  };

  const fontSizes = getResponsiveFontSizes();
  
  // 기본 제목/내용 요소를 생성하고 기존 요소와 병합
  const defaultElements = createDefaultElements(title, content, layout, aspectRatio, fontSizes, themeFont, theme, backgroundImage);
  const allElements = elements ? [...defaultElements, ...elements] : defaultElements;

  const getLayoutStyles = () => {
    switch (layout) {
      case 'title-top-content-bottom':
        return {
          container: 'justify-center items-center',
          titlePosition: 'text-center',
          contentPosition: 'text-center',
          flexDirection: 'flex-col',
          titleWidth: '100%',
          contentWidth: '100%',
          gap: '2rem',
          padding: '2rem',
          titleSize: fontSizes.title,
          contentSize: fontSizes.content
        };
      case 'title-left-content-right':
        return {
          container: 'justify-center items-center',
          titlePosition: 'text-left',
          contentPosition: 'text-left',
          flexDirection: 'flex-row',
          titleWidth: '45%',
          contentWidth: '50%',
          gap: '5%',
          padding: '2rem',
          titleSize: fontSizes.title,
          contentSize: fontSizes.content
        };
      case 'title-right-content-left':
        return {
          container: 'justify-center items-center',
          titlePosition: 'text-right',
          contentPosition: 'text-left',
          flexDirection: 'flex-row-reverse',
          titleWidth: '45%',
          contentWidth: '50%',
          gap: '5%',
          padding: '2rem',
          titleSize: fontSizes.title,
          contentSize: fontSizes.content
        };
      case 'title-only':
        return {
          container: 'justify-center items-center',
          titlePosition: 'text-center',
          contentPosition: 'text-center',
          flexDirection: 'flex-col',
          titleWidth: '100%',
          contentWidth: '0%',
          gap: '0',
          padding: '2rem',
          titleSize: fontSizes.title * 1.3,
          contentSize: 0
        };
      case 'title-small-top-left':
        return {
          container: 'justify-start items-start',
          titlePosition: 'text-left',
          contentPosition: 'text-left',
          flexDirection: 'flex-col',
          titleWidth: '100%',
          contentWidth: '100%',
          gap: '1.5rem',
          padding: '2rem',
          titleSize: fontSizes.title * 0.6,
          contentSize: fontSizes.content * 1.2
        };
      case 'title-small-top-right':
        return {
          container: 'justify-start items-end',
          titlePosition: 'text-right',
          contentPosition: 'text-left',
          flexDirection: 'flex-col',
          titleWidth: '100%',
          contentWidth: '100%',
          gap: '1.5rem',
          padding: '2rem',
          titleSize: fontSizes.title * 0.6,
          contentSize: fontSizes.content * 1.2
        };
      case 'title-left':
        return {
          container: 'justify-center items-center',
          titlePosition: 'text-left',
          contentPosition: 'text-left',
          flexDirection: 'flex-row',
          titleWidth: '40%',
          contentWidth: '55%',
          gap: '5%',
          padding: '2rem',
          titleSize: fontSizes.title,
          contentSize: fontSizes.content
        };
      case 'title-right':
        return {
          container: 'justify-center items-center',
          titlePosition: 'text-right',
          contentPosition: 'text-left',
          flexDirection: 'flex-row-reverse',
          titleWidth: '40%',
          contentWidth: '55%',
          gap: '5%',
          padding: '2rem',
          titleSize: fontSizes.title,
          contentSize: fontSizes.content
        };
      case 'title-top':
        return {
          container: 'justify-start items-center',
          titlePosition: 'text-center',
          contentPosition: 'text-center',
          flexDirection: 'flex-col',
          titleWidth: '100%',
          contentWidth: '100%',
          gap: '1.5rem',
          padding: '2.5rem 2rem',
          titleSize: fontSizes.title,
          contentSize: fontSizes.content
        };
      case 'title-bottom':
        return {
          container: 'justify-end items-center',
          titlePosition: 'text-center',
          contentPosition: 'text-center',
          flexDirection: 'flex-col-reverse',
          titleWidth: '100%',
          contentWidth: '100%',
          gap: '1.5rem',
          padding: '2.5rem 2rem',
          titleSize: fontSizes.title,
          contentSize: fontSizes.content
        };
      case 'split-content':
        return {
          container: 'justify-center items-center',
          titlePosition: 'text-center',
          contentPosition: 'text-left',
          flexDirection: 'flex-row',
          titleWidth: '45%',
          contentWidth: '45%',
          gap: '10%',
          padding: '2rem',
          titleSize: fontSizes.title,
          contentSize: fontSizes.content
        };
      default: // title-center
        return {
          container: 'justify-center items-center',
          titlePosition: 'text-center',
          contentPosition: 'text-center',
          flexDirection: 'flex-col',
          titleWidth: '100%',
          contentWidth: '100%',
          gap: '1.8rem',
          padding: '2.5rem',
          titleSize: fontSizes.title,
          contentSize: fontSizes.content
        };
    }
  };

  const layoutStyles = getLayoutStyles();
  
  // 마크다운 렌더링은 이제 개별 요소에서 처리됨
  
  // 폰트 스타일 적용
  const getFontStyles = () => {
    if (!themeFont) {return {
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      textShadow: 'none',
      letterSpacing: 'normal',
      fontWeight: '400'
    };}
    
    return {
      fontFamily: themeFont.fontFamily,
      textShadow: themeFont.effects.textShadow || 'none',
      letterSpacing: themeFont.effects.letterSpacing || 'normal',
      fontWeight: themeFont.effects.fontWeight || '400'
    };
  };

  const fontStyles = getFontStyles();

  // 테두리 스타일 적용
  const getBorderStyles = () => {
    if (!borderStyle) {return {
      border: `2px solid ${theme.primary}30`,
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    };}
    
    return {
      border: `${borderStyle.borderWidth}px ${borderStyle.borderStyle} ${theme.primary}60`,
      borderRadius: `${borderStyle.borderRadius}px`,
      boxShadow: borderStyle.boxShadow
    };
  };

  const borderStyles = getBorderStyles();

  // 패턴 스타일 생성 함수
  const getPatternStyle = (pattern: string) => {
    switch (pattern) {
      case 'grid-small':
        return `background-image: 
          linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 20px 20px;`;
      case 'grid-large':
        return `background-image: 
          linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 50px 50px;`;
      case 'grid-xlarge':
        return `background-image: 
          linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 100px 100px;`;
      case 'lines-horizontal':
        return `background-image: linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 100% 30px;`;
      case 'lines-vertical':
        return `background-image: linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 30px 100%;`;
      case 'wave-large':
        return `background-image: radial-gradient(ellipse at center, rgba(0,0,0,0.1) 20%, transparent 50%);
          background-size: 100px 50px;`;
      case 'wave-small':
        return `background-image: radial-gradient(ellipse at center, rgba(0,0,0,0.08) 15%, transparent 35%);
          background-size: 40px 20px;`;
      case 'circle-fractal':
        return `background-image: 
          radial-gradient(circle at 25% 25%, rgba(0,0,0,0.1) 2px, transparent 2px),
          radial-gradient(circle at 75% 75%, rgba(0,0,0,0.1) 2px, transparent 2px);
          background-size: 30px 30px;`;
      case 'glassmorphic':
        return `backdrop-filter: blur(10px);
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);`;
      case 'mosaic':
        return `background-image: 
          linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%);
          background-size: 20px 20px;
          background-position: 0 0, 10px 10px;`;
      case 'digital-mosaic':
        return `background-image: 
          linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px),
          linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 8px 8px;`;
      case 'water-drops':
        return `background-image: 
          radial-gradient(circle at 20% 20%, rgba(0,0,0,0.1) 2px, transparent 5px),
          radial-gradient(circle at 80% 60%, rgba(0,0,0,0.08) 3px, transparent 6px),
          radial-gradient(circle at 60% 80%, rgba(0,0,0,0.06) 1px, transparent 4px);
          background-size: 60px 60px, 80px 80px, 40px 40px;`;
      case 'rainbow':
        return `background-image: 
          linear-gradient(45deg, 
            rgba(255,0,0,0.1) 0%, 
            rgba(255,255,0,0.1) 17%, 
            rgba(0,255,0,0.1) 33%, 
            rgba(0,255,255,0.1) 50%, 
            rgba(0,0,255,0.1) 67%, 
            rgba(255,0,255,0.1) 83%, 
            rgba(255,0,0,0.1) 100%);
          background-size: 200px 200px;`;
      case 'gaussian-blur':
        return `filter: blur(2px); opacity: 0.9;`;
      case 'motion-blur-horizontal':
        return `filter: blur(1px); transform: scaleX(1.02);`;
      case 'motion-blur-vertical':
        return `filter: blur(1px); transform: scaleY(1.02);`;
      case 'zigzag':
        return `background-image: 
          linear-gradient(45deg, rgba(0,0,0,0.1) 12.5%, transparent 12.5%, transparent 37.5%, rgba(0,0,0,0.1) 37.5%, rgba(0,0,0,0.1) 62.5%, transparent 62.5%, transparent 87.5%, rgba(0,0,0,0.1) 87.5%);
          background-size: 30px 30px;`;
      case 'fisheye':
        return `transform: perspective(500px) rotateX(5deg); filter: brightness(1.1);`;
      case 'wide-angle':
        return `transform: perspective(1000px) rotateY(2deg) rotateX(1deg); filter: contrast(1.1);`;
      default:
        return '';
    }
  };

  // 배경 스타일 생성 함수
  const getBackgroundStyle = () => {
    let baseBackground = '';
    
    if (backgroundColor) {
      // 컬러 배경 사용
      baseBackground = `background: ${backgroundColor};`;
    } else if (backgroundImage) {
      // 이미지 배경 사용
      const themeHex = theme.primary.replace('#', '');
      const r = parseInt(themeHex.substr(0, 2), 16);
      const g = parseInt(themeHex.substr(2, 2), 16);
      const b = parseInt(themeHex.substr(4, 2), 16);
      const themeRgba = `rgba(${r}, ${g}, ${b}, ${themeOverlay})`;
      
      baseBackground = `background: linear-gradient(${themeRgba}, ${themeRgba}), url('${backgroundImage}') center/cover;`;
    } else {
      // 기본 그라데이션 배경
      baseBackground = `background: linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15);`;
    }

    // 패턴 오버레이 추가 (배경 관련 패턴만)
    if (backgroundPattern && backgroundPattern !== 'none') {
      const patternStyle = getPatternStyle(backgroundPattern);
      // transform/filter 기반 패턴은 컨테이너에 적용되므로 여기서는 background 관련만 적용
      if (!patternStyle.includes('transform:') && !patternStyle.includes('filter:')) {
        return `${baseBackground} ${patternStyle}`;
      }
    }
    
    return baseBackground;
  };

  // 컨테이너 변형 효과 생성 함수
  const getContainerTransform = () => {
    if (backgroundPattern && backgroundPattern !== 'none') {
      const patternStyle = getPatternStyle(backgroundPattern);
      if (patternStyle.includes('transform:') || patternStyle.includes('filter:')) {
        return patternStyle;
      }
    }
    return '';
  };
  
  return `
    <div class="slide-container" style="
      width: 100%;
      aspect-ratio: ${aspectRatio.width}/${aspectRatio.height};
      border: ${borderStyles.border};
      border-radius: ${borderStyles.borderRadius};
      padding: ${layoutStyles.padding};
      display: flex;
      flex-direction: column;
      ${layoutStyles.container};
      position: relative;
      overflow: hidden;
      font-family: ${fontStyles.fontFamily};
      box-shadow: ${borderStyles.boxShadow};
      min-height: 400px;
      ${getContainerTransform()}
    ">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        ${getBackgroundStyle()}
        filter: blur(${backgroundBlur}px);
        z-index: 0;
      "></div>
      
      
      ${allElements && allElements.length > 0 ? allElements.map(element => `
        <div style="
          position: absolute;
          left: ${element.x}px;
          top: ${element.y}px;
          width: ${element.width}px;
          height: ${element.height}px;
          transform: rotate(${element.rotation || 0}deg);
          z-index: ${element.zIndex || 1};
          background-color: ${element.backgroundColor || 'transparent'};
          border: ${element.borderWidth || 0}px solid ${element.borderColor || 'transparent'};
        ">
          ${element.type === 'text' ? `
            <div style="
              width: 100%;
              height: 100%;
              font-size: ${element.fontSize}px;
              font-family: ${element.fontFamily};
              color: ${element.color};
              font-weight: ${element.fontWeight};
              text-align: ${element.textAlign};
              line-height: 1.4;
              padding: 8px;
              display: flex;
              align-items: center;
              justify-content: ${element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start'};
              word-break: break-word;
              white-space: pre-wrap;
              text-shadow: ${backgroundImage ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'};
            ">
              ${wrapLists(renderMarkdown(element.content || ''))}
            </div>
          ` : element.type === 'image' && element.content ? `
            <img 
              src="${element.content}" 
              alt="Slide element" 
              style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 4px;
              "
            />
          ` : ''}
        </div>
      `).join('') : ''}
    </div>
  `;
};

export const updateSlideContent = async (
  slide: Slide,
  updateRequest: string,
  theme: Theme,
  aspectRatio: AspectRatio,
  apiKey: string,
  language: 'ko' | 'en'
): Promise<Slide> => {
  try {
    const updatedSlide = await updateSlideWithGemini(
      slide.title,
      slide.content,
      updateRequest,
      apiKey,
      language
    );

    const layout = SLIDE_LAYOUTS[slide.order % SLIDE_LAYOUTS.length];

    return {
      ...slide,
      title: updatedSlide.title,
      content: updatedSlide.content,
      htmlContent: generateSlideHTML(
        updatedSlide.title, 
        updatedSlide.content, 
        theme, 
        aspectRatio, 
        slide.order,
        undefined, // themeFont
        undefined, // borderStyle
        layout,
        slide.backgroundImage,
        slide.backgroundBlur || 2,
        slide.themeOverlay || 0.3,
        undefined, // backgroundColor
        undefined, // backgroundPattern
        undefined, // elements
        'ppt' // 기본값
      ),
    };
  } catch (error) {
    console.error('Error updating slide with Gemini:', error);
    // Fallback to simple update
    const lines = updateRequest.split('\n').filter(line => line.trim());
    const title = lines[0] || slide.title;
    const content = lines.slice(1).join('\n') || updateRequest;
    const layout = SLIDE_LAYOUTS[slide.order % SLIDE_LAYOUTS.length];

    return {
      ...slide,
      title,
      content,
      htmlContent: generateSlideHTML(
        title, 
        content, 
        theme, 
        aspectRatio, 
        slide.order, 
        undefined, // themeFont
        undefined, // borderStyle
        layout, 
        slide.backgroundImage,
        slide.backgroundBlur || 2,
        slide.themeOverlay || 0.3,
        undefined, // backgroundColor
        undefined, // backgroundPattern
        undefined, // elements
        'ppt' // 기본값
      ),
    };
  }
};