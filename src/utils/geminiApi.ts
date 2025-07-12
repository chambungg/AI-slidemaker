import { createSlideGenerationPrompt, createSlideUpdatePrompt, type SlideGenerationConfig } from '../constants/prompts';

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export interface ApiError {
  message: string;
  type: 'network' | 'auth' | 'quota' | 'validation' | 'server' | 'unknown';
  status?: number;
  userMessage: string;
}

const createApiError = (error: unknown, status?: number): ApiError => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Network connection failed',
      type: 'network',
      userMessage: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.'
    };
  }

  if (status === 401) {
    return {
      message: 'Invalid API key',
      type: 'auth',
      status,
      userMessage: 'API 키가 유효하지 않습니다. 설정에서 올바른 Gemini API 키를 입력해주세요.'
    };
  }

  if (status === 403) {
    return {
      message: 'API access forbidden',
      type: 'auth',
      status,
      userMessage: 'API 접근이 거부되었습니다. API 키 권한을 확인해주세요.'
    };
  }

  if (status === 429) {
    return {
      message: 'Rate limit exceeded',
      type: 'quota',
      status,
      userMessage: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
    };
  }

  if (status === 400) {
    return {
      message: 'Invalid request',
      type: 'validation',
      status,
      userMessage: '요청이 잘못되었습니다. 입력 내용을 확인해주세요.'
    };
  }

  if (status && status >= 500) {
    return {
      message: 'Server error',
      type: 'server',
      status,
      userMessage: 'AI 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
    };
  }

  return {
    message: error instanceof Error ? error.message : 'Unknown error',
    type: 'unknown',
    status,
    userMessage: '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'
  };
};

export const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    const error: ApiError = {
      message: 'Gemini API key is required',
      type: 'validation',
      userMessage: 'Gemini API 키가 필요합니다. 설정에서 API 키를 입력해주세요.'
    };
    throw error;
  }

  if (!prompt.trim()) {
    const error: ApiError = {
      message: 'Prompt is required',
      type: 'validation',
      userMessage: '내용을 입력해주세요.'
    };
    throw error;
  }

  let response: Response;
  
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
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
      }),
      signal: AbortSignal.timeout(30000) // 30초 타임아웃
    });
  } catch (error) {
    throw createApiError(error);
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      // JSON 파싱 실패 시 기본 에러 처리
    }
    
    throw createApiError(errorData || new Error(`HTTP ${response.status}`), response.status);
  }

  let data: GeminiResponse;
  try {
    data = await response.json();
  } catch (error) {
    const apiError: ApiError = {
      message: 'Failed to parse response',
      type: 'server',
      userMessage: 'AI 응답을 처리하는 중 오류가 발생했습니다.'
    };
    throw apiError;
  }

  if (data.error) {
    throw createApiError(data.error, data.error.code);
  }
  
  if (!data.candidates || data.candidates.length === 0) {
    const error: ApiError = {
      message: 'No response from Gemini API',
      type: 'server',
      userMessage: 'AI에서 응답을 받지 못했습니다. 다시 시도해주세요.'
    };
    throw error;
  }

  const candidate = data.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    const error: ApiError = {
      message: 'Invalid response format',
      type: 'server',
      userMessage: 'AI 응답 형식이 올바르지 않습니다.'
    };
    throw error;
  }

  return candidate.content.parts[0].text;
};

//이하 제미나이 프롬프트 설정
export const generateSlidesWithGemini = async (
  content: string,
  apiKey: string,
  language: 'ko' | 'en',
  slideType: 'card-news' | 'ppt' | 'image-card' = 'ppt',
  slideCount = 5
): Promise<Array<{ title: string; content: string; subtitle?: string; bulletPoints?: string[] }>> => {
  const config: SlideGenerationConfig = {
    language,
    slideType,
    slideCount
  };

  const prompt = createSlideGenerationPrompt(content, config);

  try {
    const response = await callGeminiAPI(prompt, apiKey);
    // API response logging removed for security
    
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
    
    // Parsed slides logging removed for security
    
    // If parsing failed, try alternative parsing
    if (slides.length === 0) {
      // Primary parsing failed, trying alternative parsing...
      
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
      // All parsing failed, creating fallback slide...
      
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
    // Error handled without logging sensitive information
    
    // ApiError인 경우 사용자에게 친화적인 메시지와 함께 재throw
    if (error && typeof error === 'object' && 'userMessage' in error) {
      throw error;
    }
    
    // 예상치 못한 에러인 경우 일반적인 ApiError로 변환
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : 'Unknown error during slide generation',
      type: 'unknown',
      userMessage: '슬라이드 생성 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
    throw apiError;
  }
};

export const updateSlideWithGemini = async (
  currentTitle: string,
  currentContent: string,
  updateRequest: string,
  apiKey: string,
  language: 'ko' | 'en'
): Promise<{ title: string; content: string; subtitle?: string; bulletPoints?: string[] }> => {
  const prompt = createSlideUpdatePrompt(currentTitle, currentContent, updateRequest, language);

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
    // Error handled without logging sensitive information
    
    // ApiError인 경우 재throw하여 사용자에게 적절한 피드백 제공
    if (error && typeof error === 'object' && 'userMessage' in error) {
      throw error;
    }
    
    // 예상치 못한 에러인 경우 일반적인 ApiError로 변환
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : 'Unknown error during slide update',
      type: 'unknown',
      userMessage: '슬라이드 수정 중 오류가 발생했습니다. 다시 시도해주세요.'
    };
    throw apiError;
  }
};