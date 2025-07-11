import React from 'react';
import { ArrowUp, ArrowDown, Move } from 'lucide-react';

export interface SlideOrderControllerProps {
  slideIndex: number;
  totalSlides: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const SlideOrderController: React.FC<SlideOrderControllerProps> = ({
  slideIndex,
  totalSlides,
  onMoveUp,
  onMoveDown,
}) => {
  const isFirst = slideIndex === 0;
  const isLast = slideIndex === totalSlides - 1;

  return (
    <div className="flex items-center gap-1">
      <Move className="w-3 h-3 text-gray-400" />
      <button
        onClick={onMoveUp}
        disabled={isFirst}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="위로 이동"
      >
        <ArrowUp className="w-3 h-3 text-gray-600" />
      </button>
      <button
        onClick={onMoveDown}
        disabled={isLast}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="아래로 이동"
      >
        <ArrowDown className="w-3 h-3 text-gray-600" />
      </button>
    </div>
  );
}; 