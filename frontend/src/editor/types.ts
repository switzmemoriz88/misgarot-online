// ==========================================
// Editor Types - מודל העורך
// ==========================================

export type ElementType = 'text' | 'image' | 'shape' | 'frame' | 'placeholder';
export type ShapeType = 'rectangle' | 'circle' | 'line' | 'star' | 'polygon' | 'triangle' | 'arrow';
export type PlaceholderShape = 'rectangle' | 'circle' | 'rounded' | 'heart' | 'star';
export type TextAlign = 'left' | 'center' | 'right';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type ObjectFit = 'cover' | 'contain' | 'fill';
export type TextDirection = 'ltr' | 'rtl';

// Shadow type - משותף לכל האלמנטים
export interface ShadowConfig {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  enabled: boolean;
}

// אלמנט בסיסי
export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  zIndex: number;
  isLocked: boolean;
  isVisible: boolean;
  name: string;
}

// אלמנט טקסט
export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'italic';
  fontWeight: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  textAlign: TextAlign;
  direction: TextDirection;
  lineHeight: number;
  letterSpacing: number;
  textDecoration?: 'underline' | 'line-through' | 'none';
  shadow?: ShadowConfig;
}

// אלמנט תמונה
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  assetId?: string;
  originalWidth: number;
  originalHeight: number;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  objectFit: ObjectFit;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: ShadowConfig;
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
    grayscale?: boolean;
  };
}

// אלמנט צורה
export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle?: StrokeStyle;
  cornerRadius?: number;
  sides?: number; // for polygon
  innerRadius?: number; // for star
  shadow?: ShadowConfig;
}

// אלמנט מסגרת (רקע)
export interface FrameElement extends BaseElement {
  type: 'frame';
  src: string;
  isBackground: boolean;
}

// אלמנט Placeholder - אזור לשיבוץ תמונה
export interface PlaceholderElement extends BaseElement {
  type: 'placeholder';
  shape: PlaceholderShape;
  fill: string;           // צבע הרקע כשאין תמונה
  stroke: string;         // צבע המסגרת
  strokeWidth: number;
  cornerRadius?: number;  // לצורות מרובעות
  label?: string;         // תווית (למשל: "תמונה 1")
  // תמונה שהוכנסה ל-placeholder
  imageData?: {
    src: string;
    assetId: string;
    offsetX: number;      // מיקום התמונה בתוך ה-placeholder
    offsetY: number;
    scale: number;        // גודל התמונה ביחס ל-placeholder
  };
}

// תמונה בגלריה
export interface GalleryImage {
  id: string;
  src: string;              // URL או base64
  thumbnailSrc?: string;    // גרסה מוקטנת
  originalWidth: number;
  originalHeight: number;
  name: string;
  uploadedAt: number;
  size?: number;            // גודל קובץ בבייטים
}

// Union type לכל האלמנטים
export type CanvasElement = TextElement | ImageElement | ShapeElement | FrameElement | PlaceholderElement;

// מצב העורך
export interface EditorState {
  elements: CanvasElement[];
  selectedIds: string[];
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  gridSize: number;
  history: HistoryState[];
  historyIndex: number;
}

// היסטוריה ל-Undo/Redo
export interface HistoryState {
  elements: CanvasElement[];
  timestamp: number;
  action: string;
}

// כלי העורך
export type EditorTool = 
  | 'select'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'image'
  | 'placeholder'
  | 'pan'
  | 'crop';

// הגדרות הקנבס
export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
}

// קווי עזר (Smart Guides)
export interface GuideLine {
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
}

// Snap Points
export interface SnapPoint {
  x: number;
  y: number;
  type: 'center' | 'edge' | 'grid';
}

// פעולת Clipboard
export interface ClipboardData {
  elements: CanvasElement[];
  timestamp: number;
}

// יצוא
export interface ExportSettings {
  format: 'png' | 'jpeg' | 'pdf';
  quality: number;
  scale: number;
  backgroundColor?: string;
}

// פונט
export interface FontOption {
  family: string;
  name: string;
  weights: number[];
  category: 'hebrew' | 'english' | 'decorative' | 'handwriting' | 'display';
  style?: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
}

// ==========================================
// רשימת גופנים עבריים - Google Fonts
// פונטים פופולריים בעיצוב עברי
// ==========================================
export const HEBREW_FONTS: FontOption[] = [
  // Sans-Serif - מודרני ונקי
  { family: 'Heebo', name: 'היבו', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], category: 'hebrew', style: 'sans-serif' },
  { family: 'Assistant', name: 'אסיסטנט', weights: [200, 300, 400, 500, 600, 700, 800], category: 'hebrew', style: 'sans-serif' },
  { family: 'Rubik', name: 'רוביק', weights: [300, 400, 500, 600, 700, 800, 900], category: 'hebrew', style: 'sans-serif' },
  { family: 'Varela Round', name: 'ורלה ראונד', weights: [400], category: 'hebrew', style: 'sans-serif' },
  { family: 'Alef', name: 'אלף', weights: [400, 700], category: 'hebrew', style: 'sans-serif' },
  { family: 'Noto Sans Hebrew', name: 'נוטו סאנס', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], category: 'hebrew', style: 'sans-serif' },
  { family: 'Karantina', name: 'קרנטינה', weights: [300, 400, 700], category: 'hebrew', style: 'sans-serif' },
  { family: 'Arimo', name: 'ארימו', weights: [400, 500, 600, 700], category: 'hebrew', style: 'sans-serif' },
  { family: 'Miriam Libre', name: 'מרים', weights: [400, 700], category: 'hebrew', style: 'sans-serif' },
  { family: 'Open Sans Hebrew', name: 'אופן סאנס', weights: [300, 400, 600, 700, 800], category: 'hebrew', style: 'sans-serif' },
  
  // Serif - קלאסי ואלגנטי  
  { family: 'Frank Ruhl Libre', name: 'פרנק רוהל', weights: [300, 400, 500, 600, 700, 800, 900], category: 'hebrew', style: 'serif' },
  { family: 'David Libre', name: 'דוד', weights: [400, 500, 600, 700], category: 'hebrew', style: 'serif' },
  { family: 'Suez One', name: 'סואץ', weights: [400], category: 'hebrew', style: 'serif' },
  { family: 'Noto Serif Hebrew', name: 'נוטו סריף', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], category: 'hebrew', style: 'serif' },
  { family: 'Bellefair', name: 'בלפייר', weights: [400], category: 'hebrew', style: 'serif' },
  { family: 'Tinos', name: 'טינוס', weights: [400, 700], category: 'hebrew', style: 'serif' },
  { family: 'Libre Baskerville', name: 'ליברה בסקרוויל', weights: [400, 700], category: 'hebrew', style: 'serif' },
  
  // Display - כותרות ועיצוב
  { family: 'Secular One', name: 'סקולר', weights: [400], category: 'hebrew', style: 'display' },
  { family: 'Amatic SC', name: 'אמאטיק', weights: [400, 700], category: 'hebrew', style: 'display' },
  { family: 'Rubik Mono One', name: 'רוביק מונו', weights: [400], category: 'hebrew', style: 'display' },
  { family: 'Bona Nova', name: 'בונה נובה', weights: [400, 700], category: 'hebrew', style: 'display' },
  { family: 'Rubik Glitch', name: 'רוביק גליץ׳', weights: [400], category: 'hebrew', style: 'display' },
  { family: 'Rubik Burned', name: 'רוביק שרוף', weights: [400], category: 'hebrew', style: 'display' },
  { family: 'Rubik Vinyl', name: 'רוביק ויניל', weights: [400], category: 'hebrew', style: 'display' },
  { family: 'Rubik Wet Paint', name: 'רוביק צבע רטוב', weights: [400], category: 'hebrew', style: 'display' },
  { family: 'Rubik Marker Hatch', name: 'רוביק מרקר', weights: [400], category: 'hebrew', style: 'display' },
  
  // Handwriting - כתב יד
  { family: 'Rubik Dirt', name: 'רוביק דירט', weights: [400], category: 'hebrew', style: 'handwriting' },
  { family: 'Gveret Levin', name: 'גברת לוין', weights: [400], category: 'hebrew', style: 'handwriting' },
  { family: 'Handlee', name: 'הנדלי', weights: [400], category: 'hebrew', style: 'handwriting' },
  { family: 'Reenie Beanie', name: 'ריני ביני', weights: [400], category: 'hebrew', style: 'handwriting' },
];

// ==========================================
// רשימת גופנים אנגליים - Google Fonts
// פונטים פופולריים בקאנבה ועיצוב גרפי
// ==========================================
export const ENGLISH_FONTS: FontOption[] = [
  // Sans-Serif - מודרני ונקי
  { family: 'Roboto', name: 'Roboto', weights: [100, 300, 400, 500, 700, 900], category: 'english', style: 'sans-serif' },
  { family: 'Open Sans', name: 'Open Sans', weights: [300, 400, 500, 600, 700, 800], category: 'english', style: 'sans-serif' },
  { family: 'Montserrat', name: 'Montserrat', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], category: 'english', style: 'sans-serif' },
  { family: 'Poppins', name: 'Poppins', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], category: 'english', style: 'sans-serif' },
  { family: 'Raleway', name: 'Raleway', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], category: 'english', style: 'sans-serif' },
  { family: 'Nunito', name: 'Nunito', weights: [200, 300, 400, 500, 600, 700, 800, 900], category: 'english', style: 'sans-serif' },
  { family: 'Oswald', name: 'Oswald', weights: [200, 300, 400, 500, 600, 700], category: 'english', style: 'sans-serif' },
  { family: 'Quicksand', name: 'Quicksand', weights: [300, 400, 500, 600, 700], category: 'english', style: 'sans-serif' },
  
  // Serif - קלאסי ואלגנטי
  { family: 'Playfair Display', name: 'Playfair Display', weights: [400, 500, 600, 700, 800, 900], category: 'english', style: 'serif' },
  { family: 'Merriweather', name: 'Merriweather', weights: [300, 400, 700, 900], category: 'english', style: 'serif' },
  { family: 'Lora', name: 'Lora', weights: [400, 500, 600, 700], category: 'english', style: 'serif' },
  { family: 'Cormorant Garamond', name: 'Cormorant', weights: [300, 400, 500, 600, 700], category: 'english', style: 'serif' },
  { family: 'Cinzel', name: 'Cinzel', weights: [400, 500, 600, 700, 800, 900], category: 'english', style: 'serif' },
  { family: 'Libre Baskerville', name: 'Libre Baskerville', weights: [400, 700], category: 'english', style: 'serif' },
  
  // Display - כותרות ועיצוב
  { family: 'Bebas Neue', name: 'Bebas Neue', weights: [400], category: 'english', style: 'display' },
  { family: 'Anton', name: 'Anton', weights: [400], category: 'english', style: 'display' },
  { family: 'Abril Fatface', name: 'Abril Fatface', weights: [400], category: 'english', style: 'display' },
  { family: 'Righteous', name: 'Righteous', weights: [400], category: 'english', style: 'display' },
  { family: 'Permanent Marker', name: 'Permanent Marker', weights: [400], category: 'english', style: 'display' },
  
  // Handwriting - כתב יד אלגנטי לחתונות
  { family: 'Dancing Script', name: 'Dancing Script', weights: [400, 500, 600, 700], category: 'english', style: 'handwriting' },
  { family: 'Great Vibes', name: 'Great Vibes', weights: [400], category: 'english', style: 'handwriting' },
  { family: 'Pacifico', name: 'Pacifico', weights: [400], category: 'english', style: 'handwriting' },
  { family: 'Sacramento', name: 'Sacramento', weights: [400], category: 'english', style: 'handwriting' },
  { family: 'Alex Brush', name: 'Alex Brush', weights: [400], category: 'english', style: 'handwriting' },
  { family: 'Allura', name: 'Allura', weights: [400], category: 'english', style: 'handwriting' },
  { family: 'Tangerine', name: 'Tangerine', weights: [400, 700], category: 'english', style: 'handwriting' },
  { family: 'Pinyon Script', name: 'Pinyon Script', weights: [400], category: 'english', style: 'handwriting' },
  { family: 'Italianno', name: 'Italianno', weights: [400], category: 'english', style: 'handwriting' },
  { family: 'Lobster', name: 'Lobster', weights: [400], category: 'english', style: 'handwriting' },
  { family: 'Mr Dafoe', name: 'Mr Dafoe', weights: [400], category: 'english', style: 'handwriting' },
  
  // Wedding Scripts - פונטים מיוחדים לחתונות
  { family: 'Clicker Script', name: 'Clicker Script', weights: [400], category: 'english', style: 'handwriting' },
  { family: 'Engagement', name: 'Engagement', weights: [400], category: 'english', style: 'handwriting' },
  { family: 'Style Script', name: 'Style Script', weights: [400], category: 'english', style: 'handwriting' },
  { family: 'Waterfall', name: 'Waterfall', weights: [400], category: 'english', style: 'handwriting' },
];

// ברירות מחדל - מותאם לקנבס 2500px
export const DEFAULT_TEXT_ELEMENT: Partial<TextElement> = {
  type: 'text',
  text: 'טקסט חדש',
  fontFamily: 'Heebo',
  fontSize: 72, // Larger for 2500px canvas
  fontStyle: 'normal',
  fontWeight: 400,
  fill: '#000000',
  textAlign: 'center',
  direction: 'rtl',
  lineHeight: 1.2,
  letterSpacing: 0,
  opacity: 1,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  isLocked: false,
  isVisible: true,
};

export const DEFAULT_SHAPE_ELEMENT: Partial<ShapeElement> = {
  type: 'shape',
  shapeType: 'rectangle',
  fill: '#6366f1',
  stroke: '#4f46e5',
  strokeWidth: 0,
  cornerRadius: 0,
  opacity: 1,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  isLocked: false,
  isVisible: true,
};
