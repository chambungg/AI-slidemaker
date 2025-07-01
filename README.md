AI SLIDE MAKER는 Google Gemini AI API를 활용하여 텍스트 내용을 자동으로 전문적인 슬라이드로 변환해주는 웹 애플리케이션입니다. 다양한 슬라이드 타입과 테마를 지원하며, PDF/HTML 내보내기 기능을 제공합니다.

## ✨ 주요 기능

### 🤖 AI 기반 슬라이드 생성
- **Google Gemini 2.0 Flash** API를 활용한 고품질 슬라이드 자동 생성
- 텍스트 내용을 분석하여 논리적으로 여러 슬라이드로 분할
- 각 슬라이드에 적합한 제목과 내용 자동 구성

### 📊 다양한 슬라이드 타입
- **PPT**: 일반적인 프레젠테이션 스타일 (제목, 부제목, 불릿 포인트)
- **카드뉴스**: 짧고 요약된 문구 위주의 카드 형태 (최대 20단어)
- **이미지카드**: 이미지와 메시지가 조합된 형태 (최대 30단어)

### 🎨 풍부한 커스터마이징 옵션
- **20가지 테마**: 비비드, 다크, 모노크롬, 프로페셔널 테마
- **6가지 화면 비율**: 16:9, 16:10, 1:1, 3:2, 9:16, 10:16
- **6가지 레이아웃 템플릿**: 중앙, 좌측, 상단, 분할, 하단, 우측 정렬
- **배경 이미지**: Unsplash 기반 고품질 이미지 자동 선택

### 🛠️ 고급 편집 기능
- **실시간 슬라이드 편집**: 드래그 앤 드롭으로 요소 이동
- **AI 수정 요청**: 자연어로 슬라이드 수정 요청 가능
- **텍스트 스타일링**: 글꼴, 크기, 색상, 정렬 등 세부 조정
- **애니메이션 효과**: 8가지 애니메이션 효과 (페이드인, 슬라이드, 줌, 바운스 등)

### 📤 내보내기 기능
- **PDF 내보내기**: 고해상도 PDF 파일로 저장
- **HTML 내보내기**: 웹에서 공유 가능한 HTML 파일 생성
- **반응형 디자인**: 모바일과 데스크톱에서 최적화된 표시

### 🌐 다국어 지원
- **한국어/영어** 인터페이스 지원
- 언어별 최적화된 AI 프롬프트

## 🚀 기술 스택

### Frontend
- **React 18** + **TypeScript** - 타입 안전한 컴포넌트 개발
- **Vite** - 빠른 개발 서버와 빌드 도구
- **Tailwind CSS** - 유틸리티 퍼스트 CSS 프레임워크
- **Lucide React** - 아이콘 라이브러리

### UI/UX
- **React DnD** - 드래그 앤 드롭 기능
- **HTML2Canvas** - 슬라이드 이미지 캡처
- **jsPDF** - PDF 생성 및 내보내기

### AI & API
- **Google Gemini 2.0 Flash API** - AI 텍스트 생성
- **Unsplash API** - 고품질 배경 이미지

### 보안 & 저장
- **CryptoJS** - API 키 암호화 저장
- **LocalStorage** - 사용자 설정 저장

## 📁 프로젝트 구조

AI-slidemaker/

├── src/

│ ├── components/ # React 컴포넌트

│ │ ├── ApiSettings.tsx # API 키 설정

│ │ ├── AspectRatioSelector.tsx # 화면 비율 선택

│ │ ├── BackgroundChanger.tsx # 배경 변경

│ │ ├── ImageSearch.tsx # 이미지 검색

│ │ ├── LanguageSelector.tsx # 언어 선택

│ │ ├── ResizablePanel.tsx # 크기 조절 패널

│ │ ├── SlideEditor.tsx # 슬라이드 편집기

│ │ ├── SlidePreview.tsx # 슬라이드 미리보기

│ │ ├── SlidesContainer.tsx # 슬라이드 컨테이너

│ │ ├── SlideTypeSelector.tsx # 슬라이드 타입 선택

│ │ ├── TemplateSelector.tsx # 템플릿 선택

│ │ └── ThemeSelector.tsx # 테마 선택

│ ├── utils/ # 유틸리티 함수

│ │ ├── encryption.ts # 암호화 관련

│ │ ├── exportUtils.ts # PDF/HTML 내보내기

│ │ ├── geminiApi.ts # Gemini AI API 연동

│ │ ├── imageSearch.ts # 이미지 검색 API

│ │ └── slideGenerator.ts # 슬라이드 생성 로직

│ ├── types/ # TypeScript 타입 정의

│ │ └── index.ts

│ ├── constants/ # 상수 정의

│ │ └── index.ts

│ ├── App.tsx # 메인 앱 컴포넌트

│ └── main.tsx # 앱 엔트리 포인트

├── package.json # 의존성 및 스크립트

├── tailwind.config.js # Tailwind CSS 설정

├── tsconfig.json # TypeScript 설정

└── vite.config.ts # Vite 빌드 설정


## 🔧 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/AI-slidemaker.git
cd AI-slidemaker
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Google Gemini API 키 설정
1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API 키 발급하세요!
2. 애플리케이션 실행 후 설정 메뉴에서 API 키 설정하는 부분에 입력후 사용

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 프로덕션 빌드
```bash
npm run build
```

## 🎯 사용 방법

### 1. 기본 사용법
1. **API 키 설정**: 우상단 설정 버튼을 클릭하여 Gemini API 키 입력
2. **언어 선택**: 한국어 또는 영어 선택
3. **슬라이드 타입 선택**: PPT, 카드뉴스, 이미지카드 중 선택
4. **내용 입력**: 텍스트 영역에 프레젠테이션 내용 입력
5. **테마 및 비율 선택**: 원하는 테마와 화면 비율 선택
6. **슬라이드 생성**: "슬라이드 생성" 버튼 클릭

### 2. 고급 편집
- **슬라이드 편집**: 생성된 슬라이드를 클릭하여 상세 편집
- **AI 수정**: "AI 수정 요청" 기능으로 자연어로 수정 요청
- **배경 변경**: 각 슬라이드별로 배경 이미지 변경 가능
- **템플릿 변경**: 다양한 레이아웃 템플릿 적용

### 3. 내보내기
- **PDF**: 고품질 PDF 파일로 다운로드
- **HTML**: 웹 공유용 HTML 파일로 저장

## 🔧 주요 컴포넌트 설명

### SlideGenerator (slideGenerator.ts)
- AI를 활용한 슬라이드 자동 생성
- 내용 분석 및 논리적 분할
- HTML 슬라이드 렌더링

### GeminiAPI (geminiApi.ts)
- Google Gemini 2.0 Flash API 연동
- 프롬프트 최적화 및 응답 파싱
- 오류 처리 및 폴백 로직

### ExportUtils (exportUtils.ts)
- HTML2Canvas를 활용한 고해상도 캡처
- PDF 생성 및 최적화
- HTML 내보내기 및 스타일링

### SlidesContainer (SlidesContainer.tsx)
- 슬라이드 목록 관리 및 렌더링
- 드래그 앤 드롭 정렬 기능
- 실시간 편집 및 미리보기

## 🎨 테마 시스템

### 테마 구성
각 테마는 3가지 색상으로 구성됩니다:
- **Primary**: 주요 색상 (제목, 강조 요소)
- **Secondary**: 보조 색상 (부제목, 배경)
- **Accent**: 포인트 색상 (버튼, 링크)

### 테마 카테고리
- **비비드 테마**: 밝고 생동감 있는 색상 조합
- **다크 테마**: 어둡고 모던한 색상 조합
- **모노크롬**: 흑백 기반의 미니멀한 디자인
- **프로페셔널**: 비즈니스용 안정적인 색상

## 🔒 보안 및 개인정보

- **API 키 암호화**: CryptoJS를 사용하여 로컬 저장소에 암호화 저장
- **클라이언트 사이드**: 모든 처리가 브라우저에서 수행되어 개인정보 보호
- **CORS 지원**: 안전한 외부 API 호출

## 🌟 고급 기능

### AI 프롬프트 최적화
- 슬라이드 타입별 맞춤형 프롬프트
- 언어별 최적화된 명령어
- 구조화된 응답 파싱

### 반응형 디자인
- 모바일/태블릿/데스크톱 최적화
- 터치 인터페이스 지원
- 다양한 화면 크기 대응

### 성능 최적화
- 지연 로딩 및 메모이제이션
- 이미지 최적화 및 캐싱
- 효율적인 상태 관리

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다
3. 변경사항을 커밋합니다
4. 브랜치에 푸시합니다
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 오픈소스 개발자대회 참가를 위해 시작되었으며
대회 진행에 따라, MIT 라이선스로 배포할 계획입니다.
