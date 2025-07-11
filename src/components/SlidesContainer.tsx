import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Slide, Theme, AspectRatio, SlideElement } from '../types';
import { SlidePreview } from './SlidePreview';
import { BackgroundController } from './BackgroundController';
import { SlideTemplateSelector, SlideLayoutType } from './SlideTemplateSelector';
import { SlideOrderController } from './SlideOrderController';
import { TRANSLATIONS, FONT_FAMILIES, ANIMATION_EFFECTS } from '../constants';
import { generateSlideHTML } from '../utils/slideGenerator';
import { generatePicsumImage } from '../utils/imageSearch';
import { 
  Plus, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Trash2,
  Save,
  Check,
  Image as ImageIcon,
  Upload,
  Download,
  RotateCw,
  Move,
  Square,
  Palette
} from 'lucide-react';

// 간단한 마크다운 렌더러 (미리보기용)
const renderMarkdownPreview = (text: string): string => {
  return text
    // 헤딩 처리
    .replace(/### (.*?)$/gm, '<span style="font-size: 1.2em; font-weight: bold;">$1</span>')
    .replace(/## (.*?)$/gm, '<span style="font-size: 1.4em; font-weight: bold;">$1</span>')
    .replace(/# (.*?)$/gm, '<span style="font-size: 1.6em; font-weight: bold;">$1</span>')
    // 볼드 처리
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // 이탤릭 처리
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // 코드 처리
    .replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>')
    // 불릿 포인트 처리
    .replace(/^\* (.*?)$/gm, '• $1')
    .replace(/^- (.*?)$/gm, '• $1')
    .replace(/^\+ (.*?)$/gm, '• $1')
    // 번호 목록 처리 (간단히)
    .replace(/^\d+\. (.*?)$/gm, '$1');
};

interface SlidesContainerProps {
  slides: Slide[];
  activeSlideId: string | null;
  activeTab: 'preview' | 'code';
  language: 'ko' | 'en';
  theme: Theme;
  aspectRatio: AspectRatio;
  themeFont?: any;
  slideBorderStyle?: any;
  isDarkMode?: boolean;
  onTabChange: (tab: 'preview' | 'code') => void;
  onSlideSelect: (slideId: string) => void;
  onSlideDelete: (slideId: string) => void;
  onAddSlide: (afterIndex?: number) => void;
  onSlideUpdate: (slide: Slide) => void;
  onSlideMove: (fromIndex: number, toIndex: number) => void;
}

export const SlidesContainer: React.FC<SlidesContainerProps> = ({
  slides,
  activeSlideId,
  activeTab,
  language,
  theme,
  aspectRatio,
  themeFont,
  slideBorderStyle,
  isDarkMode = false,
  onTabChange,
  onSlideSelect,
  onSlideDelete,
  onAddSlide,
  onSlideUpdate,
  onSlideMove,
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | undefined>();
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tempSlide, setTempSlide] = useState<Slide | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[language];

  // 슬라이드 선택 시 임시 슬라이드 설정
  useEffect(() => {
    if (activeSlideId) {
      const slide = slides.find(s => s.id === activeSlideId);
      if (slide) {
        setTempSlide({ ...slide });
        setHasUnsavedChanges(false);
      }
    } else {
      setTempSlide(null);
      setSelectedElementId(undefined);
      setEditingElement(null);
    }
  }, [activeSlideId, slides]);

  // 실시간 HTML 업데이트 - 편집 시 즉시 반영
  useEffect(() => {
    if (!tempSlide) return;

    // tempSlide가 변경될 때마다 즉시 HTML 업데이트
    const finalBackgroundImage = tempSlide.backgroundSeed 
      ? generatePicsumImage(
          aspectRatio.width,
          aspectRatio.height,
          tempSlide.backgroundSeed,
          tempSlide.backgroundBlur || 2,
          tempSlide.backgroundGrayscale || false
        )
      : tempSlide.backgroundImage;

    const updatedHtmlContent = generateSlideHTML(
      tempSlide.title,
      tempSlide.content,
      theme,
      aspectRatio,
      tempSlide.order,
      themeFont,
      slideBorderStyle,
      tempSlide.slideLayout || tempSlide.template || 'title-top-content-bottom',
      finalBackgroundImage,
      tempSlide.backgroundBlur || 2,
      tempSlide.themeOverlay || 0.3
    );

    // tempSlide의 htmlContent를 즉시 업데이트
    setTempSlide(prev => prev ? {
      ...prev,
      backgroundImage: finalBackgroundImage,
      htmlContent: updatedHtmlContent,
    } : null);

  }, [tempSlide?.title, tempSlide?.content, tempSlide?.backgroundSeed, tempSlide?.backgroundBlur, tempSlide?.backgroundGrayscale, tempSlide?.slideLayout, theme, aspectRatio, themeFont, slideBorderStyle]);

  // 자동 저장 - 변경사항을 실제 슬라이드에 저장
  useEffect(() => {
    if (!tempSlide || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      const updatedSlide = {
        ...tempSlide,
        elements: tempSlide.elements || [],
      };
      
      onSlideUpdate(updatedSlide);
      setHasUnsavedChanges(false);
    }, 300); // 300ms 디바운스로 단축

    return () => clearTimeout(timer);
  }, [tempSlide, hasUnsavedChanges, onSlideUpdate]);

  // 요소 업데이트 함수 - HTML 직접 업데이트 포함
  const updateElement = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (!tempSlide) return;

    const updatedElements = tempSlide.elements?.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ) || [];

    // HTML 콘텐츠 재생성
    const updatedHtmlContent = generateSlideHTML(
      tempSlide.title,
      tempSlide.content,
      theme,
      aspectRatio,
      tempSlide.order,
      themeFont,
      slideBorderStyle,
      tempSlide.slideLayout || tempSlide.template || 'title-top-content-bottom',
      tempSlide.backgroundImage,
      tempSlide.backgroundBlur || 2,
      tempSlide.themeOverlay || 0.3
    );

    setTempSlide(prev => prev ? {
      ...prev,
      elements: updatedElements,
      htmlContent: updatedHtmlContent,
    } : null);
    setHasUnsavedChanges(true);
  }, [tempSlide, theme, aspectRatio, themeFont, slideBorderStyle]);

  const addNewElement = (type: 'text' | 'image' = 'text') => {
    if (!tempSlide) return;

    const containerWidth = 800;
    const containerHeight = (800 * aspectRatio.height) / aspectRatio.width;

    const newElement: SlideElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? '새 텍스트' : '',
      x: Math.random() * (containerWidth - 200),
      y: Math.random() * (containerHeight - 100),
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 50 : 100,
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      fontWeight: 'normal',
      textAlign: 'left',
      zIndex: (tempSlide.elements?.length || 0) + 1,
    };

    setTempSlide(prev => prev ? {
      ...prev,
      elements: [...(prev.elements || []), newElement],
    } : null);
    setHasUnsavedChanges(true);
    setSelectedElementId(newElement.id);
  };

  const deleteElement = (elementId: string) => {
    if (!tempSlide) return;

    const updatedElements = tempSlide.elements?.filter(el => el.id !== elementId) || [];
    setTempSlide(prev => prev ? {
      ...prev,
      elements: updatedElements,
    } : null);
    setHasUnsavedChanges(true);
    setSelectedElementId(undefined);
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string, action: 'move' | 'resize' = 'move') => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setSelectedElementId(elementId);

    const handleMouseMove = (e: MouseEvent) => {
      if (!tempSlide) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const element = tempSlide.elements?.find(el => el.id === elementId);
      if (!element) return;

      if (action === 'move') {
        updateElement(elementId, {
          x: Math.max(0, element.x + deltaX),
          y: Math.max(0, element.y + deltaY),
        });
      } else if (action === 'resize') {
        updateElement(elementId, {
          width: Math.max(50, element.width + deltaX),
          height: Math.max(30, element.height + deltaY),
        });
      }

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTextEdit = (elementId: string, newContent: string) => {
    updateElement(elementId, { content: newContent });
  };

  const handleSlideTextEdit = (field: 'title' | 'content', newContent: string) => {
    if (!tempSlide) return;
    
    setTempSlide(prev => prev ? {
      ...prev,
      [field]: newContent,
    } : null);
    setHasUnsavedChanges(true);
  };

  const handleImageUpload = (elementId?: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            
            if (elementId) {
              // 기존 요소 업데이트
              updateElement(elementId, { content: imageUrl });
            } else {
              // 새 이미지 요소 직접 생성
              const newElement: SlideElement = {
                id: `element-${Date.now()}`,
                type: 'image',
                content: imageUrl,
                x: 100,
                y: 100,
                width: 150,
                height: 100,
                fontSize: 16,
                fontFamily: 'Arial, sans-serif',
                color: '#000000',
                fontWeight: 'normal',
                textAlign: 'left',
                zIndex: (tempSlide?.elements?.length || 0) + 1,
              };

              setTempSlide(prev => prev ? {
                ...prev,
                elements: [...(prev.elements || []), newElement],
              } : null);
              setHasUnsavedChanges(true);
              setSelectedElementId(newElement.id);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      fileInputRef.current.click();
    }
  };

  // 배경 이미지 업로드 함수
  const handleBackgroundImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && tempSlide) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            
            // 배경 이미지 설정 (자동 블러 효과 적용)
            const updatedSlide = {
              ...tempSlide,
              backgroundImage: imageUrl,
              backgroundBlur: 2, // 자동으로 블러 효과 적용
              backgroundSeed: undefined, // picsum 시드 제거
              backgroundGrayscale: false, // 그레이스케일 비활성화
            };
            
            setTempSlide(updatedSlide);
            setHasUnsavedChanges(true);
          };
          reader.readAsDataURL(file);
        }
      };
      fileInputRef.current.click();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.dataTransfer.dropEffect === 'copy' ? 
            Math.max(0, e.clientX - rect.left - 75) : 100;
          const y = e.dataTransfer.dropEffect === 'copy' ? 
            Math.max(0, e.clientY - rect.top - 50) : 100;
          
          const newElement: SlideElement = {
            id: `element-${Date.now()}`,
            type: 'image',
            content: imageUrl,
            x,
            y,
            width: 150,
            height: 100,
            fontSize: 16,
            fontFamily: 'Arial, sans-serif',
            color: '#000000',
            fontWeight: 'normal',
            textAlign: 'left',
            zIndex: (tempSlide?.elements?.length || 0) + 1,
          };

          setTempSlide(prev => prev ? {
            ...prev,
            elements: [...(prev.elements || []), newElement],
          } : null);
          setHasUnsavedChanges(true);
          setSelectedElementId(newElement.id);
        }
      };
      reader.readAsDataURL(imageFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleApplyChanges = () => {
    if (!tempSlide) return;
    
    // 최종 배경 이미지 생성 (블러와 그레이스케일 효과 포함)
    const finalBackgroundImage = tempSlide.backgroundSeed 
      ? generatePicsumImage(
          aspectRatio.width,
          aspectRatio.height,
          tempSlide.backgroundSeed,
          tempSlide.backgroundBlur || 2,
          tempSlide.backgroundGrayscale || false
        )
      : tempSlide.backgroundImage;

    const updatedSlide = {
      ...tempSlide,
      backgroundImage: finalBackgroundImage,
      htmlContent: generateSlideHTML(
        tempSlide.title,
        tempSlide.content,
        theme,
        aspectRatio,
        tempSlide.order,
        undefined,
        undefined,
        tempSlide.slideLayout || tempSlide.template || 'title-top-content-bottom',
        finalBackgroundImage,
        tempSlide.backgroundBlur || 2,
        tempSlide.themeOverlay || 0.3
      ),
      // 추가된 요소들도 포함
      elements: tempSlide.elements || [],
    };
    
    onSlideUpdate(updatedSlide);
    setHasUnsavedChanges(false);
    
    // 편집 모드 종료 시 선택 상태 초기화
    setSelectedElementId(undefined);
    setEditingElement(null);
  };

  // 배경 이미지 업데이트 함수들
  const handleBackgroundSeedChange = (seed: string) => {
    if (!tempSlide) return;
    
    const newBackgroundImage = generatePicsumImage(
      aspectRatio.width,
      aspectRatio.height,
      seed,
      tempSlide.backgroundBlur || 2,
      tempSlide.backgroundGrayscale || false
    );
    
    const updatedSlide = {
      ...tempSlide,
      backgroundSeed: seed,
      backgroundImage: newBackgroundImage,
    };
    
    setTempSlide(updatedSlide);
    setHasUnsavedChanges(true);
  };

  const handleBackgroundBlurChange = (blur: number) => {
    if (!tempSlide) return;
    
    const updatedSlide = {
      ...tempSlide,
      backgroundBlur: blur,
    };
    
    setTempSlide(updatedSlide);
    setHasUnsavedChanges(true);
  };

  const handleBackgroundGrayscaleChange = (grayscale: boolean) => {
    if (!tempSlide) return;
    
    const updatedSlide = {
      ...tempSlide,
      backgroundGrayscale: grayscale,
    };
    
    setTempSlide(updatedSlide);
    setHasUnsavedChanges(true);
  };

  // 슬라이드 템플릿 변경 핸들러
  const handleTemplateChange = (newTemplate: SlideLayoutType) => {
    if (!tempSlide) return;
    
    const updatedSlide = {
      ...tempSlide,
      slideLayout: newTemplate,
      template: newTemplate,
      htmlContent: generateSlideHTML(
        tempSlide.title,
        tempSlide.content,
        theme,
        aspectRatio,
        tempSlide.order,
        themeFont,
        slideBorderStyle,
        newTemplate,
        tempSlide.backgroundImage,
        tempSlide.backgroundBlur || 2,
        tempSlide.themeOverlay || 0.3
      ),
    };
    
    setTempSlide(updatedSlide);
    setHasUnsavedChanges(true);
  };

  const exportSlideAsImage = async (slide: Slide) => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      
      // 실제 슬라이드 컨테이너를 찾아서 캡처
      const slideContainer = document.querySelector(`[data-slide-id="${slide.id}"]`) as HTMLElement;
      
      if (slideContainer) {
        const canvas = await html2canvas(slideContainer, {
          width: slideContainer.offsetWidth,
          height: slideContainer.offsetHeight,
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
        });

        // Download image
        const link = document.createElement('a');
        link.download = `slide-${slide.order + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        // Fallback: create temporary div
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = slide.htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '800px';
        tempDiv.style.height = `${(800 * aspectRatio.height) / aspectRatio.width}px`;
        document.body.appendChild(tempDiv);

        const canvas = await html2canvas(tempDiv, {
          width: 800,
          height: (800 * aspectRatio.height) / aspectRatio.width,
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
        });

        document.body.removeChild(tempDiv);

        const link = document.createElement('a');
        link.download = `slide-${slide.order + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error('Error exporting slide as image:', error);
      alert('이미지 내보내기 중 오류가 발생했습니다.');
    }
  };

  // 객체 배치 템플릿
  const applyLayoutTemplate = (template: 'center' | 'left' | 'right') => {
    if (!tempSlide || !tempSlide.elements) return;

    const containerWidth = 800; // 기본 슬라이드 너비
    const containerHeight = (800 * aspectRatio.height) / aspectRatio.width;

    const updatedElements = tempSlide.elements.map((element, index) => {
      let x, y;
      
      switch (template) {
        case 'center':
          x = (containerWidth - element.width) / 2;
          y = 100 + (index * 80);
          break;
        case 'left':
          x = 50;
          y = 100 + (index * 80);
          break;
        case 'right':
          x = containerWidth - element.width - 50;
          y = 100 + (index * 80);
          break;
        default:
          x = element.x;
          y = element.y;
      }

      return { ...element, x, y };
    });

    setTempSlide(prev => prev ? {
      ...prev,
      elements: updatedElements,
    } : null);
    setHasUnsavedChanges(true);
  };

  // 선택된 요소 정렬 함수
  const applyElementAlignment = (alignment: 'left' | 'center' | 'right') => {
    if (!tempSlide || !selectedElementId) return;

    const containerWidth = 800;
    const element = tempSlide.elements?.find(el => el.id === selectedElementId);
    if (!element) return;

    let newX = element.x;

    switch (alignment) {
      case 'left':
        newX = 20; // 좌측 여백
        break;
      case 'center':
        newX = (containerWidth - element.width) / 2; // 가운데 정렬
        break;
      case 'right':
        newX = containerWidth - element.width - 20; // 우측 여백
        break;
    }

    updateElement(selectedElementId, { x: newX });
  };

  const selectedElement = tempSlide?.elements?.find(el => el.id === selectedElementId);

  // Calculate slide container size based on aspect ratio
  const getSlideContainerStyle = () => {
    const maxWidth = 800;
    const maxHeight = 600;
    
    const aspectRatioValue = aspectRatio.width / aspectRatio.height;
    
    let width, height;
    
    if (aspectRatioValue > maxWidth / maxHeight) {
      width = maxWidth;
      height = maxWidth / aspectRatioValue;
    } else {
      height = maxHeight;
      width = maxHeight * aspectRatioValue;
    }
    
    return {
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: '100%',
      margin: '0 auto'
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {t.generatedSlides} ({slides.length})
        </h2>
        <button
          onClick={() => onAddSlide()}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.addSlide}
        </button>
      </div>
      
      <div className="space-y-6">
        {slides.map((slide, index) => (
          <React.Fragment key={slide.id}>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    슬라이드 {index + 1}
                  </span>
                  <SlideOrderController
                    slideIndex={index}
                    totalSlides={slides.length}
                    onMoveUp={() => onSlideMove(index, index - 1)}
                    onMoveDown={() => onSlideMove(index, index + 1)}
                  />
                </div>
                <button
                  onClick={() => exportSlideAsImage(slide)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  이미지 저장
                </button>
              </div>
              
              {/* 슬라이드가 선택되지 않았을 때는 일반 미리보기 */}
              {activeSlideId !== slide.id ? (
                <SlidePreview
                  slide={slide}
                  slideNumber={index + 1}
                  activeTab={activeTab}
                  language={language}
                  onTabChange={onTabChange}
                  onDelete={() => {
                    if (window.confirm('이 슬라이드를 삭제하시겠습니까?')) {
                      onSlideDelete(slide.id);
                    }
                  }}
                  isActive={false}
                  onClick={() => onSlideSelect(slide.id)}
                  containerStyle={getSlideContainerStyle()}
                />
              ) : (
                /* 선택된 슬라이드는 직접 편집 가능한 형태로 표시 */
                tempSlide && (
                  <div className={`${isDarkMode ? 'bg-gray-800 border-blue-400' : 'bg-white border-blue-500'} rounded-lg border-2 p-4`}>
                    {/* 편집 컨트롤 바 */}
                                          <div className={`flex items-center justify-between mb-4 p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg`}>
                      <div className="flex items-center gap-2">
                                                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>슬라이드 편집</span>
                        {hasUnsavedChanges && (
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                            자동 저장 중...
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            // 편집 완료 전에 마지막 변경사항 강제 저장
                            if (tempSlide && hasUnsavedChanges) {
                              const finalBackgroundImage = tempSlide.backgroundSeed 
                                ? generatePicsumImage(
                                    aspectRatio.width,
                                    aspectRatio.height,
                                    tempSlide.backgroundSeed,
                                    tempSlide.backgroundBlur || 2,
                                    tempSlide.backgroundGrayscale || false
                                  )
                                : tempSlide.backgroundImage;

                              const updatedSlide = {
                                ...tempSlide,
                                backgroundImage: finalBackgroundImage,
                                htmlContent: generateSlideHTML(
                                  tempSlide.title,
                                  tempSlide.content,
                                  theme,
                                  aspectRatio,
                                  tempSlide.order,
                                  undefined,
                                  undefined,
                                  tempSlide.slideLayout || tempSlide.template || 'title-top-content-bottom',
                                  finalBackgroundImage,
                                  tempSlide.backgroundBlur || 2,
                                  tempSlide.themeOverlay || 0.3
                                ),
                                elements: tempSlide.elements || [],
                              };
                              
                              onSlideUpdate(updatedSlide);
                            }
                            
                            // 잠시 후 편집 모드 종료
                            setTimeout(() => {
                              onSlideSelect('');
                            }, 100);
                          }}
                          className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          편집 완료
                        </button>
                      </div>
                    </div>

                    {/* 슬라이드 편집 영역 - 상하 분할 */}
                    <div className="space-y-4">
                      {/* 직접 편집 영역 - 상단 */}
                      <div>
                        <div
                          ref={containerRef}
                          data-slide-id={slide.id}
                          className="relative border-2 border-dashed border-blue-300 rounded-lg overflow-hidden bg-white cursor-crosshair"
                          style={getSlideContainerStyle()}
                          onClick={(e) => {
                            // 빈 공간 클릭 시 선택 해제
                            if (e.target === e.currentTarget) {
                              setSelectedElementId(undefined);
                              setEditingElement(null);
                            }
                          }}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                        >
                          {/* 기본 슬라이드 배경 */}
                          <div 
                            className="absolute inset-0 z-0"
                            style={{
                              background: tempSlide.backgroundImage 
                                ? (() => {
                                    const themeHex = theme.primary.replace('#', '');
                                    const r = parseInt(themeHex.substr(0, 2), 16);
                                    const g = parseInt(themeHex.substr(2, 2), 16);
                                    const b = parseInt(themeHex.substr(4, 2), 16);
                                    const themeRgba = `rgba(${r}, ${g}, ${b}, ${tempSlide.themeOverlay || 0.3})`;
                                    return `linear-gradient(${themeRgba}, ${themeRgba}), url(${tempSlide.backgroundImage}) center/cover`;
                                  })()
                                : `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15)`,
                              filter: tempSlide.backgroundImage && tempSlide.backgroundBlur ? `blur(${tempSlide.backgroundBlur}px)` : 'none',
                            }}
                          />

                          {/* 기본 슬라이드 텍스트 (편집 가능) - 템플릿에 따라 레이아웃 변경 */}
                          {(() => {
                            const layout = tempSlide.slideLayout || 'title-top-content-bottom';
                            const getLayoutClasses = () => {
                              switch (layout) {
                                case 'title-top-content-bottom':
                                  return {
                                    container: 'flex-col justify-center items-center',
                                    titleAlign: 'text-center',
                                    contentAlign: 'text-center',
                                    titleSize: 'text-4xl',
                                    contentSize: 'text-lg',
                                    titleWidth: 'w-full',
                                    contentWidth: 'w-full'
                                  };
                                case 'title-left-content-right':
                                  return {
                                    container: 'flex-row justify-center items-center',
                                    titleAlign: 'text-left',
                                    contentAlign: 'text-left',
                                    titleSize: 'text-3xl',
                                    contentSize: 'text-base',
                                    titleWidth: 'w-2/5',
                                    contentWidth: 'w-2/5'
                                  };
                                case 'title-right-content-left':
                                  return {
                                    container: 'flex-row-reverse justify-center items-center',
                                    titleAlign: 'text-right',
                                    contentAlign: 'text-left',
                                    titleSize: 'text-3xl',
                                    contentSize: 'text-base',
                                    titleWidth: 'w-2/5',
                                    contentWidth: 'w-2/5'
                                  };
                                case 'title-only':
                                  return {
                                    container: 'flex-col justify-center items-center',
                                    titleAlign: 'text-center',
                                    contentAlign: 'text-center',
                                    titleSize: 'text-5xl',
                                    contentSize: 'text-lg',
                                    titleWidth: 'w-full',
                                    contentWidth: 'w-0'
                                  };
                                case 'title-small-top-left':
                                  return {
                                    container: 'flex-col justify-start items-start',
                                    titleAlign: 'text-left',
                                    contentAlign: 'text-left',
                                    titleSize: 'text-2xl',
                                    contentSize: 'text-xl',
                                    titleWidth: 'w-full',
                                    contentWidth: 'w-full'
                                  };
                                case 'title-small-top-right':
                                  return {
                                    container: 'flex-col justify-start items-end',
                                    titleAlign: 'text-right',
                                    contentAlign: 'text-left',
                                    titleSize: 'text-2xl',
                                    contentSize: 'text-xl',
                                    titleWidth: 'w-full',
                                    contentWidth: 'w-full'
                                  };
                                default:
                                  return {
                                    container: 'flex-col justify-center items-center',
                                    titleAlign: 'text-center',
                                    contentAlign: 'text-center',
                                    titleSize: 'text-4xl',
                                    contentSize: 'text-lg',
                                    titleWidth: 'w-full',
                                    contentWidth: 'w-full'
                                  };
                              }
                            };
                            
                            const layoutClasses = getLayoutClasses();
                            
                            return (
                              <div className={`absolute inset-0 z-10 p-8 flex gap-4 ${layoutClasses.container}`}>
                                <div 
                                  className={`${layoutClasses.titleWidth} relative hover:ring-1 hover:ring-blue-300 cursor-pointer`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElementId('slide-title');
                                  }}
                                >
                                  <h1
                                    contentEditable
                                    suppressContentEditableWarning
                                    className={`${layoutClasses.titleSize} font-bold ${layoutClasses.titleAlign} mb-4 outline-none cursor-text hover:bg-blue-100 hover:bg-opacity-50 p-2 rounded transition-colors`}
                                    style={{
                                      color: tempSlide.backgroundImage ? '#FFFFFF' : theme.primary,
                                      textShadow: tempSlide.backgroundImage ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                                    }}
                                    onInput={(e) => {
                                      const newTitle = e.currentTarget.textContent || '';
                                      handleSlideTextEdit('title', newTitle);
                                    }}
                                    onBlur={(e) => handleSlideTextEdit('title', e.target.textContent || '')}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(tempSlide.title) }}
                                  >
                                  </h1>
                                  {selectedElementId === 'slide-title' && (
                                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                                
                                {layout !== 'title-only' && (
                                  <div 
                                    className={`${layoutClasses.contentWidth} relative hover:ring-1 hover:ring-blue-300 cursor-pointer`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedElementId('slide-content');
                                    }}
                                  >
                                    <div
                                      contentEditable
                                      suppressContentEditableWarning
                                      className={`${layoutClasses.contentSize} ${layoutClasses.contentAlign} outline-none cursor-text hover:bg-green-100 hover:bg-opacity-50 p-2 rounded transition-colors`}
                                      style={{
                                        color: tempSlide.backgroundImage ? '#F0F0F0' : theme.secondary,
                                        textShadow: tempSlide.backgroundImage ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none',
                                      }}
                                      onInput={(e) => {
                                        const newContent = e.currentTarget.textContent || '';
                                        handleSlideTextEdit('content', newContent);
                                      }}
                                      onBlur={(e) => handleSlideTextEdit('content', e.target.textContent || '')}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          e.currentTarget.blur();
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(tempSlide.content) }}
                                    >
                                    </div>
                                    {selectedElementId === 'slide-content' && (
                                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* 추가된 요소들 */}
                          {tempSlide.elements?.map((element) => (
                            <div
                              key={element.id}
                              className={`absolute group z-20 ${
                                selectedElementId === element.id ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-1 hover:ring-blue-300'
                              }`}
                              style={{
                                left: element.x,
                                top: element.y,
                                width: element.width,
                                height: element.height,
                                cursor: isDragging ? 'move' : 'pointer',
                                transform: `rotate(${element.rotation || 0}deg)`,
                                backgroundColor: element.backgroundColor || 'transparent',
                                border: `${element.borderWidth || 0}px solid ${element.borderColor || 'transparent'}`,
                                zIndex: element.zIndex || 1,
                                minWidth: '20px',
                                minHeight: '20px',
                              }}
                              onMouseDown={(e) => {
                                if (editingElement === element.id) return; // 편집 중일 때는 드래그 방지
                                e.stopPropagation();
                                handleMouseDown(e, element.id, 'move');
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedElementId(element.id);
                                setEditingElement(null);
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                if (element.type === 'text') {
                                  setEditingElement(element.id);
                                }
                              }}
                            >
                              {/* 선택된 요소의 컨트롤 */}
                              {selectedElementId === element.id && (
                                <>
                                  {/* 삭제 버튼 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteElement(element.id);
                                    }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-30"
                                    style={{ fontSize: '12px' }}
                                  >
                                    ×
                                  </button>
                                  
                                  {/* 리사이즈 핸들 */}
                                  <div
                                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize z-30"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      handleMouseDown(e, element.id, 'resize');
                                    }}
                                  />
                                  
                                  {/* 회전 핸들 */}
                                  <div
                                    className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full cursor-pointer z-30"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      // 회전 로직은 나중에 구현
                                    }}
                                  />
                                </>
                              )}
                              {element.type === 'text' ? (
                                editingElement === element.id ? (
                                  <textarea
                                    value={element.content}
                                    onChange={(e) => handleTextEdit(element.id, e.target.value)}
                                    onBlur={() => setEditingElement(null)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        setEditingElement(null);
                                      }
                                      if (e.key === 'Escape') {
                                        setEditingElement(null);
                                      }
                                    }}
                                    autoFocus
                                    className="w-full h-full resize-none border-none outline-none bg-white bg-opacity-90 rounded"
                                    style={{
                                      fontSize: element.fontSize,
                                      fontFamily: element.fontFamily,
                                      color: element.color,
                                      fontWeight: element.fontWeight,
                                      textAlign: element.textAlign,
                                      lineHeight: 1.4,
                                      padding: '8px',
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full outline-none cursor-text"
                                    style={{
                                      fontSize: element.fontSize,
                                      fontFamily: element.fontFamily,
                                      color: element.color,
                                      fontWeight: element.fontWeight,
                                      textAlign: element.textAlign,
                                      lineHeight: 1.4,
                                      padding: '8px',
                                      textShadow: tempSlide.backgroundImage ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                                      background: selectedElementId === element.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                      wordBreak: 'break-word',
                                      whiteSpace: 'pre-wrap',
                                    }}
                                  >
                                    {element.content || '텍스트를 입력하세요'}
                                  </div>
                                )
                              ) : (
                                <div className="w-full h-full relative pointer-events-none">
                                  {element.content && element.content.length > 0 ? (
                                    element.content.startsWith('data:image') ? (
                                      <img
                                        src={element.content}
                                        alt="Slide element"
                                        className="w-full h-full object-cover rounded pointer-events-none"
                                        style={{
                                          border: selectedElementId === element.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                                        }}
                                        draggable={false}
                                        onError={(e) => {
                                          console.error('Image load error:', e);
                                          // 이미지 로드 실패 시 플레이스홀더 표시
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      // URL이 아닌 텍스트인 경우 플레이스홀더 표시
                                      <div 
                                        className="w-full h-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer pointer-events-auto"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleImageUpload(element.id);
                                        }}
                                      >
                                        <div className="text-center">
                                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                          <p className="text-sm text-gray-500">이미지 업로드</p>
                                          <p className="text-xs text-gray-400 mt-1">잘못된 이미지 형식</p>
                                        </div>
                                      </div>
                                    )
                                  ) : (
                                    <div 
                                      className="w-full h-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer pointer-events-auto"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleImageUpload(element.id);
                                      }}
                                    >
                                      <div className="text-center">
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm text-gray-500">이미지 업로드</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* 선택된 요소의 컨트롤 핸들 */}
                              {selectedElementId === element.id && (
                                <>
                                  {/* 삭제 버튼 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteElement(element.id);
                                    }}
                                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-30 shadow-lg"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  
                                  {/* 크기 조절 핸들 */}
                                  <div
                                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize z-30"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      handleMouseDown(e, element.id, 'resize');
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 오른쪽 컨트롤 패널 - 우측 1/3 */}
                      <div className="space-y-4">
                        {/* 슬라이드 템플릿 선택 */}
                        <SlideTemplateSelector
                          currentTemplate={tempSlide.slideLayout || 'title-top-content-bottom'}
                          onTemplateChange={handleTemplateChange}
                        />

                        {/* 요소 배치 버튼 */}
                        <div className="bg-white rounded-lg border p-3 space-y-3">
                          <h4 className="text-sm font-semibold text-gray-800">요소 배치</h4>
                          {selectedElementId && selectedElementId !== 'slide-title' && selectedElementId !== 'slide-content' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => applyElementAlignment('left')}
                                className="flex-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                title="좌측 정렬"
                              >
                                <AlignLeft className="w-3 h-3 mx-auto" />
                              </button>
                              <button
                                onClick={() => applyElementAlignment('center')}
                                className="flex-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                title="가운데 정렬"
                              >
                                <AlignCenter className="w-3 h-3 mx-auto" />
                              </button>
                              <button
                                onClick={() => applyElementAlignment('right')}
                                className="flex-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                                title="우측 정렬"
                              >
                                <AlignRight className="w-3 h-3 mx-auto" />
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 text-center">요소를 선택하세요</p>
                          )}
                        </div>

                        {/* 배경 이미지 컨트롤 */}
                        <BackgroundController
                          currentSeed={tempSlide.backgroundSeed || 'default'}
                          blur={tempSlide.backgroundBlur || 2}
                          grayscale={tempSlide.backgroundGrayscale || false}
                          width={aspectRatio.width}
                          height={aspectRatio.height}
                          onSeedChange={handleBackgroundSeedChange}
                          onBlurChange={handleBackgroundBlurChange}
                          onGrayscaleChange={handleBackgroundGrayscaleChange}
                          onBackgroundChange={(background) => {
                            // 컬러 배경 적용 로직
                            console.log('Color background selected:', background);
                          }}
                          onPatternChange={(pattern) => {
                            // 패턴/필터 적용 로직
                            console.log('Pattern/filter selected:', pattern);
                          }}
                        />

                        {/* 요소 추가 버튼 - 한 줄 배치 */}
                        <div className="bg-white rounded-lg border p-3 space-y-3">
                          <h4 className="text-sm font-semibold text-gray-800">요소 추가</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => addNewElement('text')}
                              className="flex items-center justify-center gap-1 px-2 py-2 text-xs bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              텍스트
                            </button>
                            <button
                              onClick={() => handleImageUpload()}
                              className="flex items-center justify-center gap-1 px-2 py-2 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                            >
                              <ImageIcon className="w-3 h-3" />
                              이미지
                            </button>
                            <button
                              onClick={() => handleBackgroundImageUpload()}
                              className="flex items-center justify-center gap-1 px-2 py-2 text-xs bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                            >
                              <Upload className="w-3 h-3" />
                              배경
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* 선택된 요소의 속성 패널 - 슬라이드 아래 */}
                    {selectedElement && (
                      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} rounded-lg border p-4 space-y-4`}>
                        <div className="flex items-center justify-between">
                                                      <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {selectedElement.type === 'text' ? '📝 텍스트 속성' : '🖼️ 이미지 속성'}
                          </h4>
                                                      <button
                              onClick={() => setSelectedElementId(undefined)}
                              className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                            ✕
                          </button>
                        </div>
                        
                        {/* 우선순위 조절 */}
                                                 <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}>
                           <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>우선순위 (z-index)</label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateElement(selectedElement.id, { zIndex: Math.max(1, (selectedElement.zIndex || 1) - 1) })}
                              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                              title="뒤로 보내기"
                            >
                              ↓
                            </button>
                                                         <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} min-w-8 text-center`}>
                               {selectedElement.zIndex || 1}
                             </span>
                            <button
                              onClick={() => updateElement(selectedElement.id, { zIndex: (selectedElement.zIndex || 1) + 1 })}
                              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                              title="앞으로 가져오기"
                            >
                              ↑
                            </button>
                          </div>
                        </div>

                        {selectedElement.type === 'text' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                  {/* 글자 크기 */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">크기</label>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="range"
                                        min="12"
                                        max="72"
                                        value={selectedElement.fontSize}
                                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                                        className="flex-1"
                                      />
                                      <span className="text-xs text-gray-500 w-8">{selectedElement.fontSize}</span>
                                    </div>
                                  </div>

                                  {/* 글꼴 */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">글꼴</label>
                                    <select
                                      value={selectedElement.fontFamily}
                                      onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                    >
                                      {FONT_FAMILIES.map((font) => (
                                        <option key={font} value={font}>
                                          {font.split(',')[0]}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* 글자 색상 */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">색상</label>
                                    <input
                                      type="color"
                                      value={selectedElement.color}
                                      onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                      className="w-full h-6 border border-gray-300 rounded"
                                    />
                                  </div>
                                </div>

                                {/* 텍스트 정렬 및 굵기 */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">굵기</label>
                                    <select
                                      value={selectedElement.fontWeight}
                                      onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value })}
                                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                    >
                                      <option value="normal">보통</option>
                                      <option value="bold">굵게</option>
                                      <option value="bolder">더 굵게</option>
                                    </select>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">정렬</label>
                                    <div className="flex gap-1">
                                      {(['left', 'center', 'right'] as const).map((align) => (
                                        <button
                                          key={align}
                                          onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                                          className={`p-1 rounded text-xs ${
                                            selectedElement.textAlign === align
                                              ? 'bg-blue-500 text-white'
                                              : 'bg-gray-200 hover:bg-gray-300'
                                          }`}
                                        >
                                          {align === 'left' && <AlignLeft className="w-3 h-3" />}
                                          {align === 'center' && <AlignCenter className="w-3 h-3" />}
                                          {align === 'right' && <AlignRight className="w-3 h-3" />}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* 위치 및 크기 */}
                                <div className="grid grid-cols-4 gap-1">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">X</label>
                                    <input
                                      type="number"
                                      value={Math.round(selectedElement.x)}
                                      onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Y</label>
                                    <input
                                      type="number"
                                      value={Math.round(selectedElement.y)}
                                      onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">너비</label>
                                    <input
                                      type="number"
                                      value={Math.round(selectedElement.width)}
                                      onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 50 })}
                                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">높이</label>
                                    <input
                                      type="number"
                                      value={Math.round(selectedElement.height)}
                                      onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 30 })}
                                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedElement.type === 'image' && (
                              <div className="space-y-2">
                                <button
                                  onClick={() => handleImageUpload(selectedElement.id)}
                                  className="w-full flex items-center justify-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                  <Upload className="w-3 h-3" />
                                  이미지 변경
                                </button>
                                
                                {/* 위치 및 크기 */}
                                <div className="grid grid-cols-4 gap-1">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">X</label>
                                    <input
                                      type="number"
                                      value={Math.round(selectedElement.x)}
                                      onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Y</label>
                                    <input
                                      type="number"
                                      value={Math.round(selectedElement.y)}
                                      onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">너비</label>
                                    <input
                                      type="number"
                                      value={Math.round(selectedElement.width)}
                                      onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 50 })}
                                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">높이</label>
                                    <input
                                      type="number"
                                      value={Math.round(selectedElement.height)}
                                      onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 30 })}
                                      className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
            
            {index < slides.length - 1 && (
              <div className="flex justify-center">
                <button
                  onClick={() => onAddSlide(index)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {t.addSlideHere}
                </button>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};