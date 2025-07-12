import React, { useState } from 'react';
import { Slide, AspectRatio } from '../types';
import { exportToPDF, exportToHTML } from '../utils/exportUtils';
import { 
  FileText, 
  Globe, 
  Archive, 
  AlignLeft,
  X,
  Loader
} from 'lucide-react';

interface ExportModalProps {
  slides: Slide[];
  aspectRatio: AspectRatio;
  language: 'ko' | 'en';
  isDarkMode?: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  slides,
  aspectRatio,
  language,
  isDarkMode = false,
  onClose
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string>('');

  const translations = {
    ko: {
      title: '내보내기',
      subtitle: '원하는 형식을 선택하세요',
      pdf: 'PDF로 내보내기',
      pdfDesc: '모든 슬라이드를 PDF 파일로 내보냅니다',
      html: 'HTML로 내보내기',
      htmlDesc: '웹 페이지 형태로 내보냅니다',
      allImages: '전체 이미지 내보내기',
      allImagesDesc: '모든 슬라이드를 이미지 파일로 내보냅니다',
      zipImages: '개별 이미지 (ZIP)',
      zipImagesDesc: '각 슬라이드를 개별 이미지로 압축 파일에 담습니다',
      longImage: '연결된 긴 이미지',
      longImageDesc: '모든 슬라이드를 세로로 연결한 하나의 긴 이미지',
      close: '닫기',
      exporting: '내보내는 중...'
    },
    en: {
      title: 'Export',
      subtitle: 'Choose your preferred format',
      pdf: 'Export as PDF',
      pdfDesc: 'Export all slides as a PDF file',
      html: 'Export as HTML',
      htmlDesc: 'Export as a web page',
      allImages: 'Export All Images',
      allImagesDesc: 'Export all slides as image files',
      zipImages: 'Individual Images (ZIP)',
      zipImagesDesc: 'Package each slide as individual images in a ZIP file',
      longImage: 'Long Connected Image',
      longImageDesc: 'Create one long vertical image with all slides connected',
      close: 'Close',
      exporting: 'Exporting...'
    }
  };

  const t = translations[language];

  const handleExport = async (type: string) => {
    setIsExporting(true);
    setExportType(type);

    try {
      switch (type) {
        case 'pdf':
          await exportToPDF(slides, aspectRatio);
          break;
        case 'html':
          exportToHTML(slides, aspectRatio);
          break;
        case 'zip-images':
          await exportAllImagesAsZip();
          break;
        case 'long-image':
          await exportAsLongImage();
          break;
      }
    } catch {
      // Export error handled silently
      alert('내보내기 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  };

  const exportAllImagesAsZip = async () => {
    // 새 창에서 ZIP 생성 처리
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    newWindow.document.write(`
      <html>
        <head>
          <title>이미지 ZIP 생성 중...</title>
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
            .progress-bar {
              width: 100%;
              height: 20px;
              background: #ddd;
              border-radius: 10px;
              margin-top: 1rem;
              overflow: hidden;
            }
            .progress-fill {
              height: 100%;
              background: #3498db;
              border-radius: 10px;
              transition: width 0.3s;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2>이미지 ZIP 파일 생성 중...</h2>
            <p id="status">준비 중...</p>
            <div class="progress-bar">
              <div class="progress-fill" id="progress" style="width: 0%"></div>
            </div>
          </div>
        </body>
      </html>
    `);

    try {
      const JSZip = (await import('jszip')).default;
      const html2canvas = (await import('html2canvas')).default;
      const zip = new JSZip();

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const progress = ((i + 1) / slides.length) * 100;
        
        // 진행률 업데이트
        newWindow.document.getElementById('status')!.textContent = `슬라이드 ${i + 1}/${slides.length} 처리 중...`;
        newWindow.document.getElementById('progress')!.style.width = `${progress}%`;

        const slideElement = document.querySelector(`[data-slide-id="${slide.id}"]`) as HTMLElement;
        
        let canvas;
        if (slideElement) {
          canvas = await html2canvas(slideElement, {
            width: slideElement.offsetWidth,
            height: slideElement.offsetHeight,
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

        // Canvas를 base64로 변환하여 ZIP에 추가
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, base64Data, { base64: true });
      }

      // ZIP 파일 생성 및 다운로드
      newWindow.document.getElementById('status')!.textContent = 'ZIP 파일 생성 중...';
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      newWindow.document.body.innerHTML = `
        <div class="container">
          <h2>✅ ZIP 파일 생성 완료!</h2>
          <p>다운로드가 시작됩니다...</p>
          <button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">창 닫기</button>
        </div>
      `;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'slides-images.zip';
      link.click();
      URL.revokeObjectURL(link.href);

      // 3초 후 창 자동 닫기
      setTimeout(() => {
        newWindow.close();
      }, 3000);

    } catch {
      // ZIP generation error handled silently
      newWindow.document.body.innerHTML = `
        <div class="container">
          <h2>❌ 오류 발생</h2>
          <p>ZIP 파일 생성 중 오류가 발생했습니다.</p>
          <button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">창 닫기</button>
        </div>
      `;
    }
  };

  const exportAsLongImage = async () => {
    // 새 창에서 긴 이미지 생성 처리
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    newWindow.document.write(`
      <html>
        <head>
          <title>긴 이미지 생성 중...</title>
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
            <h2>긴 이미지 생성 중...</h2>
            <p>모든 슬라이드를 연결하여 하나의 긴 이미지를 만들고 있습니다...</p>
          </div>
        </body>
      </html>
    `);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const slideWidth = 800;
      const slideHeight = (800 * aspectRatio.height) / aspectRatio.width;
      const spacing = 20; // 슬라이드 간 간격
      
      // 전체 캔버스 생성
      const totalHeight = (slideHeight * slides.length) + (spacing * (slides.length - 1));
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = slideWidth;
      finalCanvas.height = totalHeight;
      const ctx = finalCanvas.getContext('2d')!;
      
      // 배경색 설정
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slideWidth, totalHeight);

      // 각 슬라이드를 캔버스에 그리기
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const yPosition = i * (slideHeight + spacing);
        
        const slideElement = document.querySelector(`[data-slide-id="${slide.id}"]`) as HTMLElement;
        
        let canvas;
        if (slideElement) {
          canvas = await html2canvas(slideElement, {
            width: slideElement.offsetWidth,
            height: slideElement.offsetHeight,
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
          tempDiv.style.width = `${slideWidth}px`;
          tempDiv.style.height = `${slideHeight}px`;
          document.body.appendChild(tempDiv);

          canvas = await html2canvas(tempDiv, {
            width: slideWidth,
            height: slideHeight,
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
          });

          document.body.removeChild(tempDiv);
        }

        // 슬라이드를 메인 캔버스에 그리기
        ctx.drawImage(canvas, 0, yPosition, slideWidth, slideHeight);
      }

      // 완료 후 다운로드
      newWindow.document.body.innerHTML = `
        <div class="container">
          <h2>✅ 긴 이미지 생성 완료!</h2>
          <p>다운로드가 시작됩니다...</p>
          <button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">창 닫기</button>
        </div>
      `;

      const link = document.createElement('a');
      link.download = 'slides-long-image.png';
      link.href = finalCanvas.toDataURL('image/png');
      link.click();

      // 3초 후 창 자동 닫기
      setTimeout(() => {
        newWindow.close();
      }, 3000);

    } catch {
      // Long image generation error handled silently
      newWindow.document.body.innerHTML = `
        <div class="container">
          <h2>❌ 오류 발생</h2>
          <p>긴 이미지 생성 중 오류가 발생했습니다.</p>
          <button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">창 닫기</button>
        </div>
      `;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-2xl rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t.title}
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            disabled={isExporting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* PDF Export */}
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              isExporting && exportType === 'pdf'
                ? 'border-blue-500 bg-blue-50'
                : isDarkMode
                  ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {isExporting && exportType === 'pdf' ? (
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <FileText className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              )}
              <div>
                <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t.pdf}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t.pdfDesc}
                </p>
              </div>
            </div>
          </button>

          {/* HTML Export */}
          <button
            onClick={() => handleExport('html')}
            disabled={isExporting}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              isExporting && exportType === 'html'
                ? 'border-blue-500 bg-blue-50'
                : isDarkMode
                  ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {isExporting && exportType === 'html' ? (
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <Globe className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              )}
              <div>
                <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t.html}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t.htmlDesc}
                </p>
              </div>
            </div>
          </button>

          {/* All Images Section */}
          <div className={`p-4 rounded-lg border ${
            isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
          }`}>
            <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t.allImages}
            </h3>
            <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t.allImagesDesc}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* ZIP Images */}
              <button
                onClick={() => handleExport('zip-images')}
                disabled={isExporting}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isExporting && exportType === 'zip-images'
                    ? 'border-blue-500 bg-blue-50'
                    : isDarkMode
                      ? 'border-gray-500 hover:border-gray-400 hover:bg-gray-600'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isExporting && exportType === 'zip-images' ? (
                    <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
                    <Archive className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  )}
                  <div>
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t.zipImages}
                    </h4>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t.zipImagesDesc}
                    </p>
                  </div>
                </div>
              </button>

              {/* Long Image */}
              <button
                onClick={() => handleExport('long-image')}
                disabled={isExporting}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isExporting && exportType === 'long-image'
                    ? 'border-blue-500 bg-blue-50'
                    : isDarkMode
                      ? 'border-gray-500 hover:border-gray-400 hover:bg-gray-600'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isExporting && exportType === 'long-image' ? (
                    <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
                    <AlignLeft className={`w-4 h-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                  )}
                  <div>
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t.longImage}
                    </h4>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t.longImageDesc}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end p-6 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            disabled={isExporting}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};