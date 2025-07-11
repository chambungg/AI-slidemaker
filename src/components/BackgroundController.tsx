import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Shuffle, Image as ImageIcon } from 'lucide-react';
import { generatePicsumImage, getNextSeed, getPreviousSeed, getRandomSeed } from '../utils/imageSearch';

interface BackgroundControllerProps {
  currentSeed: string;
  blur: number;
  grayscale: boolean;
  width: number;
  height: number;
  onSeedChange: (seed: string) => void;
  onBlurChange: (blur: number) => void;
  onGrayscaleChange: (grayscale: boolean) => void;
}

export const BackgroundController: React.FC<BackgroundControllerProps> = ({
  currentSeed,
  blur,
  grayscale,
  width,
  height,
  onSeedChange,
  onBlurChange,
  onGrayscaleChange,
}) => {
  // 후보 이미지들을 고정하기 위한 상태
  const [candidateSeeds, setCandidateSeeds] = useState<string[]>([]);

  // currentSeed가 변경될 때만 후보 이미지들 재생성
  useEffect(() => {
    const baseSeed = currentSeed.split('-alt-')[0]; // -alt- 접미사 제거
    const newCandidates = Array.from({ length: 5 }, (_, i) => `${baseSeed}-alt-${i + 1}`);
    setCandidateSeeds(newCandidates);
  }, [currentSeed.split('-alt-')[0]]); // 메인 시드가 변경될 때만

  const handlePreviousImage = () => {
    const prevSeed = getPreviousSeed(currentSeed);
    onSeedChange(prevSeed);
  };

  const handleNextImage = () => {
    const nextSeed = getNextSeed(currentSeed);
    onSeedChange(nextSeed);
  };

  const handleRandomImage = () => {
    const randomSeed = getRandomSeed();
    onSeedChange(randomSeed);
  };

  const currentImageUrl = generatePicsumImage(width, height, currentSeed, blur, grayscale);

  return (
    <div className="bg-white rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          배경 이미지
        </h4>
        
        {/* 이미지 네비게이션 버튼 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePreviousImage}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="이전 이미지"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={handleRandomImage}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="랜덤 이미지"
          >
            <Shuffle className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={handleNextImage}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="다음 이미지"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 이미지 미리보기 */}
      <div className="relative">
        <img
          src={currentImageUrl}
          alt="Background preview"
          className="w-full h-20 object-cover rounded border"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded flex items-center justify-center">
          <span className="text-white text-xs font-medium">현재 이미지</span>
        </div>
      </div>

      {/* 후보 이미지들 - 고정된 시드 사용 */}
      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-600">다른 이미지 후보</h5>
        <div className="grid grid-cols-5 gap-1">
          {candidateSeeds.map((candidateSeed, index) => {
            const candidateUrl = generatePicsumImage(width, height, candidateSeed, blur, grayscale);
            
            return (
              <button
                key={candidateSeed}
                onClick={() => onSeedChange(candidateSeed)}
                className="relative aspect-square rounded overflow-hidden border hover:border-blue-300 transition-colors"
                title={`후보 이미지 ${index + 1}`}
              >
                <img
                  src={candidateUrl}
                  alt={`Candidate ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-10 hover:bg-opacity-0 transition-opacity" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 컨트롤 옵션 */}
      <div className="space-y-2">
        {/* 블러 조절 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            블러 효과: {blur === 0 ? '없음' : blur}
          </label>
          <input
            type="range"
            min="0"
            max="3"
            value={blur}
            onChange={(e) => onBlurChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* 그레이스케일 토글 */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-600">
            그레이스케일
          </label>
          <button
            onClick={() => onGrayscaleChange(!grayscale)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              grayscale ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                grayscale ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* 시드 정보 (개발용) */}
        <div className="text-xs text-gray-400 truncate">
          시드: {currentSeed}
        </div>
      </div>
    </div>
  );
}; 