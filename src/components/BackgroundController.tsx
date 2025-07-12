import React, { useState, useEffect } from 'react';
import { Shuffle, Image as ImageIcon, Loader } from 'lucide-react';
import { generatePicsumImage, getRandomSeed } from '../utils/imageSearch';

interface BackgroundControllerProps {
  currentSeed: string;
  blur: number;
  grayscale: boolean;
  width: number;
  height: number;
  onSeedChange: (seed: string) => void;
  onBlurChange: (blur: number) => void;
  onGrayscaleChange: (grayscale: boolean) => void;
  onBackgroundChange?: (background: string) => void;
  onPatternChange?: (pattern: string) => void;
  isDarkMode?: boolean;
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
  onBackgroundChange,
  onPatternChange,
  isDarkMode = false,
}) => {
  // 후보 이미지들을 고정하기 위한 상태
  const [candidateSeeds, setCandidateSeeds] = useState<string[]>([]);
  // 이미지 로딩 상태 관리
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});
  const [currentImageLoading, setCurrentImageLoading] = useState(false);

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
  }, [currentSeed.split('-alt-')[0]]); // 메인 시드가 변경될 때만

  const handleRandomImage = () => {
    const randomSeed = getRandomSeed();
    onSeedChange(randomSeed);
  };

  const currentImageUrl = generatePicsumImage(width, height, currentSeed, blur, grayscale);

  // 이미지 로딩 완료 핸들러
  const handleImageLoad = (seed: string) => {
    setLoadingImages(prev => ({ ...prev, [seed]: false }));
  };

  const handleCurrentImageLoad = () => {
    setCurrentImageLoading(false);
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
          배경 이미지
        </h4>
        
        {/* 랜덤 이미지 버튼 */}
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
      </div>

      {/* 이미지 미리보기 */}
      <div className="relative">
        {currentImageLoading && (
          <div className="absolute inset-0 bg-gray-200 rounded border flex items-center justify-center z-10">
            <Loader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        <img
          src={currentImageUrl}
          alt="Background preview"
          className="w-full h-20 object-cover rounded border"
          onLoad={handleCurrentImageLoad}
          onError={handleCurrentImageLoad}
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
            const isLoading = loadingImages[candidateSeed];
            
            return (
              <button
                key={candidateSeed}
                onClick={() => onSeedChange(candidateSeed)}
                className="relative aspect-square rounded overflow-hidden border hover:border-blue-300 transition-colors"
                title={`후보 이미지 ${index + 1}`}
              >
                {isLoading && (
                  <div className="absolute inset-0 bg-gray-200 rounded flex items-center justify-center z-10">
                    <Loader className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                <img
                  src={candidateUrl}
                  alt={`Candidate ${index + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={() => handleImageLoad(candidateSeed)}
                  onError={() => handleImageLoad(candidateSeed)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-10 hover:bg-opacity-0 transition-opacity" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 컬러 배경 옵션 */}
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

      {/* 컨트롤 옵션 - 2열 배치 */}
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

      {/* 패턴/필터 선택 */}
      <div>
        <label className={`block text-xs font-medium mb-1 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          패턴/필터
        </label>
        <select
          onChange={(e) => onPatternChange && onPatternChange(e.target.value)}
          className={`w-full px-2 py-1 border rounded text-xs ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
          defaultValue="none"
        >
          {patterns.map((pattern) => (
            <option key={pattern.value} value={pattern.value}>
              {pattern.name}
            </option>
          ))}
        </select>
      </div>

      {/* 시드 정보 (개발용) */}
      <div className={`text-xs truncate ${
        isDarkMode ? 'text-gray-500' : 'text-gray-400'
      }`}>
        시드: {currentSeed}
      </div>
    </div>
  );
}; 