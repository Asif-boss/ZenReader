

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

export interface PDFPageProxy {
  getTextContent: () => Promise<{ items: { str: string }[] }>;
  render: (params: any) => any;
  view: number[];
}

// --- Annotation Types ---

export type AnnotationTool = 
  | 'cursor' 
  | 'hand'
  | 'highlight' 
  | 'underline' 
  | 'strikethrough' 
  | 'pen' 
  | 'marker' 
  | 'box' 
  | 'circle' 
  | 'arrow' 
  | 'text' 
  | 'note';

export type AnnotationColor = '#ef4444' | '#f59e0b' | '#10b981' | '#3b82f6' | '#8b5cf6' | '#ec4899' | '#000000';

export interface BaseAnnotation {
  id: string;
  page: number;
  type: AnnotationTool;
  color: string;
  createdAt: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight' | 'underline' | 'strikethrough';
  rects: { x: number; y: number; width: number; height: number }[]; // In percentages (0-100)
}

export interface DrawingAnnotation extends BaseAnnotation {
  type: 'pen' | 'marker';
  points: { x: number; y: number }[]; // In percentages
  strokeWidth: number;
  opacity?: number;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: 'box' | 'circle' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  x: number;
  y: number;
  content: string;
  fontSize: number;
}

export interface NoteAnnotation extends BaseAnnotation {
  type: 'note';
  x: number;
  y: number;
  content: string;
  isOpen?: boolean;
}

export type Annotation = 
  | HighlightAnnotation 
  | DrawingAnnotation 
  | ShapeAnnotation 
  | TextAnnotation 
  | NoteAnnotation;

// --- Document Management Types ---

export type ViewLayout = 'single' | 'split-vertical' | 'split-horizontal';

export interface SearchResult {
  page: number;
  matchText: string;
  index: number;
}

export interface DocumentState {
  id: string;
  file: File;
  scale: number;
  rotation: number;
  currentPage: number;
  numPages: number | null;
  annotations: Annotation[];
  deletedAnnotations: Annotation[]; // For Redo stack
  aiMessages: ChatMessage[];
  scrollPosition: number;
  hasUnsavedChanges: boolean;
}