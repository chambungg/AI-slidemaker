import React, { useState, useEffect } from 'react';
import { Loader, FileText, Sparkles, CheckCircle } from 'lucide-react';

interface LoadingAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
  isDarkMode?: boolean;
}

interface LoadingStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  duration: number;
}

const loadingSteps: LoadingStep[] = [
  {
    id: 'analyzing',
    label: 'AI가 콘텐츠를 분석하고 있습니다...',
    icon: <Sparkles className="w-5 h-5" />,
    duration: 1500
  },
  {
    id: 'generating',
    label: '슬라이드를 생성하고 있습니다...',
    icon: <FileText className="w-5 h-5" />,
    duration: 2000
  },
  {
    id: 'optimizing',
    label: '레이아웃을 최적화하고 있습니다...',
    icon: <Loader className="w-5 h-5 animate-spin" />,
    duration: 1000
  }
];

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  isVisible,
  onComplete,
  isDarkMode = false
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isVisible) {
      setCurrentStepIndex(0);
      setCompletedSteps(new Set());
      return;
    }

    let stepTimer: NodeJS.Timeout;
    let completionTimer: NodeJS.Timeout;

    const advanceStep = () => {
      if (currentStepIndex < loadingSteps.length - 1) {
        setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
        setCurrentStepIndex(prev => prev + 1);
        
        stepTimer = setTimeout(advanceStep, loadingSteps[currentStepIndex + 1]?.duration || 1000);
      } else {
        setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
        completionTimer = setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    };

    stepTimer = setTimeout(advanceStep, loadingSteps[currentStepIndex].duration);

    return () => {
      if (stepTimer) {clearTimeout(stepTimer);}
      if (completionTimer) {clearTimeout(completionTimer);}
    };
  }, [isVisible, currentStepIndex, onComplete]);

  if (!isVisible) {return null;}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} rounded-lg border p-8 max-w-md mx-4 shadow-2xl`}>
        <div className="text-center space-y-6">
          {/* Main loading spinner */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="space-y-4">
            <div className="flex justify-center space-x-2">
              {loadingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    completedSteps.has(index)
                      ? 'bg-green-500'
                      : index === currentStepIndex
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Current step */}
            <div className="space-y-3">
              {loadingSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-3 transition-all duration-300 ${
                    index === currentStepIndex
                      ? 'opacity-100 scale-100'
                      : completedSteps.has(index)
                      ? 'opacity-60 scale-95'
                      : 'opacity-30 scale-90'
                  }`}
                >
                  <div className={`flex-shrink-0 ${
                    completedSteps.has(index)
                      ? 'text-green-500'
                      : index === currentStepIndex
                      ? 'text-blue-500'
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {completedSteps.has(index) ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Loading dots */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};