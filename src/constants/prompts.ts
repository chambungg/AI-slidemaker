export interface SlideGenerationConfig {
  language: 'ko' | 'en';
  slideType: 'card-news' | 'ppt' | 'image-card';
  slideCount: number;
}

export const getLanguageInstruction = (language: 'ko' | 'en'): string => {
  return language === 'ko' 
    ? '한국어로 응답해주세요.' 
    : 'Please respond in English.';
};

export const getSlideTypeInstruction = (slideType: 'cardnews' | 'ppt' | 'imagecard', language: 'ko' | 'en'): string => {
  switch (slideType) {
    case 'cardnews':
      return language === 'ko' 
        ? '카드뉴스 형태로 만들어주세요. 각 슬라이드는 간결하고 임팩트 있는 메시지로 구성하세요. 내용은 최소 20자에서 최대 40자로 작성하고, 핵심 메시지만 포함하여 한눈에 이해할 수 있게 해주세요.'
        : 'Create in card news format. Each slide should have concise and impactful messages. Content should be minimum 20 characters to maximum 40 characters, including only key messages for instant understanding.';
    case 'imagecard':
      return language === 'ko'
        ? '이미지카드 형태로 만들어주세요. 각 슬라이드에는 관련 이미지가 배치되고, 그 이미지에 알맞는 매우 간결한 메시지를 표시하세요. 내용은 최소 10자에서 최대 20자로 작성하여 이미지와 함께 강력한 시각적 메시지를 전달하세요.'
        : 'Create in image card format. Each slide should have a relevant image with very concise messages. Content should be minimum 10 characters to maximum 20 characters to deliver powerful visual messages together with images.';
    case 'ppt':
    default:
      return language === 'ko'
        ? '일반적인 PPT 프레젠테이션 형태로 만들어주세요. 각 슬라이드는 상세하고 풍부한 내용으로 구성하세요. 내용은 최소 100자에서 최대 300자로 작성하고, 불릿 포인트, 예시, 데이터, 구체적인 설명을 포함하여 전문적이고 정보가 풍부한 내용으로 작성해주세요.'
        : 'Create in standard PPT presentation format with detailed and rich content. Content should be minimum 100 characters to maximum 300 characters, including bullet points, examples, data, and specific descriptions for professional and informative content.';
  }
};

export const createSlideGenerationPrompt = (
  content: string,
  config: SlideGenerationConfig
): string => {
  const { language, slideType, slideCount } = config;
  
  return `
${getLanguageInstruction(language)}
${getSlideTypeInstruction(slideType, language)}

다음 내용을 바탕으로 정확히 ${slideCount}개의 프레젠테이션 슬라이드를 만들어주세요. 
반드시 ${slideCount}개의 슬라이드로 나누어서 작성해주세요.
각 슬라이드는 명확한 제목과 핵심 내용을 가져야 합니다.
제목은 최대 15자 이하의 간결한 핵심 문구로 작성해주세요.

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
1. 반드시 정확히 ${slideCount}개의 슬라이드를 생성하세요
2. 각 슬라이드는 하나의 주요 아이디어에 집중하세요
3. 제목은 최대 15자 이하로 간결하고 임팩트 있게 작성하세요
4. 내용은 풍부하고 상세하게 작성하세요
5. 반드시 위의 형식을 정확히 따라주세요
`;
};

export const createSlideUpdatePrompt = (
  currentTitle: string,
  currentContent: string,
  updateRequest: string,
  language: 'ko' | 'en'
): string => {
  return `
${getLanguageInstruction(language)}

현재 슬라이드:
제목: ${currentTitle}
내용: ${currentContent}

수정 요청: ${updateRequest}

위 수정 요청에 따라 슬라이드를 업데이트해주세요.

응답 형식 (다른 텍스트는 포함하지 마세요):
TITLE: [새로운 제목]
CONTENT: [새로운 내용]
`;
};

export const AI_CONTENT_PROMPTS = {
  ko: [
    // 기술 분야
    "최신 AI 기술 동향과 미래 전망에 대한 발표 자료를 만들어주세요",
    "블록체인 기술의 원리와 실생활 적용 사례를 소개해주세요",
    "사물인터넷(IoT)의 발전과 스마트 시티 구축 방안을 설명해주세요",
    "클라우드 컴퓨팅의 장점과 기업 도입 전략을 다뤄주세요",
    "빅데이터 분석의 중요성과 활용 방법을 제시해주세요",
    
    // 비즈니스 분야
    "창업을 위한 비즈니스 모델 구성과 투자 유치 방법을 소개해주세요",
    "디지털 마케팅 전략과 소셜미디어 활용법에 대한 프레젠테이션을 준비해주세요",
    "고객 경험(CX) 향상을 위한 서비스 디자인 방법론을 설명해주세요",
    "원격 근무 시대의 팀 관리와 생산성 향상 방안을 다뤄주세요",
    "ESG 경영의 중요성과 기업의 지속가능성 전략을 소개해주세요",
    
    // 교육 분야
    "온라인 교육의 효과적인 설계와 운영 방안에 대해 논의해주세요",
    "메타버스를 활용한 몰입형 학습 환경 구축 방법을 설명해주세요",
    "개인 맞춤형 학습 시스템과 적응형 교육 기술을 다뤄주세요",
    "디지털 리터러시 교육의 필요성과 실천 방안을 제시해주세요",
    
    // 환경/사회 분야
    "지속가능한 환경을 위한 친환경 기술과 실천 방안에 대해 설명해주세요",
    "재생에너지의 종류와 효율적인 활용 방법을 소개해주세요",
    "순환경제 시스템 구축과 폐기물 관리 혁신을 다뤄주세요",
    "도시농업과 스마트팜 기술의 발전 방향을 설명해주세요",
    
    // 건강/라이프스타일 분야
    "건강한 라이프스타일을 위한 운동과 영양 관리법을 제시해주세요",
    "정신건강 관리와 스트레스 해소 방법을 소개해주세요",
    "디지털 헬스케어 기술과 개인 건강 관리 도구를 다뤄주세요",
    "일과 삶의 균형을 위한 시간 관리 기법을 설명해주세요",
    
    // 글로벌/문화 분야
    "글로벌 시장 진출을 위한 국제화 전략과 문화적 고려사항을 다뤄주세요",
    "다문화 사회의 이해와 상호 존중 문화 조성 방안을 제시해주세요",
    "K-컬처의 세계적 확산과 문화 콘텐츠 산업 전망을 소개해주세요",
    
    // 미래/트렌드 분야
    "미래 직업 트렌드와 필요한 역량 개발 방향에 대해 분석해주세요",
    "인구 고령화 사회의 도전과 기회를 다뤄주세요"
  ],
  en: [
    // Technology
    "Create a presentation about the latest AI technology trends and future prospects",
    "Introduce blockchain technology principles and real-life application cases",
    "Explain IoT development and smart city construction strategies",
    "Cover cloud computing advantages and enterprise adoption strategies",
    "Present the importance and utilization methods of big data analysis",
    
    // Business
    "Introduce business model composition and investment attraction methods for startups",
    "Prepare a presentation on digital marketing strategies and social media utilization",
    "Explain service design methodologies for improving customer experience (CX)",
    "Cover team management and productivity improvement in the remote work era",
    "Introduce ESG management importance and corporate sustainability strategies",
    
    // Education
    "Discuss effective design and operation of online education",
    "Explain methods for building immersive learning environments using metaverse",
    "Cover personalized learning systems and adaptive education technologies",
    "Present the necessity and practical plans for digital literacy education",
    
    // Environment/Society
    "Explain eco-friendly technologies and practices for sustainable environment",
    "Introduce types of renewable energy and efficient utilization methods",
    "Cover circular economy system construction and waste management innovation",
    "Explain the development direction of urban agriculture and smart farm technology",
    
    // Health/Lifestyle
    "Present exercise and nutrition management for a healthy lifestyle",
    "Introduce mental health management and stress relief methods",
    "Cover digital healthcare technology and personal health management tools",
    "Explain time management techniques for work-life balance",
    
    // Global/Culture
    "Cover internationalization strategies and cultural considerations for global market entry",
    "Present understanding of multicultural society and mutual respect culture creation",
    "Introduce K-culture's global expansion and cultural content industry prospects",
    
    // Future/Trends
    "Analyze future job trends and necessary competency development directions",
    "Cover challenges and opportunities in an aging society"
  ]
} as const;