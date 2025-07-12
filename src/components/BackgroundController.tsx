import React, { useState, useEffect } from 'react';
import { Shuffle, Image as ImageIcon, Loader } from 'lucide-react';
import { generatePicsumImage, getRandomSeed } from '../utils/imageSearch';

interface BackgroundControllerProps {
  currentSeed: string;
  blur: number;
  grayscale: boolean;
  width: number;
  height: number;
  backgroundType?: 'image' | 'color';
  previousSlideBackgroundSeed?: string; // 이전 슬라이드 배경 시드
  currentPattern?: string; // 현재 선택된 패턴
  onSeedChange: (seed: string) => void;
  onBlurChange: (blur: number) => void;
  onGrayscaleChange: (grayscale: boolean) => void;
  onBackgroundChange?: (background: string) => void;
  onPatternChange?: (pattern: string) => void;
  onBackgroundTypeChange?: (type: 'image' | 'color') => void;
  isDarkMode?: boolean;
}

export const BackgroundController: React.FC<BackgroundControllerProps> = ({
  currentSeed,
  blur,
  grayscale,
  width,
  height,
  backgroundType = 'image',
  previousSlideBackgroundSeed,
  currentPattern = 'none',
  onSeedChange,
  onBlurChange,
  onGrayscaleChange,
  onBackgroundChange,
  onPatternChange,
  onBackgroundTypeChange,
  isDarkMode = false,
}) => {
  // 후보 이미지들을 고정하기 위한 상태
  const [candidateSeeds, setCandidateSeeds] = useState<string[]>([]);
  // 이미지 로딩 상태 관리
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});
  const [currentImageLoading, setCurrentImageLoading] = useState(false);
  // 이미지 에러 상태 관리
  const [errorImages, setErrorImages] = useState<{ [key: string]: boolean }>({});
  const [currentImageError, setCurrentImageError] = useState(false);

  // currentSeed가 변경될 때만 후보 이미지들 재생성
  useEffect(() => {
    const baseSeed = currentSeed.split('-alt-')[0]; // -alt- 접미사 제거
    const newCandidates = Array.from({ length: 5 }, (_, i) => `${baseSeed}-alt-${i + 1}`);
    setCandidateSeeds(newCandidates);
    
    // 새로운 후보들에 대한 로딩 상태 초기화
    const initialLoadingState: { [key: string]: boolean } = {};
    newCandidates.forEach(seed => {
      initialLoadingState[seed] = true;
    });
    setLoadingImages(initialLoadingState);
    setCurrentImageLoading(true);
    
    // 에러 상태도 초기화
    setErrorImages({});
    setCurrentImageError(false);
  }, [currentSeed.split('-alt-')[0]]); // 메인 시드가 변경될 때만

  const handleRandomImage = () => {
    const randomSeed = getRandomSeed();
    onSeedChange(randomSeed);
  };

  const currentImageUrl = generatePicsumImage(width, height, currentSeed, blur, grayscale);

  // 이미지 로딩 완료 핸들러
  const handleImageLoad = (seed: string) => {
    setLoadingImages(prev => ({ ...prev, [seed]: false }));
    setErrorImages(prev => ({ ...prev, [seed]: false }));
  };

  const handleCurrentImageLoad = () => {
    setCurrentImageLoading(false);
    setCurrentImageError(false);
  };

  // 이미지 에러 핸들러
  const handleImageError = (seed: string) => {
    setLoadingImages(prev => ({ ...prev, [seed]: false }));
    setErrorImages(prev => ({ ...prev, [seed]: true }));
  };

  const handleCurrentImageError = () => {
    setCurrentImageLoading(false);
    setCurrentImageError(true);
  };

  // 이미지 재로드 핸들러
  const handleImageReload = (seed: string) => {
    setLoadingImages(prev => ({ ...prev, [seed]: true }));
    setErrorImages(prev => ({ ...prev, [seed]: false }));
    // 이미지 강제 새로고침을 위해 timestamp 추가
    const img = new Image();
    img.onload = () => handleImageLoad(seed);
    img.onerror = () => handleImageError(seed);
    // Issue #10 fix: Change thumbnail size to 150x150
    img.src = `${generatePicsumImage(150, 150, seed, blur, grayscale)}?t=${Date.now()}`;
  };

  const handleCurrentImageReload = () => {
    setCurrentImageLoading(true);
    setCurrentImageError(false);
    // 메인 이미지 강제 새로고침
    const img = new Image();
    img.onload = () => handleCurrentImageLoad();
    img.onerror = () => handleCurrentImageError();
    img.src = `${currentImageUrl}?t=${Date.now()}`;
  };

  // 그라데이션 배경 옵션들
  const gradientBackgrounds = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];

  // 단색 배경 옵션들
  const solidBackgrounds = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#74B9FF', '#FD79A8', '#FDCB6E', '#A29BFE'
  ];

  // 패턴과 필터 옵션들
  const patterns = [
    { name: '없음', value: 'none' },
    { name: '좁은 격자', value: 'grid-small' },
    { name: '넓은 격자', value: 'grid-large' },
    { name: '매우 넓은 격자', value: 'grid-xlarge' },
    { name: '가로줄', value: 'lines-horizontal' },
    { name: '세로줄', value: 'lines-vertical' },
    { name: '큰 물결', value: 'wave-large' },
    { name: '가느다란 물결', value: 'wave-small' },
    { name: '원형 프랙탈', value: 'circle-fractal' },
    { name: '글래스모픽', value: 'glassmorphic' },
    { name: '모자이크', value: 'mosaic' },
    { name: '디지털 모자이크', value: 'digital-mosaic' },
    { name: '물방울', value: 'water-drops' },
    { name: '무지개', value: 'rainbow' },
    { name: '가우시안 블러', value: 'gaussian-blur' },
    { name: '모션 블러(가로)', value: 'motion-blur-horizontal' },
    { name: '모션 블러(세로)', value: 'motion-blur-vertical' },
    { name: '지그재그', value: 'zigzag' },
    { name: '어안 왜곡', value: 'fisheye' },
    { name: '광각 왜곡', value: 'wide-angle' }
  ];

  return (
    <div className={`rounded-lg border p-3 space-y-3 transition-colors ${
      isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        <h4 className={`text-sm font-semibold flex items-center gap-2 ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          <ImageIcon className="w-4 h-4" />
          배경 설정
        </h4>
        
        {/* 랜덤 이미지 버튼 */}
        {backgroundType === 'image' && (
          <button
            onClick={handleRandomImage}
            className={`p-1 rounded transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="랜덤 이미지"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 배경 타입 토글 버튼 */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <button
          onClick={() => onBackgroundTypeChange && onBackgroundTypeChange('image')}
          className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            backgroundType === 'image'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          이미지
        </button>
        <button
          onClick={() => onBackgroundTypeChange && onBackgroundTypeChange('color')}
          className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            backgroundType === 'color'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          단색/그라데이션
        </button>
      </div>

      {/* 이미지 관련 컨트롤들 */}
      {backgroundType === 'image' && (
        <>
          {/* 이미지 미리보기 - 현재/이전 슬라이드 비교 */}
          <div className="relative">
            {currentImageLoading && (
              <div className="absolute inset-0 bg-gray-200 rounded border flex items-center justify-center z-10">
                <Loader className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}
            <div className="flex h-20 rounded border overflow-hidden">
              {/* 현재 슬라이드 이미지 (왼쪽 절반) */}
              <div className="flex-1 relative">
                {currentImageError ? (
                  <div className="w-full h-full bg-red-100 flex flex-col items-center justify-center">
                    <span className="text-red-500 text-xs mb-1">로드 실패</span>
                    <button
                      onClick={handleCurrentImageReload}
                      className="text-red-600 text-xs underline hover:text-red-800"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : (
                  <>
                    <img
                      src={currentImageUrl}
                      alt="Current slide background"
                      className="w-full h-full object-cover"
                      onLoad={handleCurrentImageLoad}
                      onError={handleCurrentImageError}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">현재</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* 이전 슬라이드 이미지 (오른쪽 절반) - 클릭 가능 */}
              <div className="flex-1 relative border-l">
                {previousSlideBackgroundSeed ? (
                  <button
                    onClick={() => onSeedChange(previousSlideBackgroundSeed)}
                    className="w-full h-full relative hover:border-blue-300 transition-colors"
                    title="이전 슬라이드 배경 적용"
                  >
                    <img
                      src={generatePicsumImage(width, height, previousSlideBackgroundSeed, blur, grayscale)}
                      alt="Previous slide background"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-medium">이전</span>
                    </div>
                  </button>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">첫 슬라이드</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 후보 이미지들 - 고정된 시드 사용 */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-gray-600">다른 이미지 후보</h5>
            <div className="grid grid-cols-5 gap-1">
              {candidateSeeds.map((candidateSeed, index) => {
                // Issue #10 fix: Change thumbnail size to 150x150
                const candidateUrl = generatePicsumImage(150, 150, candidateSeed, blur, grayscale);
                const isLoading = loadingImages[candidateSeed];
                const hasError = errorImages[candidateSeed];
                
                return (
                  <button
                    key={candidateSeed}
                    onClick={() => hasError ? handleImageReload(candidateSeed) : onSeedChange(candidateSeed)}
                    className="relative aspect-square rounded overflow-hidden border hover:border-blue-300 transition-colors"
                    title={hasError ? `이미지 다시 로드` : `후보 이미지 ${index + 1}`}
                  >
                    {isLoading && (
                      <div className="absolute inset-0 bg-gray-200 rounded flex items-center justify-center z-10">
                        <Loader className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {hasError ? (
                      <div className="w-full h-full bg-red-100 flex flex-col items-center justify-center text-red-500">
                        <span className="text-xs mb-1">오류</span>
                        <span className="text-xs">↻</span>
                      </div>
                    ) : (
                      <>
                        <img
                          src={candidateUrl}
                          alt={`Candidate ${index + 1}`}
                          className="w-full h-full object-cover"
                          onLoad={() => handleImageLoad(candidateSeed)}
                          onError={() => handleImageError(candidateSeed)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-10 hover:bg-opacity-0 transition-opacity" />
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 이미지 전용 컨트롤 옵션 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 블러 조절 */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                블러 효과: {blur === 0 ? '없음' : blur}
              </label>
              <input
                type="range"
                min="0"
                max="3"
                value={blur}
                onChange={(e) => onBlurChange(parseInt(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                }`}
              />
            </div>

            {/* 그레이스케일 토글 */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                그레이스케일
              </label>
              <div className="flex items-center">
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
            </div>
          </div>

          {/* Issue #11 fix: Hide seed display */}
        </>
      )}

      {/* 컬러 배경 옵션 */}
      {backgroundType === 'color' && (
        <div className="space-y-2">
          <h5 className={`text-xs font-medium ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>그라데이션/단색 배경</h5>
          
          {/* 그라데이션 배경 */}
          <div className="grid grid-cols-10 gap-1">
            {gradientBackgrounds.map((gradient, index) => (
              <button
                key={`gradient-${index}`}
                onClick={() => onBackgroundChange && onBackgroundChange(gradient)}
                className="aspect-square rounded border hover:border-blue-300 transition-colors"
                style={{ background: gradient }}
                title={`그라데이션 ${index + 1}`}
              />
            ))}
          </div>
          
          {/* 단색 배경 */}
          <div className="grid grid-cols-10 gap-1">
            {solidBackgrounds.map((color, index) => (
              <button
                key={`solid-${index}`}
                onClick={() => onBackgroundChange && onBackgroundChange(color)}
                className="aspect-square rounded border hover:border-blue-300 transition-colors"
                style={{ backgroundColor: color }}
                title={`단색 ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 패턴/필터 선택 */}
      <div>
        <label className={`block text-xs font-medium mb-1 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          패턴/필터
        </label>
        <select
          value={currentPattern}
          onChange={(e) => onPatternChange && onPatternChange(e.target.value)}
          className={`w-full px-2 py-1 border rounded text-xs ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          {patterns.map((pattern) => (
            <option key={pattern.value} value={pattern.value}>
              {pattern.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}; 