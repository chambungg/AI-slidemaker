import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Slide, Theme, AspectRatio, SlideElement } from '../types';
import { SlidePreview } from './SlidePreview';
import { TRANSLATIONS, FONT_FAMILIES, ANIMATION_EFFECTS } from '../constants';
import { generateSlideHTML } from '../utils/slideGenerator';
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

interface SlidesContainerProps {
  slides: Slide[];
  activeSlideId: string | null;
  activeTab: 'preview' | 'code';
  language: 'ko' | 'en';
  theme: Theme;
  aspectRatio: AspectRatio;
  onTabChange: (tab: 'preview' | 'code') => void;
  onSlideSelect: (slideId: string) => void;
  onSlideDelete: (slideId: string) => void;
  onAddSlide: (afterIndex?: number) => void;
  onSlideUpdate: (slide: Slide) => void;
}

export const SlidesContainer: React.FC<SlidesContainerProps> = ({
  slides,
  activeSlideId,
  activeTab,
  language,
  theme,
  aspectRatio,
  onTabChange,
  onSlideSelect,
  onSlideDelete,
  onAddSlide,
  onSlideUpdate,
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tempSlide, setTempSlide] = useState<Slide | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];

  const activeSlide = slides.find(slide => slide.id === activeSlideId);

  // Initialize tempSlide when activeSlide changes
  useEffect(() => {
    if (activeSlide) {
      setTempSlide(activeSlide);
      setHasUnsavedChanges(false);
      setSelectedElementId(undefined);
      setEditingElement(null);
    }
  }, [activeSlide]);

  const updateElement = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (!tempSlide) return;
    
    const updatedElements = (tempSlide.elements || []).map(element =>
      element.id === elementId ? { ...element, ...updates } : element
    );

    setTempSlide(prev => prev ? {
      ...prev,
      elements: updatedElements,
    } : null);
    setHasUnsavedChanges(true);
  }, [tempSlide]);

  const addNewElement = (type: 'text' | 'image' = 'text') => {
    if (!tempSlide) return;
    
    const newElement: SlideElement = {
      id: `element-${Date.now()}`,
      type,
      content: type === 'text' ? '새 텍스트를 입력하세요' : '',
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 50 : 100,
      fontSize: 16,
      fontFamily: 'Inter, system-ui, sans-serif',
      color: theme.secondary,
      fontWeight: 'normal',
      textAlign: 'left',
      animation: ANIMATION_EFFECTS[0],
      zIndex: 1,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      rotation: 0,
    };

    setTempSlide(prev => prev ? {
      ...prev,
      elements: [...(prev.elements || []), newElement],
    } : null);
    setHasUnsavedChanges(true);
    setSelectedElementId(newElement.id);
    
    // 텍스트 요소인 경우 즉시 편집 모드로 전환
    if (type === 'text') {
      setTimeout(() => {
        setEditingElement(newElement.id);
      }, 100);
    }
  };

  const deleteElement = (elementId: string) => {
    if (!tempSlide) return;
    
    setTempSlide(prev => prev ? {
      ...prev,
      elements: (prev.elements || []).filter(el => el.id !== elementId),
    } : null);
    setHasUnsavedChanges(true);
    if (selectedElementId === elementId) {
      setSelectedElementId(undefined);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string, action: 'move' | 'resize' = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!tempSlide || !containerRef.current) return;
    const element = tempSlide.elements?.find(el => el.id === elementId);
    if (!element) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    if (action === 'move') {
      setIsDragging(true);
      setDragOffset({
        x: relativeX - element.x,
        y: relativeY - element.y,
      });
    } else {
      setIsResizing(true);
      setDragOffset({
        x: relativeX - element.x - element.width,
        y: relativeY - element.y - element.height,
      });
    }
    
    setSelectedElementId(elementId);
    setEditingElement(null);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!selectedElementId || !containerRef.current || !tempSlide) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    if (isDragging) {
      const x = Math.max(0, Math.min(rect.width - 50, relativeX - dragOffset.x));
      const y = Math.max(0, Math.min(rect.height - 30, relativeY - dragOffset.y));
      updateElement(selectedElementId, { x, y });
    } else if (isResizing) {
      const element = tempSlide.elements?.find(el => el.id === selectedElementId);
      if (element) {
        const width = Math.max(50, relativeX - element.x);
        const height = Math.max(30, relativeY - element.y);
        updateElement(selectedElementId, { width, height });
      }
    }
  }, [isDragging, isResizing, selectedElementId, dragOffset, updateElement, tempSlide]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isDragging ? 'move' : 'nw-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

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
    fileInputRef.current?.click();
    fileInputRef.current!.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          if (elementId) {
            updateElement(elementId, { content: imageUrl });
          } else {
            // 새 이미지 요소 생성
            const newElement: SlideElement = {
              id: `element-${Date.now()}`,
              type: 'image',
              content: imageUrl,
              x: 100,
              y: 100,
              width: 150,
              height: 100,
              fontSize: 16,
              fontFamily: 'Inter, system-ui, sans-serif',
              color: theme.secondary,
              fontWeight: 'normal',
              textAlign: 'left',
              animation: ANIMATION_EFFECTS[0],
              zIndex: 1,
              backgroundColor: 'transparent',
              borderColor: 'transparent',
              borderWidth: 0,
              rotation: 0,
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
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const newElement: SlideElement = {
          id: `element-${Date.now()}`,
          type: 'image',
          content: imageUrl,
          x: Math.max(0, x - 75),
          y: Math.max(0, y - 50),
          width: 150,
          height: 100,
          fontSize: 16,
          fontFamily: 'Inter, system-ui, sans-serif',
          color: theme.secondary,
          fontWeight: 'normal',
          textAlign: 'left',
          animation: ANIMATION_EFFECTS[0],
          zIndex: 1,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
          rotation: 0,
        };

        setTempSlide(prev => prev ? {
          ...prev,
          elements: [...(prev.elements || []), newElement],
        } : null);
        setHasUnsavedChanges(true);
        setSelectedElementId(newElement.id);
      };
      reader.readAsDataURL(imageFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleApplyChanges = () => {
    if (!tempSlide) return;
    
    const updatedSlide = {
      ...tempSlide,
      htmlContent: generateSlideHTML(
        tempSlide.title,
        tempSlide.content,
        theme,
        aspectRatio,
        tempSlide.order,
        undefined,
        undefined,
        tempSlide.template || 'title-center',
        tempSlide.backgroundImage,
        tempSlide.backgroundBlur || 2,
        tempSlide.themeOverlay || 0.3
      ),
    };
    
    onSlideUpdate(updatedSlide);
    setHasUnsavedChanges(false);
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
        <h2 className="text-lg font-semibold text-gray-800">
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
                  onDelete={() => onSlideDelete(slide.id)}
                  isActive={false}
                  onClick={() => onSlideSelect(slide.id)}
                  containerStyle={getSlideContainerStyle()}
                />
              ) : (
                /* 선택된 슬라이드는 직접 편집 가능한 형태로 표시 */
                tempSlide && (
                  <div className="bg-white rounded-lg border-2 border-blue-500 p-4">
                    {/* 편집 컨트롤 바 */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addNewElement('text')}
                          className="flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          텍스트 추가
                        </button>
                        <button
                          onClick={() => handleImageUpload()}
                          className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          <ImageIcon className="w-4 h-4" />
                          이미지 추가
                        </button>
                        
                        {/* 배치 템플릿 버튼들 */}
                        <div className="flex items-center gap-1 ml-4">
                          <span className="text-xs text-gray-600">배치:</span>
                          <button
                            onClick={() => applyLayoutTemplate('left')}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                            title="좌측 정렬"
                          >
                            <AlignLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => applyLayoutTemplate('center')}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                            title="가운데 정렬"
                          >
                            <AlignCenter className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => applyLayoutTemplate('right')}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                            title="우측 정렬"
                          >
                            <AlignRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasUnsavedChanges && (
                          <button
                            onClick={handleApplyChanges}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors animate-pulse"
                          >
                            <Save className="w-4 h-4" />
                            변경사항 적용
                          </button>
                        )}

                        {!hasUnsavedChanges && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg">
                            <Check className="w-4 h-4" />
                            저장됨
                          </div>
                        )}
                        
                        <button
                          onClick={() => onSlideSelect('')}
                          className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          편집 완료
                        </button>
                      </div>
                    </div>

                    {/* 직접 편집 영역 */}
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
                            ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${tempSlide.backgroundImage}) center/cover`
                            : `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15)`,
                          filter: tempSlide.backgroundImage ? `blur(${tempSlide.backgroundBlur || 2}px)` : 'none',
                        }}
                      />

                      {/* 기본 슬라이드 텍스트 (편집 가능) */}
                      <div className="absolute inset-0 z-10 p-8 flex flex-col justify-center items-center">
                        <h1
                          contentEditable
                          suppressContentEditableWarning
                          className="text-4xl font-bold text-center mb-4 outline-none cursor-text hover:bg-blue-100 hover:bg-opacity-50 p-2 rounded transition-colors"
                          style={{
                            color: tempSlide.backgroundImage ? '#FFFFFF' : theme.primary,
                            textShadow: tempSlide.backgroundImage ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                          }}
                          onBlur={(e) => handleSlideTextEdit('title', e.target.textContent || '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tempSlide.title}
                        </h1>
                        
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          className="text-lg text-center outline-none cursor-text hover:bg-green-100 hover:bg-opacity-50 p-2 rounded transition-colors"
                          style={{
                            color: tempSlide.backgroundImage ? '#F0F0F0' : theme.secondary,
                            textShadow: tempSlide.backgroundImage ? '1px 1px 2px rgba(0,0,0,0.7)' : 'none',
                          }}
                          onBlur={(e) => handleSlideTextEdit('content', e.target.textContent || '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tempSlide.content}
                        </div>
                      </div>

                      {/* 추가된 요소들 */}
                      {tempSlide.elements?.map((element) => (
                        <div
                          key={element.id}
                          className={`absolute group z-20 ${
                            selectedElementId === element.id ? 'ring-2 ring-blue-500' : ''
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
                          }}
                          onMouseDown={(e) => handleMouseDown(e, element.id, 'move')}
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
                                className="w-full h-full resize-none border-none outline-none bg-transparent"
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
                                }}
                              >
                                {element.content || '텍스트를 입력하세요'}
                              </div>
                            )
                          ) : (
                            <div className="w-full h-full relative">
                              {element.content ? (
                                <img
                                  src={element.content}
                                  alt="Slide element"
                                  className="w-full h-full object-cover rounded"
                                  style={{
                                    border: selectedElementId === element.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                                  }}
                                />
                              ) : (
                                <div 
                                  className="w-full h-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
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
                                className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-nw-resize hover:bg-blue-600 z-30 shadow-lg"
                                onMouseDown={(e) => handleMouseDown(e, element.id, 'resize')}
                              />
                            </>
                          )}
                        </div>
                      ))}

                      {/* 드롭 존 안내 */}
                      <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white bg-opacity-80 px-2 py-1 rounded pointer-events-none">
                        💡 텍스트를 더블클릭해서 편집하거나 이미지를 드래그해서 추가하세요
                      </div>
                    </div>

                    {/* 선택된 요소의 속성 패널 */}
                    {selectedElement && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg border space-y-4">
                        <h4 className="font-semibold text-gray-800">
                          {selectedElement.type === 'text' ? '📝 텍스트 속성' : '🖼️ 이미지 속성'}
                        </h4>
                        
                        {selectedElement.type === 'text' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              {/* 글자 크기 */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  글자 크기
                                </label>
                                <input
                                  type="range"
                                  min="12"
                                  max="72"
                                  value={selectedElement.fontSize}
                                  onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                                  className="w-full"
                                />
                                <span className="text-xs text-gray-500">{selectedElement.fontSize}px</span>
                              </div>

                              {/* 글꼴 */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  글꼴
                                </label>
                                <select
                                  value={selectedElement.fontFamily}
                                  onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  글자 색상
                                </label>
                                <input
                                  type="color"
                                  value={selectedElement.color}
                                  onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                  className="w-full h-8 border border-gray-300 rounded"
                                />
                              </div>

                              {/* 글자 굵기 */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  글자 굵기
                                </label>
                                <select
                                  value={selectedElement.fontWeight}
                                  onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="normal">보통</option>
                                  <option value="bold">굵게</option>
                                  <option value="bolder">더 굵게</option>
                                </select>
                              </div>
                            </div>

                            {/* 텍스트 정렬 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                정렬
                              </label>
                              <div className="flex gap-2">
                                {(['left', 'center', 'right'] as const).map((align) => (
                                  <button
                                    key={align}
                                    onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                                    className={`p-2 rounded ${
                                      selectedElement.textAlign === align
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 hover:bg-gray-300'
                                    }`}
                                  >
                                    {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                    {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                    {align === 'right' && <AlignRight className="w-4 h-4" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {selectedElement.type === 'image' && (
                          <div className="space-y-3">
                            <button
                              onClick={() => handleImageUpload(selectedElement.id)}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              이미지 변경
                            </button>
                          </div>
                        )}

                        {/* 객체 속성 */}
                        <div className="border-t pt-4">
                          <h5 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                            <Square className="w-4 h-4" />
                            객체 속성
                          </h5>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {/* 배경색 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                배경색
                              </label>
                              <input
                                type="color"
                                value={selectedElement.backgroundColor || '#ffffff'}
                                onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                                className="w-full h-8 border border-gray-300 rounded"
                              />
                            </div>

                            {/* 테두리 색상 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                테두리 색상
                              </label>
                              <input
                                type="color"
                                value={selectedElement.borderColor || '#000000'}
                                onChange={(e) => updateElement(selectedElement.id, { borderColor: e.target.value })}
                                className="w-full h-8 border border-gray-300 rounded"
                              />
                            </div>

                            {/* 테두리 두께 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                테두리 두께
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="10"
                                value={selectedElement.borderWidth || 0}
                                onChange={(e) => updateElement(selectedElement.id, { borderWidth: parseInt(e.target.value) })}
                                className="w-full"
                              />
                              <span className="text-xs text-gray-500">{selectedElement.borderWidth || 0}px</span>
                            </div>

                            {/* 회전 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                <RotateCw className="w-3 h-3 inline mr-1" />
                                회전
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="360"
                                value={selectedElement.rotation || 0}
                                onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                                className="w-full"
                              />
                              <span className="text-xs text-gray-500">{selectedElement.rotation || 0}°</span>
                            </div>

                            {/* Z-Index */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                우선순위
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={selectedElement.zIndex || 1}
                                onChange={(e) => updateElement(selectedElement.id, { zIndex: parseInt(e.target.value) || 1 })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 위치 및 크기 */}
                        <div className="border-t pt-4">
                          <h5 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                            <Move className="w-4 h-4" />
                            위치 및 크기
                          </h5>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
                              <input
                                type="number"
                                value={Math.round(selectedElement.x)}
                                onChange={(e) => updateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
                              <input
                                type="number"
                                value={Math.round(selectedElement.y)}
                                onChange={(e) => updateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">너비</label>
                              <input
                                type="number"
                                value={Math.round(selectedElement.width)}
                                onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 50 })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">높이</label>
                              <input
                                type="number"
                                value={Math.round(selectedElement.height)}
                                onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 30 })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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