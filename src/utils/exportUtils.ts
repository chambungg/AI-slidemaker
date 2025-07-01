import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Slide, AspectRatio } from '../types';

export const exportToPDF = async (slides: Slide[], aspectRatio: AspectRatio) => {
  try {
    // PDF 설정 - 실제 슬라이드 비율에 맞춰 설정함
    const pdfWidth = 297; // A4 가로 (mm)
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

      try {
        // 실제 화면에 표시된 슬라이드 요소를 찾아서 캡처함
        const slideElement = document.querySelector(`[data-slide-id="${slides[i].id}"]`) as HTMLElement;
        
        if (slideElement) {
          // 실제 화면의 슬라이드를 고해상도로 캡처함
          const canvas = await html2canvas(slideElement, {
            width: slideElement.offsetWidth,
            height: slideElement.offsetHeight,
            scale: 3, // 고해상도 스케일
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false,
            imageTimeout: 15000,
            removeContainer: false,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        } else {
          // 폴백, HTML 콘텐츠로 임시 요소 생성함
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = slides[i].htmlContent;
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.width = '1200px';
          tempDiv.style.height = `${(1200 * aspectRatio.height) / aspectRatio.width}px`;
          tempDiv.style.backgroundColor = '#ffffff';
          tempDiv.style.fontFamily = 'Arial, sans-serif';
          document.body.appendChild(tempDiv);

          const canvas = await html2canvas(tempDiv, {
            width: 1200,
            height: (1200 * aspectRatio.height) / aspectRatio.width,
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false,
          });

          document.body.removeChild(tempDiv);

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }
      } catch (slideError) {
        console.error(`Error processing slide ${i + 1}:`, slideError);
        
        // 에러 발생 시 기본 텍스트로 대체함
        pdf.setFontSize(24);
        pdf.setTextColor(0, 0, 0);
        pdf.text(slides[i].title, 20, 30);
        
        pdf.setFontSize(14);
        const contentLines = pdf.splitTextToSize(slides[i].content, pdfWidth - 40);
        pdf.text(contentLines, 20, 50);
      }
    }

    pdf.save('presentation.pdf');
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    alert('PDF 내보내기 중 오류가 발생했습니다. 다시 시도해주세요.');
  }
};

export const exportToHTML = (slides: Slide[], aspectRatio: AspectRatio) => {
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

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai-presentation.html';
  a.click();
  URL.revokeObjectURL(url);
};