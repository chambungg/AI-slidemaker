import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  startDelay?: number;
  children?: React.ReactNode;
}

export const TypingEffect: React.FC<TypingEffectProps> = ({
  text,
  speed = 50,
  onComplete,
  className = '',
  startDelay = 0,
  children
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);

    const timer = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(timer);
  }, [text, speed, startDelay, onComplete]);

  return (
    <span className={className}>
      <span dangerouslySetInnerHTML={{ __html: displayedText }} />
      {!isComplete && <span className="animate-pulse">|</span>}
      {children}
    </span>
  );
};

interface StaggeredTypingEffectProps {
  items: string[];
  itemDelay?: number;
  typingSpeed?: number;
  onComplete?: () => void;
  className?: string;
  itemClassName?: string;
}

export const StaggeredTypingEffect: React.FC<StaggeredTypingEffectProps> = ({
  items,
  itemDelay = 500,
  typingSpeed = 50,
  onComplete,
  className = '',
  itemClassName = ''
}) => {
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleItems(prev => {
        if (prev < items.length) {
          return prev + 1;
        }
        return prev;
      });
    }, itemDelay);

    return () => clearInterval(timer);
  }, [items.length, itemDelay]);

  useEffect(() => {
    if (completedItems.size === items.length && items.length > 0) {
      onComplete?.();
    }
  }, [completedItems.size, items.length, onComplete]);

  const handleItemComplete = (index: number) => {
    setCompletedItems(prev => new Set([...prev, index]));
  };

  return (
    <div className={className}>
      {items.slice(0, visibleItems).map((item, index) => (
        <div key={index} className={itemClassName}>
          <TypingEffect
            text={item}
            speed={typingSpeed}
            onComplete={() => handleItemComplete(index)}
          />
        </div>
      ))}
    </div>
  );
};