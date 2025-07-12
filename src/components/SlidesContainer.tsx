import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Slide, Theme, AspectRatio, SlideElement } from '../types';
import { SlidePreview } from './SlidePreview';
import { BackgroundController } from './BackgroundController';
import { SlideTemplateSelector, SlideLayoutType } from './SlideTemplateSelector';
import { SlideOrderController } from './SlideOrderController';
import { TypingEffect } from './TypingEffect';
import { TRANSLATIONS } from '../constants';
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
  Palette,
  X,
  Type
} from 'lucide-react';

const FONT_FAMILIES = [
  "Arial, sans-serif",
  "Helvetica, sans-serif",
  "Times New Roman, serif",
  "Georgia, serif",
  "Courier New, monospace",
  "Verdana, sans-serif",
  "Garamond, serif",
  "Comic Sans MS, cursive",
  "Trebuchet MS, sans-serif",
  "Impact, fantasy",
];

// 간단한 마크다운 렌더러 (미리보기용)
const renderMarkdownPreview = (text: string): string => {
  if (!text) {return '';}
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
  const [showTypingEffect, setShowTypingEffect] = useState(false);
  const [slidesDisplayCount, setSlidesDisplayCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[language];

  // 새 슬라이드가 추가될 때 타이핑 효과 트리거
  useEffect(() => {
    if (slides.length > slidesDisplayCount) {
      setShowTypingEffect(true);
      setSlidesDisplayCount(slides.length);
      
      // 타이핑 효과 완료 후 자동으로 비활성화
      const timer = setTimeout(() => {
        setShowTypingEffect(false);
      }, slides.length * 2000 + 3000); // 슬라이드 개수에 따라 시간 조정

      return () => clearTimeout(timer);
    }
  }, [slides.length, slidesDisplayCount]);

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

  // 실시간 HTML 업데이트 - 편집 시 즉시 반영 (테마, 폰트, 테두리 스타일 포함)
  useEffect(() => {
    if (!tempSlide) {return;}

    // tempSlide가 변경될 때마다 즉시 HTML 업데이트
    // 배경 타입에 따라 표시할 배경 결정
    const finalBackgroundImage = (tempSlide.backgroundType === 'image' || !tempSlide.backgroundType)
      ? (tempSlide.backgroundSeed
          ? generatePicsumImage(
              aspectRatio.width,
              aspectRatio.height,
              tempSlide.backgroundSeed,
              tempSlide.backgroundBlur || 2,
              tempSlide.backgroundGrayscale || false
            )
          : tempSlide.backgroundImage)
      : undefined;

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
      tempSlide.themeOverlay || 0.3,
      tempSlide.backgroundType === 'color' ? tempSlide.backgroundColor : undefined,
      tempSlide.backgroundPattern,
      tempSlide.elements,
      'ppt' // 기본값
    );

    // tempSlide의 htmlContent를 즉시 업데이트
    setTempSlide(prev => prev ? {
      ...prev,
      backgroundImage: finalBackgroundImage,
      htmlContent: updatedHtmlContent,
    } : null);

    // 변경사항이 있음을 표시 (테마/폰트/테두리 변경 시에도)
    setHasUnsavedChanges(true);

  }, [tempSlide?.title, tempSlide?.content, tempSlide?.backgroundSeed, tempSlide?.backgroundBlur, tempSlide?.backgroundGrayscale, tempSlide?.slideLayout, tempSlide?.template, tempSlide?.backgroundType, tempSlide?.backgroundColor, tempSlide?.backgroundPattern, tempSlide?.elements, theme, aspectRatio, themeFont, slideBorderStyle]);

  // 자동 저장 - 변경사항을 실제 슬라이드에 저장
  useEffect(() => {
    if (!tempSlide || !hasUnsavedChanges) {return;}

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
    if (!tempSlide) {return;}

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
      tempSlide.themeOverlay || 0.3,
      tempSlide.backgroundImage ? undefined : tempSlide.backgroundColor,
      tempSlide.backgroundPattern,
      updatedElements,
      'ppt' // 기본값
    );

    setTempSlide(prev => prev ? {
      ...prev,
      elements: updatedElements,
      htmlContent: updatedHtmlContent,
    } : null);
    setHasUnsavedChanges(true);
  }, [tempSlide, theme, aspectRatio, themeFont, slideBorderStyle]);

  // 요소 삭제 함수
  const deleteElement = useCallback((elementId: string) => {
    if (!tempSlide) return;

    const updatedElements = tempSlide.elements?.filter(el => el.id !== elementId) || [];

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
      tempSlide.themeOverlay || 0.3,
      tempSlide.backgroundImage ? undefined : tempSlide.backgroundColor,
      tempSlide.backgroundPattern,
      updatedElements,
      'ppt' // 기본값
    );

    setTempSlide(prev => prev ? {
      ...prev,
      elements: updatedElements,
      htmlContent: updatedHtmlContent,
    } : null);
    
    // 삭제된 요소가 선택되어 있었다면 선택 해제
    if (selectedElementId === elementId) {
      setSelectedElementId(undefined);
    }
    
    setHasUnsavedChanges(true);
  }, [tempSlide, theme, aspectRatio, themeFont, slideBorderStyle, selectedElementId]);

  const addNewElement = (type: 'text' | 'image' = 'text') => {
    if (!tempSlide) {return;}

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

  const handleMouseDown = (e: React.MouseEvent, elementId: string, action: 'move' | 'resize' = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setSelectedElementId(elementId);

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    
    // Handle built-in elements (title, content) and regular elements differently
    let element: any;
    let isBuiltinElement = false;
    
    if (elementId === 'slide-title' || elementId === 'slide-content') {
      // Built-in elements - initialize with default values if they don't exist
      isBuiltinElement = true;
      if (!tempSlide?.[`${elementId.replace('slide-', '')}Position`]) {
        // Initialize position and size for built-in elements
        const defaultProps = {
          x: elementId === 'slide-title' ? 50 : 50,
          y: elementId === 'slide-title' ? 50 : 200,
          width: elementId === 'slide-title' ? 500 : 600,
          height: elementId === 'slide-title' ? 80 : 150,
        };
        
        setTempSlide(prev => prev ? {
          ...prev,
          [`${elementId.replace('slide-', '')}Position`]: defaultProps
        } : null);
        element = defaultProps;
      } else {
        element = tempSlide[`${elementId.replace('slide-', '')}Position`];
      }
    } else {
      // Regular elements
      element = tempSlide?.elements?.find(el => el.id === elementId);
      if (!element) return;
    }

    const initialX = element.x;
    const initialY = element.y;
    const initialWidth = element.width;
    const initialHeight = element.height;

    const handleMouseMove = (e: MouseEvent) => {
      if (!tempSlide || !containerRect) return;

      const deltaX = e.clientX - initialMouseX;
      const deltaY = e.clientY - initialMouseY;

      if (action === 'move') {
        const newX = Math.max(0, Math.min(initialX + deltaX, containerRect.width - element.width));
        const newY = Math.max(0, Math.min(initialY + deltaY, containerRect.height - element.height));
        
        if (isBuiltinElement) {
          // Update built-in element position
          setTempSlide(prev => prev ? {
            ...prev,
            [`${elementId.replace('slide-', '')}Position`]: {
              ...prev[`${elementId.replace('slide-', '')}Position`] || element,
              x: newX,
              y: newY,
            }
          } : null);
        } else {
          updateElement(elementId, {
            x: newX,
            y: newY,
          });
        }
      } else if (action === 'resize') {
        const newWidth = Math.max(50, initialWidth + deltaX);
        const newHeight = Math.max(30, initialHeight + deltaY);
        
        // 컨테이너 경계 내에서만 리사이즈
        const maxWidth = containerRect.width - element.x;
        const maxHeight = containerRect.height - element.y;
        
        const finalWidth = Math.min(newWidth, maxWidth);
        const finalHeight = Math.min(newHeight, maxHeight);
        
        if (isBuiltinElement) {
          // Update built-in element size and calculate new font size
          const fontSizeMultiplier = Math.sqrt((finalWidth * finalHeight) / (initialWidth * initialHeight));
          const baseFontSize = elementId === 'slide-title' ? 24 : 16;
          const newFontSize = Math.max(12, Math.min(48, baseFontSize * fontSizeMultiplier));
          
          setTempSlide(prev => prev ? {
            ...prev,
            [`${elementId.replace('slide-', '')}Position`]: {
              ...prev[`${elementId.replace('slide-', '')}Position`] || element,
              width: finalWidth,
              height: finalHeight,
              fontSize: newFontSize,
            }
          } : null);
        } else {
          updateElement(elementId, {
            width: finalWidth,
            height: finalHeight,
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRotationStart = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!tempSlide) return;
    
    const element = tempSlide.elements?.find(el => el.id === elementId);
    if (!element) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const elementCenterX = element.x + element.width / 2;
    const elementCenterY = element.y + element.height / 2;
    
    const getAngle = (clientX: number, clientY: number) => {
      const mouseX = (clientX - containerRect.left) - elementCenterX;
      const mouseY = (clientY - containerRect.top) - elementCenterY;
      
      return Math.atan2(mouseY, mouseX) * (180 / Math.PI);
    };

    const startAngle = getAngle(e.clientX, e.clientY);
    const initialRotation = element.rotation || 0;

    const handleRotationMove = (e: MouseEvent) => {
      const currentAngle = getAngle(e.clientX, e.clientY);
      const deltaAngle = currentAngle - startAngle;
      let newRotation = (initialRotation + deltaAngle) % 360;
      
      // 음수 각도를 양수로 변환
      if (newRotation < 0) {
        newRotation += 360;
      }
      
      updateElement(elementId, { rotation: newRotation });
    };

    const handleRotationEnd = () => {
      document.removeEventListener('mousemove', handleRotationMove);
      document.removeEventListener('mouseup', handleRotationEnd);
    };

    document.addEventListener('mousemove', handleRotationMove);
    document.addEventListener('mouseup', handleRotationEnd);
  };

  const handleTextEdit = (elementId: string, newContent: string) => {
    updateElement(elementId, { content: newContent });
  };

  const handleSlideTextEdit = (field: 'title' | 'content', newContent: string) => {
    if (!tempSlide) {return;}

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
              backgroundType: 'image' // 이미지 타입으로 설정
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
    if (!tempSlide) {return;}

    // 최종 배경 이미지 생성 (블러와 그레이스케일 효과 포함)
    // 배경 타입에 따라 표시할 배경 결정
    const finalBackgroundImage = (tempSlide.backgroundType === 'image' || !tempSlide.backgroundType)
      ? (tempSlide.backgroundSeed
          ? generatePicsumImage(
              aspectRatio.width,
              aspectRatio.height,
              tempSlide.backgroundSeed,
              tempSlide.backgroundBlur || 2,
              tempSlide.backgroundGrayscale || false
            )
          : tempSlide.backgroundImage)
      : undefined;

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
        tempSlide.themeOverlay || 0.3,
        tempSlide.backgroundType === 'color' ? tempSlide.backgroundColor : undefined,
        tempSlide.backgroundPattern,
        tempSlide.elements,
        'ppt' // 기본값
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
    if (!tempSlide) {return;}

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
      // 이미지가 선택되면 이미지 타입으로 설정
      backgroundType: 'image'
    };

    setTempSlide(updatedSlide);
    setHasUnsavedChanges(true);
  };

  const handleBackgroundBlurChange = (blur: number) => {
    if (!tempSlide) {return;}

    const updatedSlide = {
      ...tempSlide,
      backgroundBlur: blur,
    };

    setTempSlide(updatedSlide);
    setHasUnsavedChanges(true);
  };

  const handleBackgroundGrayscaleChange = (grayscale: boolean) => {
    if (!tempSlide) {return;}

    const updatedSlide = {
      ...tempSlide,
      backgroundGrayscale: grayscale,
    };

    setTempSlide(updatedSlide);
    setHasUnsavedChanges(true);
  };

  // 슬라이드 템플릿 변경 핸들러
  const handleTemplateChange = (newTemplate: SlideLayoutType) => {
    if (!tempSlide) {return;}

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
        tempSlide.themeOverlay || 0.3,
        tempSlide.backgroundImage ? undefined : tempSlide.backgroundColor,
        tempSlide.backgroundPattern,
        tempSlide.elements,
        'ppt' // 기본값
      ),
    };

    setTempSlide(updatedSlide);
    setHasUnsavedChanges(true);
  };

  const exportSlideAsImage = async (slide: Slide) => {
    // 새 창에서 이미지 생성 처리
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    newWindow.document.write(`
      <html>
        <head>
          <title>이미지 생성 중...</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .spinner {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2>슬라이드 ${slide.order + 1} 이미지 생성 중...</h2>
            <p>잠시만 기다려주세요.</p>
          </div>
        </body>
      </html>
    `);

    try {
      const { default: html2canvas } = await import('html2canvas');
      const slideContainer = document.querySelector(`[data-slide-id="${slide.id}"]`) as HTMLElement;

      let canvas;
      if (slideContainer) {
        canvas = await html2canvas(slideContainer, {
          width: slideContainer.offsetWidth,
          height: slideContainer.offsetHeight,
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
        });
      } else {
        // Fallback
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = slide.htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '800px';
        tempDiv.style.height = `${(800 * aspectRatio.height) / aspectRatio.width}px`;
        document.body.appendChild(tempDiv);

        canvas = await html2canvas(tempDiv, {
          width: 800,
          height: (800 * aspectRatio.height) / aspectRatio.width,
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
        });

        document.body.removeChild(tempDiv);
      }

      // 완료 후 다운로드
      newWindow.document.body.innerHTML = `
        <div class="container">
          <h2>✅ 이미지 생성 완료!</h2>
          <p>다운로드가 시작됩니다...</p>
          <button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">창 닫기</button>
        </div>
      `;

      const link = document.createElement('a');
      link.download = `slide-${slide.order + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // 2초 후 창 자동 닫기
      setTimeout(() => {
        newWindow.close();
      }, 2000);

    } catch (error) {
      console.error('Error exporting slide as image:', error);
      newWindow.document.body.innerHTML = `
        <div class="container">
          <h2>❌ 오류 발생</h2>
          <p>이미지 생성 중 오류가 발생했습니다.</p>
          <button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">창 닫기</button>
        </div>
      `;
    }
  };

  // 객체 배치 템플릿
  const applyLayoutTemplate = (template: 'center' | 'left' | 'right') => {
    if (!tempSlide || !tempSlide.elements) {return;}

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
    if (!tempSlide || !selectedElementId) {return;}

    const containerWidth = 800;
    
    // Handle built-in elements (title, content)
    if (selectedElementId === 'slide-title' || selectedElementId === 'slide-content') {
      const elementKey = `${selectedElementId.replace('slide-', '')}Position`;
      const currentPosition = tempSlide[elementKey] || {
        x: selectedElementId === 'slide-title' ? 50 : 50,
        y: selectedElementId === 'slide-title' ? 50 : 200,
        width: selectedElementId === 'slide-title' ? 500 : 600,
        height: selectedElementId === 'slide-title' ? 80 : 150,
      };

      let newX = currentPosition.x;

      switch (alignment) {
        case 'left':
          newX = 20; // 좌측 여백
          break;
        case 'center':
          newX = (containerWidth - currentPosition.width) / 2; // 가운데 정렬
          break;
        case 'right':
          newX = containerWidth - currentPosition.width - 20; // 우측 여백
          break;
      }

      setTempSlide(prev => prev ? {
        ...prev,
        [elementKey]: {
          ...currentPosition,
          x: newX,
        }
      } : null);
      setHasUnsavedChanges(true);
      return;
    }

    // Handle regular elements
    const element = tempSlide.elements?.find(el => el.id === selectedElementId);
    if (!element) {return;}

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

  // Calculate slide container size based on aspect ratio - responsive
  const getSlideContainerStyle = () => {
    // 편집 모드와 미리보기 모드에 따라 다른 크기 적용
    const isEditMode = activeSlideId !== null;
    
    if (isEditMode) {
      // 편집 모드: 더 큰 크기
      const maxWidth = 900;
      const maxHeight = 700;
      const minWidth = 600;
      const minHeight = 400;
      
      const aspectRatioValue = aspectRatio.width / aspectRatio.height;
      let width, height;

      if (aspectRatioValue > maxWidth / maxHeight) {
        width = Math.max(minWidth, Math.min(maxWidth, window.innerWidth * 0.6));
        height = width / aspectRatioValue;
      } else {
        height = Math.max(minHeight, Math.min(maxHeight, window.innerHeight * 0.6));
        width = height * aspectRatioValue;
      }

      return {
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: '100%',
        margin: '0 auto'
      };
    } else {
      // 미리보기 모드: 적당한 크기로 전체 내용이 보이도록
      const containerWidth = 500; // 고정 너비
      const aspectRatioValue = aspectRatio.width / aspectRatio.height;
      const containerHeight = containerWidth / aspectRatioValue;

      return {
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        maxWidth: '100%',
        margin: '0 auto'
      };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {t.generatedSlides} ({slides.length})
        </h2>
      </div>

      <div className="space-y-6">
        {slides.map((slide, index) => (
          <React.Fragment key={slide.id}>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {showTypingEffect && index < slidesDisplayCount ? (
                    <TypingEffect
                      text={`슬라이드 ${index + 1}`}
                      speed={50}
                      startDelay={index * 500}
                      className="text-sm font-medium text-gray-600"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      슬라이드 {index + 1}
                    </span>
                  )}
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
                  showTypingEffect={showTypingEffect}
                  typingDelay={index * 1000}
                  isDarkMode={isDarkMode}
                />
              ) : (
                /* 선택된 슬라이드는 직접 편집 가능한 형태로 표시 */
                tempSlide && (
                  <div
                    className="relative"
                    onMouseDown={(e) => {
                      // 요소 위가 아닌 슬라이드 배경을 클릭했을 때만 선택 해제
                      if ((e.target as HTMLElement).dataset.slideId) {
                        onSlideSelect('');
                      }
                    }}
                  >
                    {/* 선택된 슬라이드는 직접 편집 가능한 형태로 표시 */}
                    <div className={`${isDarkMode ? 'bg-gray-800 border-blue-400' : 'bg-white border-blue-500'} rounded-lg border-2 p-4`}>
                      {/* 편집 컨트롤 바 */}
                      <div className={`flex items-center justify-between mb-4 p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg`}>
                        <div className="flex items-center gap-3">
                          {/* 슬라이드 번호 표시 */}
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                            isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                          }`}>
                            <span className="text-xs font-semibold">{index + 1} / {slides.length}</span>
                          </div>
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
                                // 배경 타입에 따라 표시할 배경 결정
                                const finalBackgroundImage = (tempSlide.backgroundType === 'image' || !tempSlide.backgroundType)
                                  ? (tempSlide.backgroundSeed
                                      ? generatePicsumImage(
                                          aspectRatio.width,
                                          aspectRatio.height,
                                          tempSlide.backgroundSeed,
                                          tempSlide.backgroundBlur || 2,
                                          tempSlide.backgroundGrayscale || false
                                        )
                                      : tempSlide.backgroundImage)
                                  : undefined;

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
                                    tempSlide.themeOverlay || 0.3,
                                    tempSlide.backgroundType === 'color' ? tempSlide.backgroundColor : undefined,
                                    tempSlide.backgroundPattern,
                                    tempSlide.elements,
                                    'ppt' // 기본값
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

                      {/* 슬라이드 편집 영역 - 반응형 레이아웃 */}
                      <div className="flex flex-col lg:flex-row h-full gap-4">
                        {/* 슬라이드 편집 영역 - 모바일: 전체, 데스크톱: 70% */}
                        <div className="flex-1 lg:flex-[7] min-h-0">
                          <div
                            ref={containerRef}
                            data-slide-id={slide.id}
                            className="relative overflow-hidden bg-white cursor-crosshair"
                            style={{
                              ...getSlideContainerStyle(),
                              border: `${slideBorderStyle?.borderWidth || 1}px ${slideBorderStyle?.borderStyle || 'solid'} #3B82F6`,
                              borderRadius: `${slideBorderStyle?.borderRadius || 8}px`,
                              boxShadow: slideBorderStyle?.boxShadow || '0 2px 4px rgba(0,0,0,0.1)',
                            }}
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
                            {/* 기본 슬라이드 배경 - 실시간 업데이트 */}
                            <div
                              className="absolute inset-0 z-0"
                              style={{
                                background: (() => {
                                  // 배경 타입에 따른 처리
                                  if (tempSlide.backgroundType === 'color' && tempSlide.backgroundColor) {
                                    // 단색 배경
                                    return tempSlide.backgroundColor;
                                  } else if (tempSlide.backgroundType === 'image' && tempSlide.backgroundImage) {
                                    // 이미지 배경
                                    const themeHex = theme.primary.replace('#', '');
                                    const r = parseInt(themeHex.substr(0, 2), 16);
                                    const g = parseInt(themeHex.substr(2, 2), 16);
                                    const b = parseInt(themeHex.substr(4, 2), 16);
                                    const themeRgba = `rgba(${r}, ${g}, ${b}, ${tempSlide.themeOverlay || 0.3})`;
                                    return `linear-gradient(${themeRgba}, ${themeRgba}), url(${tempSlide.backgroundImage}) center/cover`;
                                  } else {
                                    // 기본 그라데이션
                                    return `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15)`;
                                  }
                                })(),
                                filter: (() => {
                                  let filters = [];
                                  if (tempSlide.backgroundImage && tempSlide.backgroundBlur) {
                                    filters.push(`blur(${tempSlide.backgroundBlur}px)`);
                                  }
                                  
                                  // 패턴 필터 적용
                                  if (tempSlide.backgroundPattern && tempSlide.backgroundPattern !== 'none') {
                                    switch (tempSlide.backgroundPattern) {
                                      case 'gaussian-blur':
                                        filters.push('blur(2px)');
                                        break;
                                      case 'motion-blur-horizontal':
                                        filters.push('blur(1px)');
                                        break;
                                      case 'motion-blur-vertical':
                                        filters.push('blur(1px)');
                                        break;
                                      case 'fisheye':
                                        filters.push('brightness(1.1) contrast(1.1)');
                                        break;
                                      case 'wide-angle':
                                        filters.push('brightness(0.9) contrast(1.2)');
                                        break;
                                    }
                                  }
                                  
                                  return filters.length > 0 ? filters.join(' ') : 'none';
                                })(),
                                // 패턴 오버레이
                                ...(tempSlide.backgroundPattern && tempSlide.backgroundPattern !== 'none' && {
                                  backgroundImage: (() => {
                                    switch (tempSlide.backgroundPattern) {
                                      case 'grid-small':
                                        return 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 9px), repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.1) 8px, rgba(0,0,0,0.1) 9px)';
                                      case 'grid-large':
                                        return 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 21px)';
                                      case 'grid-xlarge':
                                        return 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,0,0,0.1) 40px, rgba(0,0,0,0.1) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.1) 40px, rgba(0,0,0,0.1) 41px)';
                                      case 'lines-horizontal':
                                        return 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 11px)';
                                      case 'lines-vertical':
                                        return 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 11px)';
                                      case 'zigzag':
                                        return 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)';
                                      default:
                                        return 'none';
                                    }
                                  })(),
                                  backgroundBlendMode: 'overlay'
                                })
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
                                    className={`${tempSlide.titlePosition ? 'absolute' : layoutClasses.titleWidth} relative select-none ${
                                      selectedElementId === 'slide-title' 
                                        ? 'ring-2 ring-blue-500' 
                                        : 'hover:ring-1 hover:ring-blue-300'
                                    } cursor-pointer`}
                                    style={tempSlide.titlePosition ? {
                                      left: tempSlide.titlePosition.x,
                                      top: tempSlide.titlePosition.y,
                                      width: tempSlide.titlePosition.width,
                                      height: tempSlide.titlePosition.height,
                                      minWidth: '50px',
                                      minHeight: '30px',
                                    } : {}}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedElementId('slide-title');
                                    }}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      setEditingElement('slide-title');
                                    }}
                                    onMouseDown={(e) => {
                                      if (editingElement === 'slide-title') return; // 편집 중일 때는 드래그 방지
                                      handleMouseDown(e, 'slide-title', 'move');
                                    }}
                                  >
                                    {editingElement === 'slide-title' ? (
                                      <textarea
                                        value={tempSlide.title}
                                        onChange={(e) => handleSlideTextEdit('title', e.target.value)}
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
                                        className={`w-full resize-none border-2 border-blue-500 outline-none bg-white bg-opacity-90 rounded p-2 ${layoutClasses.titleSize} font-bold ${layoutClasses.titleAlign}`}
                                        style={{
                                          fontFamily: themeFont?.fontFamily || 'inherit',
                                          fontWeight: themeFont?.effects?.fontWeight || 'bold',
                                          letterSpacing: themeFont?.effects?.letterSpacing || 'normal',
                                          minHeight: '60px',
                                        }}
                                      />
                                    ) : (
                                      <h1
                                        className={`${tempSlide.titlePosition ? '' : layoutClasses.titleSize} font-bold ${tempSlide.titlePosition ? 'text-center' : layoutClasses.titleAlign} mb-4 outline-none cursor-pointer p-2 rounded transition-colors`}
                                        style={{
                                          fontSize: tempSlide.titlePosition ? `${tempSlide.titlePosition.fontSize || 24}px` : undefined,
                                          color: (() => {
                                            if (tempSlide.backgroundImage) {
                                              return '#FFFFFF'; // 배경 이미지가 있으면 흰색
                                            } else if (tempSlide.backgroundType === 'color' && tempSlide.backgroundColor) {
                                              // 배경색에 따라 대비가 좋은 색상 선택
                                              const bg = tempSlide.backgroundColor;
                                              if (bg.includes('gradient')) {
                                                return '#FFFFFF'; // 그라데이션은 보통 어두우므로 흰색
                                              } else {
                                                // 단색 배경의 밝기 계산
                                                const hex = bg.replace('#', '');
                                                const r = parseInt(hex.substr(0, 2), 16);
                                                const g = parseInt(hex.substr(2, 2), 16);
                                                const b = parseInt(hex.substr(4, 2), 16);
                                                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                                                return brightness > 128 ? '#000000' : '#FFFFFF';
                                              }
                                            } else {
                                              return theme.primary; // 기본 테마 색상
                                            }
                                          })(),
                                          textShadow: tempSlide.backgroundImage ? '2px 2px 4px rgba(0,0,0,0.8)' : (themeFont?.effects?.textShadow || 'none'),
                                          fontFamily: themeFont?.fontFamily || 'inherit',
                                          fontWeight: themeFont?.effects?.fontWeight || 'bold',
                                          letterSpacing: themeFont?.effects?.letterSpacing || 'normal',
                                          textStroke: themeFont?.effects?.textStroke || 'none',
                                          background: selectedElementId === 'slide-title' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {tempSlide.title || '제목을 입력하세요'}
                                      </h1>
                                    )}
                                    
                                    {/* 선택된 요소의 컨트롤 핸들 */}
                                    {selectedElementId === 'slide-title' && (
                                      <div className="absolute inset-0 pointer-events-none">
                                        {/* 편집 버튼 */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingElement('slide-title');
                                          }}
                                          className="absolute -top-3 -right-3 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors z-50 pointer-events-auto shadow-lg"
                                          title="편집"
                                        >
                                          <Type className="w-3 h-3" />
                                        </button>

                                        {/* 리사이즈 핸들 (우하단) */}
                                        <div
                                          className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize z-50 pointer-events-auto shadow-lg hover:bg-blue-600 transition-colors"
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleMouseDown(e, 'slide-title', 'resize');
                                          }}
                                          title="크기 조절"
                                        />

                                        {/* 이동 핸들 (중앙) */}
                                        <div
                                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-500 rounded-full cursor-move z-50 pointer-events-auto shadow-lg hover:bg-gray-600 transition-colors flex items-center justify-center opacity-80"
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleMouseDown(e, 'slide-title', 'move');
                                          }}
                                          title="이동하려면 드래그하세요"
                                        >
                                          <Move className="w-3 h-3 text-white" />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {layout !== 'title-only' && (
                                    <div
                                      className={`${tempSlide.contentPosition ? 'absolute' : layoutClasses.contentWidth} relative select-none ${
                                        selectedElementId === 'slide-content' 
                                          ? 'ring-2 ring-blue-500' 
                                          : 'hover:ring-1 hover:ring-blue-300'
                                      } cursor-pointer`}
                                      style={tempSlide.contentPosition ? {
                                        left: tempSlide.contentPosition.x,
                                        top: tempSlide.contentPosition.y,
                                        width: tempSlide.contentPosition.width,
                                        height: tempSlide.contentPosition.height,
                                        minWidth: '50px',
                                        minHeight: '30px',
                                      } : {}}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedElementId('slide-content');
                                      }}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingElement('slide-content');
                                      }}
                                      onMouseDown={(e) => {
                                        if (editingElement === 'slide-content') return; // 편집 중일 때는 드래그 방지
                                        handleMouseDown(e, 'slide-content', 'move');
                                      }}
                                    >
                                      {editingElement === 'slide-content' ? (
                                        <textarea
                                          value={tempSlide.content}
                                          onChange={(e) => handleSlideTextEdit('content', e.target.value)}
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
                                          className={`w-full resize-none border-2 border-blue-500 outline-none bg-white bg-opacity-90 rounded p-2 ${layoutClasses.contentSize} ${layoutClasses.contentAlign}`}
                                          style={{
                                            fontFamily: themeFont?.fontFamily || 'inherit',
                                            fontWeight: themeFont?.effects?.fontWeight || 'normal',
                                            letterSpacing: themeFont?.effects?.letterSpacing || 'normal',
                                            minHeight: '100px',
                                          }}
                                        />
                                      ) : (
                                        <div
                                          className={`${tempSlide.contentPosition ? 'text-center' : layoutClasses.contentSize} ${tempSlide.contentPosition ? '' : layoutClasses.contentAlign} outline-none cursor-pointer p-2 rounded transition-colors`}
                                          style={{
                                            fontSize: tempSlide.contentPosition ? `${tempSlide.contentPosition.fontSize || 16}px` : undefined,
                                            color: (() => {
                                              if (tempSlide.backgroundImage) {
                                                return '#F0F0F0'; // 배경 이미지가 있으면 밝은 회색
                                              } else if (tempSlide.backgroundType === 'color' && tempSlide.backgroundColor) {
                                                // 배경색에 따라 대비가 좋은 색상 선택
                                                const bg = tempSlide.backgroundColor;
                                                if (bg.includes('gradient')) {
                                                  return '#F0F0F0'; // 그라데이션은 보통 어두우므로 밝은 색
                                                } else {
                                                  // 단색 배경의 밝기 계산
                                                  const hex = bg.replace('#', '');
                                                  const r = parseInt(hex.substr(0, 2), 16);
                                                  const g = parseInt(hex.substr(2, 2), 16);
                                                  const b = parseInt(hex.substr(4, 2), 16);
                                                  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                                                  return brightness > 128 ? '#333333' : '#F0F0F0';
                                                }
                                              } else {
                                                return theme.secondary; // 기본 테마 색상
                                              }
                                            })(),
                                            textShadow: tempSlide.backgroundImage ? '1px 1px 2px rgba(0,0,0,0.7)' : (themeFont?.effects?.textShadow || 'none'),
                                            fontFamily: themeFont?.fontFamily || 'inherit',
                                            fontWeight: themeFont?.effects?.fontWeight || 'normal',
                                            letterSpacing: themeFont?.effects?.letterSpacing || 'normal',
                                            textStroke: themeFont?.effects?.textStroke || 'none',
                                            background: selectedElementId === 'slide-content' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            whiteSpace: 'pre-wrap',
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {tempSlide.content || '내용을 입력하세요'}
                                        </div>
                                      )}
                                      
                                      {/* 선택된 요소의 컨트롤 핸들 */}
                                      {selectedElementId === 'slide-content' && (
                                        <div className="absolute inset-0 pointer-events-none">
                                          {/* 편집 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingElement('slide-content');
                                            }}
                                            className="absolute -top-3 -right-3 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors z-50 pointer-events-auto shadow-lg"
                                            title="편집"
                                          >
                                            <Type className="w-3 h-3" />
                                          </button>

                                          {/* 리사이즈 핸들 (우하단) */}
                                          <div
                                            className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-500 rounded-full cursor-se-resize z-50 pointer-events-auto shadow-lg hover:bg-green-600 transition-colors"
                                            onMouseDown={(e) => {
                                              e.stopPropagation();
                                              handleMouseDown(e, 'slide-content', 'resize');
                                            }}
                                            title="크기 조절"
                                          />

                                          {/* 이동 핸들 (중앙) */}
                                          <div
                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-500 rounded-full cursor-move z-50 pointer-events-auto shadow-lg hover:bg-gray-600 transition-colors flex items-center justify-center opacity-80"
                                            onMouseDown={(e) => {
                                              e.stopPropagation();
                                              handleMouseDown(e, 'slide-content', 'move');
                                            }}
                                            title="이동하려면 드래그하세요"
                                          >
                                            <Move className="w-3 h-3 text-white" />
                                          </div>
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
                                className={`absolute group z-20 select-none ${
                                  selectedElementId === element.id 
                                    ? 'ring-2 ring-blue-500' 
                                    : 'hover:ring-1 hover:ring-blue-300'
                                }`}
                                style={{
                                  left: element.x,
                                  top: element.y,
                                  width: element.width,
                                  height: element.height,
                                  cursor: isDragging ? 'grabbing' : (selectedElementId === element.id ? 'grab' : 'pointer'),
                                  transform: `rotate(${element.rotation || 0}deg)`,
                                  transformOrigin: 'center center',
                                  backgroundColor: element.backgroundColor || 'transparent',
                                  border: `${element.borderWidth || 0}px solid ${element.borderColor || 'transparent'}`,
                                  zIndex: element.zIndex || 1,
                                  minWidth: '20px',
                                  minHeight: '20px',
                                  outline: selectedElementId === element.id ? '2px solid #3B82F6' : 'none',
                                  outlineOffset: '2px',
                                }}
                                onMouseDown={(e) => {
                                  if (editingElement === element.id) return; // 편집 중일 때는 드래그 방지
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
                                {/* 선택된 요소의 컨트롤 핸들 */}
                                {selectedElementId === element.id && (
                                  <div className="absolute inset-0 pointer-events-none">
                                    {/* 삭제 버튼 */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteElement(element.id);
                                      }}
                                      className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-50 pointer-events-auto shadow-lg"
                                      title="삭제"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>

                                    {/* 리사이즈 핸들 (우하단) */}
                                    <div
                                      className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize z-50 pointer-events-auto shadow-lg hover:bg-blue-600 transition-colors"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleMouseDown(e, element.id, 'resize');
                                      }}
                                      title="크기 조절"
                                    />

                                    {/* 회전 핸들 (상단 중앙) */}
                                    <div
                                      className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-green-500 rounded-full cursor-grab z-50 pointer-events-auto shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleRotationStart(e, element.id);
                                      }}
                                      title="회전하려면 드래그하세요"
                                    >
                                      <RotateCw className="w-3 h-3 text-white" />
                                    </div>

                                    {/* 이동 핸들 (중앙) */}
                                    <div
                                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-500 rounded-full cursor-move z-50 pointer-events-auto shadow-lg hover:bg-gray-600 transition-colors flex items-center justify-center opacity-80"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleMouseDown(e, element.id, 'move');
                                      }}
                                      title="이동하려면 드래그하세요"
                                    >
                                      <Move className="w-3 h-3 text-white" />
                                    </div>
                                  </div>
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
                                  <div className="w-full h-full relative">
                                    {element.content && element.content.length > 0 ? (
                                      element.content.startsWith('data:image') ? (
                                        <img
                                          src={element.content}
                                          alt="Slide element"
                                          className="w-full h-full object-cover rounded"
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

                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 컨트롤 패널 - 모바일: 하단, 데스크톱: 우측 30% */}
                        <div className="flex-1 lg:flex-[3] space-y-4 max-w-full lg:max-w-xs overflow-y-auto">
                          {/* 슬라이드 템플릿 선택 */}
                          <SlideTemplateSelector
                            currentTemplate={tempSlide.slideLayout || 'title-top-content-bottom'}
                            onTemplateChange={handleTemplateChange}
                            isDarkMode={isDarkMode}
                          />

                          {/* 요소 배치 버튼 */}
                          {selectedElementId && (
                            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} rounded-lg border p-3 space-y-3`}>
                              <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>요소 배치</h4>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => applyElementAlignment('left')}
                                  className={`flex-1 px-2 py-1 text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded`}
                                  title="좌측 정렬"
                                >
                                  <AlignLeft className="w-3 h-3 mx-auto" />
                                </button>
                                <button
                                  onClick={() => applyElementAlignment('center')}
                                  className={`flex-1 px-2 py-1 text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded`}
                                  title="가운데 정렬"
                                >
                                  <AlignCenter className="w-3 h-3 mx-auto" />
                                </button>
                                <button
                                  onClick={() => applyElementAlignment('right')}
                                  className={`flex-1 px-2 py-1 text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded`}
                                  title="우측 정렬"
                                >
                                  <AlignRight className="w-3 h-3 mx-auto" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 배경 이미지 컨트롤 */}
                          <BackgroundController
                            currentSeed={tempSlide.backgroundSeed || 'default'}
                            blur={tempSlide.backgroundBlur || 2}
                            grayscale={tempSlide.backgroundGrayscale || false}
                            width={aspectRatio.width}
                            height={aspectRatio.height}
                            backgroundType={tempSlide.backgroundType || 'image'}
                            currentPattern={tempSlide.backgroundPattern || 'none'}
                            previousSlideBackgroundSeed={(() => {
                              const currentIndex = slides.findIndex(s => s.id === activeSlideId);
                              if (currentIndex > 0) {
                                return slides[currentIndex - 1].backgroundSeed;
                              }
                              return undefined;
                            })()}
                            onSeedChange={handleBackgroundSeedChange}
                            onBlurChange={handleBackgroundBlurChange}
                            onGrayscaleChange={handleBackgroundGrayscaleChange}
                            onBackgroundTypeChange={(type) => {
                              if (!tempSlide) return;
                              const updatedSlide = {
                                ...tempSlide,
                                backgroundType: type
                              };
                              setTempSlide(updatedSlide);
                              setHasUnsavedChanges(true);
                            }}
                            onBackgroundChange={(background) => {
                              if (!tempSlide) return;
                              const updatedSlide = {
                                ...tempSlide,
                                backgroundColor: background,
                                // 배경 이미지는 보존하되 일시적으로 숨김
                                backgroundImage: tempSlide.backgroundImage,
                                backgroundSeed: tempSlide.backgroundSeed,
                                // 배경 타입 표시를 위한 플래그 추가
                                backgroundType: 'color'
                              };
                              setTempSlide(updatedSlide);
                              setHasUnsavedChanges(true);
                            }}
                            onPatternChange={(pattern) => {
                              if (!tempSlide) return;
                              const updatedSlide = {
                                ...tempSlide,
                                backgroundPattern: pattern === 'none' ? undefined : pattern
                              };
                              setTempSlide(updatedSlide);
                              setHasUnsavedChanges(true);
                            }}
                            isDarkMode={isDarkMode}
                          />

                          {/* 요소 추가 버튼 - 반응형 배치 */}
                          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} rounded-lg border p-3 space-y-3`}>
                            <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>요소 추가</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

                      {/* 선택된 요소의 속성 패널 - 반응형 */}
                      {selectedElement && (
                        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} rounded-lg border p-3 lg:p-4 space-y-3 lg:space-y-4 max-h-96 lg:max-h-none overflow-y-auto`}>
                          <div className="flex items-center justify-between">
                            <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                              {selectedElement.type === 'text' ? '📝 텍스트 속성' : '🖼️ 이미지 속성'}
                            </h4>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => deleteElement(selectedElement.id)}
                                className={`text-sm px-2 py-1 rounded ${isDarkMode ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:text-red-700 hover:bg-red-50'} transition-colors`}
                                title="요소 삭제"
                              >
                                🗑️
                              </button>
                              <button
                                onClick={() => setSelectedElementId(undefined)}
                                className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                title="속성 패널 닫기"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* 우선순위 조절 */}
                          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}>
                            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>우선순위 (z-index)</label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateElement(selectedElement.id, { zIndex: Math.max(1, (selectedElement.zIndex || 1) - 1) })}
                                className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                title="뒤로 보내기"
                              >
                                ↓
                              </button>
                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} min-w-8 text-center`}>
                                {selectedElement.zIndex || 1}
                              </span>
                              <button
                                onClick={() => updateElement(selectedElement.id, { zIndex: (selectedElement.zIndex || 1) + 1 })}
                                className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                title="앞으로 가져오기"
                              >
                                ↑
                              </button>
                            </div>
                          </div>

                          {selectedElement.type === 'text' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
                                {/* 글자 크기 */}
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>크기</label>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="range"
                                      min="12"
                                      max="72"
                                      value={selectedElement.fontSize}
                                      onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                                      className="flex-1"
                                    />
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} w-8`}>{selectedElement.fontSize}</span>
                                  </div>
                                </div>

                                {/* 글꼴 */}
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>글꼴</label>
                                  <select
                                    value={selectedElement.fontFamily}
                                    onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                                    className={`w-full px-1 py-1 border rounded text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  >
                                    {FONT_FAMILIES.map((font) => (
                                      <option key={font} value={font}>
                                        {font.includes(',') ? font.split(',')[0] : font}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* 글자 색상 */}
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>색상</label>
                                  <input
                                    type="color"
                                    value={selectedElement.color}
                                    onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                    className={`w-full h-6 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                  />
                                </div>
                              </div>

                              {/* 텍스트 정렬 및 굵기 */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>굵기</label>
                                  <select
                                    value={selectedElement.fontWeight}
                                    onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value })}
                                    className={`w-full px-1 py-1 border rounded text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  >
                                    <option value="normal">보통</option>
                                    <option value="bold">굵게</option>
                                    <option value="bolder">더 굵게</option>
                                  </select>
                                </div>

                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>정렬</label>
                                  <div className="flex gap-1">
                                    {(['left', 'center', 'right'] as const).map((align) => (
                                      <button
                                        key={align}
                                        onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                                        className={`p-1 rounded text-xs ${
                                          selectedElement.textAlign === align
                                            ? 'bg-blue-500 text-white'
                                            : isDarkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
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
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>X</label>
                                  <input
                                    type="number"
                                    value={Math.round(selectedElement.x)}
                                    onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                                    className={`w-full px-1 py-1 border rounded text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Y</label>
                                  <input
                                    type="number"
                                    value={Math.round(selectedElement.y)}
                                    onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                                    className={`w-full px-1 py-1 border rounded text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>너비</label>
                                  <input
                                    type="number"
                                    value={Math.round(selectedElement.width)}
                                    onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 50 })}
                                    className={`w-full px-1 py-1 border rounded text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>높이</label>
                                  <input
                                    type="number"
                                    value={Math.round(selectedElement.height)}
                                    onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 30 })}
                                    className={`w-full px-1 py-1 border rounded text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  />
                                </div>
                              </div>

                              {/* 회전 */}
                              <div>
                                <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>회전 ({Math.round(selectedElement.rotation || 0)}°)</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={selectedElement.rotation || 0}
                                    onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                                    className="flex-1"
                                  />
                                  <button
                                    onClick={() => updateElement(selectedElement.id, { rotation: 0 })}
                                    className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    title="회전 초기화"
                                  >
                                    초기화
                                  </button>
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
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>X</label>
                                  <input
                                    type="number"
                                    value={Math.round(selectedElement.x)}
                                    onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                                    className={`w-full px-1 py-1 border rounded text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Y</label>
                                  <input
                                    type="number"
                                    value={Math.round(selectedElement.y)}
                                    onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                                    className={`w-full px-1 py-1 border rounded text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>너비</label>
                                  <input
                                    type="number"
                                    value={Math.round(selectedElement.width)}
                                    onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 50 })}
                                    className={`w-full px-1 py-1 border rounded text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>높이</label>
                                  <input
                                    type="number"
                                    value={Math.round(selectedElement.height)}
                                    onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 30 })}
                                    className={`w-full px-1 py-1 border rounded text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  />
                                </div>
                              </div>

                              {/* 회전 */}
                              <div>
                                <label className={`block text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>회전 ({Math.round(selectedElement.rotation || 0)}°)</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={selectedElement.rotation || 0}
                                    onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                                    className="flex-1"
                                  />
                                  <button
                                    onClick={() => updateElement(selectedElement.id, { rotation: 0 })}
                                    className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    title="회전 초기화"
                                  >
                                    초기화
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {index < slides.length - 1 && (
              <div className="flex justify-center py-4">
                <div className="relative">
                  {/* Decorative line */}
                  <div className={`absolute top-1/2 left-0 right-0 h-px ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  } transform -translate-y-1/2`}></div>
                  
                  {/* Add button */}
                  <button
                    onClick={() => onAddSlide(index)}
                    className={`group relative flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-full transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600 hover:border-blue-500' 
                        : 'bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-300 hover:border-blue-300 shadow-sm hover:shadow-md'
                    } hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  >
                    <Plus className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
                    <span className="hidden sm:inline">{t.addSlideHere}</span>
                  </button>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
        
        {/* 최하단 슬라이드 추가 버튼 */}
        {slides.length > 0 && (
          <div className="flex justify-center py-6">
            <button
              onClick={() => onAddSlide()}
              className={`group flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/25' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-green-500/25'
              } hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              {t.addSlide}
            </button>
          </div>
        )}
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