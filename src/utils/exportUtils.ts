import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Slide, AspectRatio } from '../types';

export const exportToPDF = async (slides: Slide[], aspectRatio: AspectRatio) => {
  // 새 창에서 PDF 생성 처리
  const newWindow = window.open('', '_blank');
  if (!newWindow) {
    alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
    return;
  }

  newWindow.document.write(`
    <html>
      <head>
        <title>PDF 생성 중...</title>
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
          <h2>PDF 생성 중...</h2>
          <p>잠시만 기다려주세요.</p>
        </div>
      </body>
    </html>
  `);

  try {
    // PDF 설정
    const pdfWidth = 297;
    const pdfHeight = (pdfWidth * aspectRatio.height) / aspectRatio.width;
    
    const pdf = new jsPDF({
      orientation: aspectRatio.width > aspectRatio.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });

    for (let i = 0; i < slides.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      // 진행률 업데이트
      newWindow.document.body.innerHTML = `
        <div class="container">
          <div class="spinner"></div>
          <h2>PDF 생성 중...</h2>
          <p>슬라이드 ${i + 1}/${slides.length} 처리 중</p>
          <div style="width: 100%; background: #ddd; border-radius: 10px; margin-top: 1rem;">
            <div style="width: ${((i + 1) / slides.length) * 100}%; height: 20px; background: #3498db; border-radius: 10px; transition: width 0.3s;"></div>
          </div>
        </div>
      `;

      try {
        // 기존 로직과 동일
        const slideElement = document.querySelector(`[data-slide-id="${slides[i].id}"]`) as HTMLElement;
        
        if (slideElement) {
          const canvas = await html2canvas(slideElement, {
            width: slideElement.offsetWidth,
            height: slideElement.offsetHeight,
            scale: 2, // 스케일 줄여서 속도 향상
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false,
            imageTimeout: 10000,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        } else {
          // 폴백 처리
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = slides[i].htmlContent;
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.width = '1000px';
          tempDiv.style.height = `${(1000 * aspectRatio.height) / aspectRatio.width}px`;
          tempDiv.style.backgroundColor = '#ffffff';
          document.body.appendChild(tempDiv);

          const canvas = await html2canvas(tempDiv, {
            width: 1000,
            height: (1000 * aspectRatio.height) / aspectRatio.width,
            scale: 1.5,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false,
          });

          document.body.removeChild(tempDiv);
          const imgData = canvas.toDataURL('image/jpeg', 0.8);
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }
      } catch (slideError) {
        // Slide processing error handled without logging
        pdf.setFontSize(24);
        pdf.text(slides[i].title, 20, 30);
        pdf.setFontSize(14);
        const contentLines = pdf.splitTextToSize(slides[i].content, pdfWidth - 40);
        pdf.text(contentLines, 20, 50);
      }
    }

    // 완료 후 다운로드
    newWindow.document.body.innerHTML = `
      <div class="container">
        <h2>✅ PDF 생성 완료!</h2>
        <p>다운로드가 시작됩니다...</p>
        <button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">창 닫기</button>
      </div>
    `;

    pdf.save('presentation.pdf');
    
    // 3초 후 창 자동 닫기
    setTimeout(() => {
      newWindow.close();
    }, 3000);

  } catch (error) {
    // PDF export error handled without logging
    newWindow.document.body.innerHTML = `
      <div class="container">
        <h2>❌ 오류 발생</h2>
        <p>PDF 생성 중 오류가 발생했습니다.</p>
        <button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">창 닫기</button>
      </div>
    `;
  }
};

export const exportToHTML = (slides: Slide[], aspectRatio: AspectRatio) => {
  // 사용자에게 이미지 포함 옵션 제공
  const includeImages = window.confirm(
    '이미지를 HTML 파일에 포함시키겠습니까?\n\n' +
    '✅ 예: HTML 파일에 이미지가 BASE64로 포함됩니다 (파일 크기 증가)\n' +
    '❌ 아니오: HTML 파일만 내보냅니다 (이미지는 별도 링크)'
  );

  if (includeImages) {
    exportToHTMLWithImages(slides, aspectRatio);
  } else {
    exportToHTMLBasic(slides, aspectRatio);
  }
};

const exportToHTMLBasic = (slides: Slide[], aspectRatio: AspectRatio) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 생성 프레젠테이션</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #f5f5f5;
            line-height: 1.6;
        }
        .slide {
            margin: 2rem auto;
            max-width: 1200px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border-radius: 16px;
            overflow: hidden;
            background: white;
        }
        .slide-content {
            aspect-ratio: ${aspectRatio.width}/${aspectRatio.height};
            width: 100%;
        }
        @media print {
            body { background: white; padding: 0; }
            .slide {
                page-break-after: always;
                margin: 0;
                max-width: none;
                box-shadow: none;
                border-radius: 0;
            }
        }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .slide { margin: 1rem auto; }
        }
    </style>
</head>
<body>
    <h1 style="text-align: center; color: #333; margin-bottom: 2rem;">AI 생성 프레젠테이션</h1>
    ${slides.map((slide, index) => `
        <div class="slide">
            <div class="slide-content">
                ${slide.htmlContent}
            </div>
        </div>
    `).join('')}
    
    <div style="text-align: center; margin-top: 2rem; color: #666; font-size: 0.9rem;">
        <p>총 ${slides.length}개 슬라이드 | AI 슬라이드 생성기로 제작</p>
    </div>
</body>
</html>
  `;

  downloadHTMLFile(htmlContent, 'ai-presentation.html');
};

const exportToHTMLWithImages = async (slides: Slide[], aspectRatio: AspectRatio) => {
  try {
    // 모든 이미지를 BASE64로 변환
    const processedSlides = await Promise.all(slides.map(async (slide) => {
      let processedContent = slide.htmlContent;
      
      // 배경 이미지 처리
      if (slide.backgroundImage && !slide.backgroundImage.startsWith('data:')) {
        try {
          const base64Image = await imageToBase64(slide.backgroundImage);
          processedContent = processedContent.replace(
            new RegExp(slide.backgroundImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            base64Image
          );
        } catch (error) {
          // Background image conversion failed silently
        }
      }
      
      // 요소 내 이미지 처리
      if (slide.elements) {
        for (const element of slide.elements) {
          if (element.type === 'image' && element.content && !element.content.startsWith('data:')) {
            try {
              const base64Image = await imageToBase64(element.content);
              processedContent = processedContent.replace(
                new RegExp(element.content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                base64Image
              );
            } catch (error) {
              // Element image conversion failed silently
            }
          }
        }
      }
      
      return { ...slide, htmlContent: processedContent };
    }));

    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 생성 프레젠테이션 (이미지 포함)</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #f5f5f5;
            line-height: 1.6;
        }
        .slide {
            margin: 2rem auto;
            max-width: 1200px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border-radius: 16px;
            overflow: hidden;
            background: white;
        }
        .slide-content {
            aspect-ratio: ${aspectRatio.width}/${aspectRatio.height};
            width: 100%;
        }
        @media print {
            body { background: white; padding: 0; }
            .slide {
                page-break-after: always;
                margin: 0;
                max-width: none;
                box-shadow: none;
                border-radius: 0;
            }
        }
        @media (max-width: 768px) {
            body { padding: 10px; }
            .slide { margin: 1rem auto; }
        }
    </style>
</head>
<body>
    <h1 style="text-align: center; color: #333; margin-bottom: 2rem;">AI 생성 프레젠테이션</h1>
    ${processedSlides.map((slide, index) => `
        <div class="slide">
            <div class="slide-content">
                ${slide.htmlContent}
            </div>
        </div>
    `).join('')}
    
    <div style="text-align: center; margin-top: 2rem; color: #666; font-size: 0.9rem;">
        <p>총 ${slides.length}개 슬라이드 | AI 슬라이드 생성기로 제작 (이미지 포함)</p>
    </div>
</body>
</html>
    `;

    downloadHTMLFile(htmlContent, 'ai-presentation-with-images.html');
  } catch (error) {
    // HTML export with images error handled silently
    alert('이미지 포함 내보내기 중 오류가 발생했습니다. 기본 HTML로 내보냅니다.');
    exportToHTMLBasic(slides, aspectRatio);
  }
};

const imageToBase64 = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx?.drawImage(img, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = imageUrl;
  });
};

const downloadHTMLFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};