export interface Slide {
  id: string;
  title: string;
  content: string;
  htmlContent: string;
  order: number;
  imageUrl?: string;
  template?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  backgroundPattern?: string;
  backgroundBlur?: number;
  themeOverlay?: number;
  backgroundSeed?: string;
  backgroundGrayscale?: boolean;
  backgroundType?: 'image' | 'color';
  slideLayout?: 'title-top-content-bottom' | 'title-left-content-right' | 'title-right-content-left' | 'title-only' | 'title-small-top-left' | 'title-small-top-right';
  elements?: SlideElement[];
  history?: SlideState[];
  historyIndex?: number;
  titlePosition?: ElementPosition;
  contentPosition?: ElementPosition;
}

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  animation?: AnimationEffect;
  zIndex: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  rotation?: number;
}

export interface FontSizes {
  title: number;
  subtitle: number;
  content: number;
  bullet: number;
}

export interface AnimationEffect {
  type: 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown' | 'zoomIn' | 'bounceIn' | 'none';
  duration: number;
  delay: number;
}

export interface SlideState {
  elements: SlideElement[];
  template: string;
  backgroundImage?: string;
}

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface AspectRatio {
  label: string;
  value: string;
  width: number;
  height: number;
}

// Font style types
export type ThemeFontId = 
  | 'modern-clean'
  | 'elegant-serif'
  | 'bold-impact'
  | 'playful-round'
  | 'minimal-light'
  | 'handwriting'
  | 'tech-mono'
  | 'vintage-classic'
  | 'futuristic'
  | 'artistic-brush';

export interface ThemeFont {
  id: ThemeFontId;
  name: string;
  fontFamily: string;
  fontUrl?: string;
  effects: {
    textShadow?: string;
    textStroke?: string;
    letterSpacing?: string;
    fontWeight?: string;
  };
}

// Template style types
export type ThemeTemplateId = 
  | 'mixed-auto'
  | 'presentation-formal'
  | 'side-by-side'
  | 'title-focus'
  | 'content-heavy'
  | 'creative-asymmetric';

export interface ThemeTemplateOption {
  id: ThemeTemplateId;
  name: string;
  description: string;
  defaultLayout: string;
  icon?: React.ReactNode;
}

// Border style types
export type SlideBorderStyleId = 
  | 'none'
  | 'clean-minimal'
  | 'modern-card'
  | 'bold-frame'
  | 'dashed-creative'
  | 'dotted-playful'
  | 'double-professional'
  | 'glow-effect';

export interface SlideBorderStyle {
  id: SlideBorderStyleId;
  name: string;
  borderWidth: number;
  borderStyle: string;
  borderRadius: number;
  boxShadow: string;
}

export interface SlideGeneratorState {
  content: string;
  theme: Theme;
  aspectRatio: AspectRatio;
  slides: Slide[];
  activeSlideId: string | null;
  isGenerating: boolean;
  activeTab: 'preview' | 'code';
  geminiApiKey: string;
  language: 'ko' | 'en';
  selectedElementId?: string;
  themeFont?: ThemeFont;
  themeTemplate?: ThemeTemplateOption;
  slideBorderStyle?: SlideBorderStyle;
  slideCount?: number;
}

export interface ApiSettings {
  geminiApiKey: string;
  isConfigured: boolean;
}

export interface SlideTemplate {
  id: string;
  name: string;
  preview: string;
  layout: 'title-center' | 'title-left' | 'title-top' | 'split-content' | 'title-bottom' | 'title-right';
}