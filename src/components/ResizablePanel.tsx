import React, { useState, useRef, useCallback } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  position?: 'left' | 'right';
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultWidth = 400,
  minWidth = 200,
  maxWidth = 1200,
  className = '',
  position = 'left',
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = position === 'left' 
      ? e.clientX - startXRef.current 
      : startXRef.current - e.clientX;
    
    const newWidth = startWidthRef.current + deltaX;
    
    // 생성된 슬라이드 쪽 최소 가로폭을 절반으로 설정
    const effectiveMinWidth = position === 'left' ? minWidth : Math.max(minWidth, 200);
    const effectiveMaxWidth = Math.min(maxWidth, window.innerWidth * 0.9);
    
    if (newWidth >= effectiveMinWidth && newWidth <= effectiveMaxWidth) {
      setWidth(newWidth);
    }
  }, [isResizing, minWidth, maxWidth, position]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handlePosition = position === 'left' ? 'right-0' : 'left-0';
  const hoverHandle = position === 'left' ? 'translate-x-1/2' : '-translate-x-1/2';

  return (
    <div
      ref={panelRef}
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Resize handle - 더 크고 눈에 잘 보이게 */}
      <div
        className={`absolute top-0 ${handlePosition} w-3 h-full cursor-col-resize group z-20`}
        onMouseDown={handleMouseDown}
      >
        <div className={`w-full h-full ${isResizing ? 'bg-blue-500' : 'bg-transparent group-hover:bg-blue-300'} transition-colors`} />
        <div className={`absolute top-1/2 ${handlePosition} transform ${hoverHandle} -translate-y-1/2 w-6 h-20 bg-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg`}>
          <div className="w-1 h-12 bg-white rounded-full"></div>
        </div>
      </div>
    </div>
  );
};