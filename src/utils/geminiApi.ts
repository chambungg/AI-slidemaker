export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }
// 제미나이 2.0 플래시
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data: GeminiResponse = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
};

//이하 제미나이 프롬프트 설정
export const generateSlidesWithGemini = async (
  content: string,
  apiKey: string,
  language: 'ko' | 'en',
  slideType: 'card-news' | 'ppt' | 'image-card' = 'ppt'
): Promise<Array<{ title: string; content: string; subtitle?: string; bulletPoints?: string[] }>> => {
  const languageInstruction = language === 'ko' 
    ? '한국어로 응답해주세요.' 
    : 'Please respond in English.';

  const getSlideTypeInstruction = () => {
    switch (slideType) {
      case 'card-news':
        return language === 'ko' 
          ? '카드뉴스 형태로 만들어주세요. 각 슬라이드는 매우 짧고 요약된 문구 위주로, 같은 글씨 크기로 작성해주세요. 한 슬라이드당 최대 20단어 이내로 제한하세요.'
          : 'Create in card news format. Each slide should have very short and summarized phrases with consistent font size. Limit to maximum 20 words per slide.';
      case 'image-card':
        return language === 'ko'
          ? '이미지카드 형태로 만들어주세요. 각 슬라이드에는 관련 이미지가 배치되고, 그 이미지에 알맞는 간결한 메시지를 표시하세요. 한 슬라이드당 최대 30단어 이내로 제한하세요.'
          : 'Create in image card format. Each slide should have a relevant image with a concise message that fits the image. Limit to maximum 30 words per slide.';
      case 'ppt':
      default:
        return language === 'ko'
          ? '일반적인 PPT 프레젠테이션 형태로 만들어주세요. 각 슬라이드는 상세하고 풍부한 내용으로 구성하세요. 제목, 부제목, 내용을 포함하되, 내용은 5-8개의 불릿 포인트로 구성하고 각 불릿 포인트는 2-3줄의 상세한 설명을 포함해야 합니다. 예시, 데이터, 구체적인 설명을 포함하여 전문적이고 정보가 풍부한 내용으로 작성해주세요.'
          : 'Create in standard PPT presentation format with detailed and rich content. Each slide should include title, subtitle, and content with 5-8 bullet points. Each bullet point should contain 2-3 lines of detailed explanation with examples, data, and specific descriptions for professional and informative content.';
    }
  };

  const prompt = `
${languageInstruction}
${getSlideTypeInstruction()}

다음 내용을 바탕으로 프레젠테이션 슬라이드를 만들어주세요. 
내용의 분량에 따라 적절히 여러 슬라이드로 나누어 주세요. 
각 슬라이드는 명확한 제목과 핵심 내용을 가져야 합니다.

내용: ${content}

응답은 반드시 다음 형식으로만 작성해주세요. 다른 설명이나 텍스트는 포함하지 마세요:

===SLIDE_START===
TITLE: [슬라이드 제목]
CONTENT: [슬라이드 내용]
===SLIDE_END===

===SLIDE_START===
TITLE: [슬라이드 제목]
CONTENT: [슬라이드 내용]
===SLIDE_END===

지침:
1. 내용이 길면 논리적으로 여러 슬라이드로 분할하세요
2. 각 슬라이드는 하나의 주요 아이디어에 집중하세요
3. 제목은 간결하고 임팩트 있게 작성하세요
4. 각 슬라이드의 내용은 읽기 쉽고 이해하기 쉽게 작성하세요
5. 반드시 위의 형식을 정확히 따라주세요
`;

  try {
    const response = await callGeminiAPI(prompt, apiKey);
    console.log('Gemini API Response:', response);
    
    // Parse the response to extract slides
    const slides: Array<{ title: string; content: string; subtitle?: string; bulletPoints?: string[] }> = [];
    
    // Split by slide markers
    const slideBlocks = response.split('===SLIDE_START===').filter(block => block.trim());
    
    for (const block of slideBlocks) {
      const endIndex = block.indexOf('===SLIDE_END===');
      const slideContent = endIndex !== -1 ? block.substring(0, endIndex) : block;
      
      const lines = slideContent.split('\n').filter(line => line.trim());
      let title = '';
      let content = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('TITLE:')) {
          title = trimmedLine.replace('TITLE:', '').trim();
        } else if (trimmedLine.startsWith('CONTENT:')) {
          content = trimmedLine.replace('CONTENT:', '').trim();
        }
      }
      
      if (title && content) {
        slides.push({ title, content });
      }
    }
    
    console.log('Parsed slides:', slides);
    
    // If parsing failed, try alternative parsing
    if (slides.length === 0) {
      console.log('Primary parsing failed, trying alternative parsing...');
      
      // Try to extract any title/content patterns
      const titleMatches = response.match(/(?:제목|TITLE|Title):\s*(.+)/gi);
      const contentMatches = response.match(/(?:내용|CONTENT|Content):\s*(.+)/gi);
      
      if (titleMatches && contentMatches) {
        const minLength = Math.min(titleMatches.length, contentMatches.length);
        for (let i = 0; i < minLength; i++) {
          const title = titleMatches[i].replace(/(?:제목|TITLE|Title):\s*/i, '').trim();
          const content = contentMatches[i].replace(/(?:내용|CONTENT|Content):\s*/i, '').trim();
          if (title && content) {
            slides.push({ title, content });
          }
        }
      }
    }
    
    // If still no slides, create a fallback slide
    if (slides.length === 0) {
      console.log('All parsing failed, creating fallback slide...');
      
      // Split content into paragraphs and create slides
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      
      if (paragraphs.length > 1) {
        paragraphs.forEach((paragraph, index) => {
          const lines = paragraph.split('\n').filter(l => l.trim());
          const title = lines[0] || `슬라이드 ${index + 1}`;
          const slideContent = lines.slice(1).join(' ') || paragraph;
          
          slides.push({
            title: title.length > 50 ? title.substring(0, 50) + '...' : title,
            content: slideContent
          });
        });
      } else {
        // Single slide fallback
        slides.push({
          title: language === 'ko' ? '프레젠테이션' : 'Presentation',
          content: content
        });
      }
    }
    
    return slides;
    
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Fallback: create slides from content directly
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    if (paragraphs.length > 1) {
      return paragraphs.map((paragraph, index) => {
        const lines = paragraph.split('\n').filter(l => l.trim());
        const title = lines[0] || `슬라이드 ${index + 1}`;
        const slideContent = lines.slice(1).join(' ') || paragraph;
        
        return {
          title: title.length > 50 ? title.substring(0, 50) + '...' : title,
          content: slideContent
        };
      });
    } else {
      return [{
        title: language === 'ko' ? '프레젠테이션' : 'Presentation',
        content: content
      }];
    }
  }
};

export const updateSlideWithGemini = async (
  currentTitle: string,
  currentContent: string,
  updateRequest: string,
  apiKey: string,
  language: 'ko' | 'en'
): Promise<{ title: string; content: string; subtitle?: string; bulletPoints?: string[] }> => {
  const languageInstruction = language === 'ko' 
    ? '한국어로 응답해주세요.' 
    : 'Please respond in English.';

  const prompt = `
${languageInstruction}

현재 슬라이드:
제목: ${currentTitle}
내용: ${currentContent}

수정 요청: ${updateRequest}

위 수정 요청에 따라 슬라이드를 업데이트해주세요.

응답 형식 (다른 텍스트는 포함하지 마세요):
TITLE: [새로운 제목]
CONTENT: [새로운 내용]
`;

  try {
    const response = await callGeminiAPI(prompt, apiKey);
    
    // Parse the response
    const lines = response.split('\n').filter(line => line.trim());
    let title = currentTitle;
    let content = currentContent;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('TITLE:')) {
        title = trimmedLine.replace('TITLE:', '').trim() || title;
      } else if (trimmedLine.startsWith('CONTENT:')) {
        content = trimmedLine.replace('CONTENT:', '').trim() || content;
      }
    }
    
    return { title, content };
    
  } catch (error) {
    console.error('Error updating slide with Gemini:', error);
    // Return original content if API fails
    return { title: currentTitle, content: currentContent };
  }
};