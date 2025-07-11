import { Slide, Theme, AspectRatio } from '../types';
import { generateSlidesWithGemini, updateSlideWithGemini } from './geminiApi';
import { SlideType } from '../components/SlideTypeSelector';
import { getBackgroundForContent, createDefaultBackgroundOptions, generatePicsumImage } from './imageSearch';

const SLIDE_LAYOUTS = [
  'title-center',
  'title-left',
  'title-top',
  'split-content',
  'title-bottom',
  'title-right'
];

export const generateSlides = async (
  content: string,
  theme: Theme,
  aspectRatio: AspectRatio,
  apiKey: string,
  language: 'ko' | 'en',
  slideType: SlideType = 'ppt'
): Promise<Slide[]> => {
  try {
    const slideData = await generateSlidesWithGemini(content, apiKey, language, slideType);
    
    const slides: Slide[] = slideData.map((slide, index) => {
      const layout = getLayoutForSlideType(slideType, index);
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
        slide.subtitle,
        slide.bulletPoints,
        layout,
        backgroundImage,
        backgroundOptions.blur,
        0.3 // 기본 오버레이
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
    return generateSlidesSimple(content, theme, aspectRatio, slideType);
  }
};

const getLayoutForSlideType = (slideType: SlideType, index: number): string => {
  switch (slideType) {
    case 'cardnews':
      return 'title-center'; 
    case 'imagecard':
      return 'title-center';
    case 'ppt':
    default:
      return SLIDE_LAYOUTS[index % SLIDE_LAYOUTS.length]; // PPT 다양한 레이아웃
  }
};

const generateSlidesSimple = (
  content: string,
  theme: Theme,
  aspectRatio: AspectRatio,
  slideType: SlideType
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
          const layout = getLayoutForSlideType(slideType, slides.length);
          const backgroundImage = getBackgroundForContent(currentSlideContent);
          const htmlContent = generateSlideHTML(title, currentSlideContent.trim(), theme, aspectRatio, slides.length, undefined, undefined, layout, backgroundImage, 2, 0.3);
          
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
        const layout = getLayoutForSlideType(slideType, slides.length);
        const backgroundImage = getBackgroundForContent(currentSlideContent);
        const htmlContent = generateSlideHTML(title, currentSlideContent.trim(), theme, aspectRatio, slides.length, undefined, undefined, layout, backgroundImage, 2, 0.3);
        
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
      const layout = getLayoutForSlideType(slideType, slides.length);
      const backgroundImage = getBackgroundForContent(slideContent);
      const htmlContent = generateSlideHTML(title, slideContent, theme, aspectRatio, slides.length, undefined, undefined, layout, backgroundImage, 2, 0.3);
      
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
    htmlContent: generateSlideHTML('기본 슬라이드', content, theme, aspectRatio, 0, undefined, undefined, 'title-center', getBackgroundForContent(content), 2, 0.3),
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
  subtitle?: string,
  bulletPoints?: string[],
  layout: string = 'title-center',
  backgroundImage?: string,
  backgroundBlur: number = 2,
  themeOverlay: number = 0.3
): string => {
  // 화면 비율에 따른 동적 폰트 크기 계산
  const getResponsiveFontSizes = () => {
    const baseWidth = 1200; // 기준 너비
    const currentWidth = aspectRatio.width;
    const scaleFactor = Math.min(currentWidth / baseWidth, 1.5); // 최대 1.5배까지만 확대
    
    return {
      title: Math.max(2.2, 3.2 * scaleFactor), // 최소 2.2rem
      subtitle: Math.max(1.2, 1.6 * scaleFactor), // 최소 1.2rem
      content: Math.max(1.0, 1.3 * scaleFactor), // 최소 1.0rem
      bullet: Math.max(0.95, 1.1 * scaleFactor), // 최소 0.95rem
    };
  };

  const fontSizes = getResponsiveFontSizes();

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
  
  // 배경 이미지가 있을 때 테마 색상과 흐림 효과 적용
  const getBackgroundStyle = () => {
    if (backgroundImage) {
      const themeHex = theme.primary.replace('#', '');
      const r = parseInt(themeHex.substr(0, 2), 16);
      const g = parseInt(themeHex.substr(2, 2), 16);
      const b = parseInt(themeHex.substr(4, 2), 16);
      const themeRgba = `rgba(${r}, ${g}, ${b}, ${themeOverlay})`;
      
      return `
        background: linear-gradient(${themeRgba}, ${themeRgba}), url('${backgroundImage}') center/cover;
      `;
    }
    return `background: linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15);`;
  };
  
  return `
    <div class="slide-container" style="
      width: 100%;
      aspect-ratio: ${aspectRatio.width}/${aspectRatio.height};
      border: 2px solid ${theme.primary}30;
      border-radius: 16px;
      padding: ${layoutStyles.padding};
      display: flex;
      flex-direction: column;
      ${layoutStyles.container};
      position: relative;
      overflow: hidden;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      min-height: 400px;
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
      
      <div style="
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 95%;
        display: flex;
        flex-direction: ${layoutStyles.flexDirection};
        gap: ${layoutStyles.gap};
        align-items: center;
        height: 100%;
      ">
        <div style="
          width: ${layoutStyles.titleWidth};
          ${layoutStyles.titlePosition};
        ">
          <h1 style="
            font-size: ${layoutStyles.titleSize}rem;
            font-weight: 800;
            color: ${backgroundImage ? '#FFFFFF' : theme.primary};
            margin-bottom: ${subtitle ? '0.6rem' : '0'};
            text-shadow: ${backgroundImage ? '2px 2px 4px rgba(0,0,0,0.8)' : '0 2px 8px rgba(0,0,0,0.15)'};
            line-height: 1.2;
            letter-spacing: -0.02em;
            word-break: keep-all;
            overflow-wrap: break-word;
          ">${title}</h1>
          
          ${subtitle ? `
            <h2 style="
              font-size: ${fontSizes.subtitle}rem;
              font-weight: 600;
              color: ${backgroundImage ? '#F0F0F0' : theme.secondary};
              margin-bottom: 0;
              opacity: 0.9;
              line-height: 1.3;
              text-shadow: ${backgroundImage ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'};
              word-break: keep-all;
            ">${subtitle}</h2>
          ` : ''}
        </div>
        
        ${layoutStyles.contentWidth !== '0%' ? `
        <div style="
          width: ${layoutStyles.contentWidth};
          ${layoutStyles.contentPosition};
          display: flex;
          flex-direction: column;
          gap: 1rem;
        ">
          ${content ? `
            <div style="
              font-size: ${layoutStyles.contentSize}rem;
              line-height: 1.6;
              color: ${backgroundImage ? '#F5F5F5' : theme.secondary};
              font-weight: 400;
              margin-bottom: ${bulletPoints && bulletPoints.length > 0 ? '0.8rem' : '0'};
              text-shadow: ${backgroundImage ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'};
              word-break: keep-all;
              overflow-wrap: break-word;
            ">
              ${content.split('\n').map(line => 
                line.trim() ? `<p style="margin-bottom: 0.6rem; margin-top: 0;">${line}</p>` : ''
              ).join('')}
            </div>
          ` : ''}
          
          ${bulletPoints && bulletPoints.length > 0 ? `
            <ul style="
              list-style: none;
              padding: 0;
              margin: 0;
              display: flex;
              flex-direction: column;
              gap: 0.6rem;
            ">
              ${bulletPoints.map(bullet => `
                <li style="
                  display: flex;
                  align-items: flex-start;
                  gap: 0.6rem;
                  font-size: ${fontSizes.bullet}rem;
                  line-height: 1.5;
                  color: ${backgroundImage ? '#F0F0F0' : theme.secondary};
                  font-weight: 500;
                  text-shadow: ${backgroundImage ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none'};
                  word-break: keep-all;
                ">
                  <span style="
                    width: 6px;
                    height: 6px;
                    background: ${theme.accent};
                    border-radius: 50%;
                    margin-top: 0.5rem;
                    flex-shrink: 0;
                    box-shadow: ${backgroundImage ? '0 0 4px rgba(0,0,0,0.5)' : 'none'};
                  "></span>
                  <span>${bullet}</span>
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </div>
        ` : ''}
      </div>
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
        updatedSlide.subtitle,
        updatedSlide.bulletPoints,
        layout,
        slide.backgroundImage,
        slide.backgroundBlur || 2,
        slide.themeOverlay || 0.3
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
        undefined, 
        undefined, 
        layout, 
        slide.backgroundImage,
        slide.backgroundBlur || 2,
        slide.themeOverlay || 0.3
      ),
    };
  }
};