
import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Document, Page } from 'react-pdf';
import { AnnotationLayer } from './AnnotationLayer';
import { AnnotationToolbar } from './AnnotationToolbar';
import { Annotation, AnnotationTool, PDFDocumentProxy } from '../types';
import { Loader2 } from 'lucide-react';

interface PDFViewerProps {
  file: File;
  pageNumber: number; // The target page to scroll to (controlled)
  scale: number;
  rotation: number;
  annotations: Annotation[];
  activeTool: AnnotationTool;
  activeColor: string;
  onPageChange: (page: number) => void;
  onDocumentLoadSuccess: (pdf: PDFDocumentProxy) => void;
  onAddAnnotation: (ann: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onUndoAnnotation: () => void;
  onRedoAnnotation: () => void;
  canRedo: boolean;
  onClearAnnotations: () => void;
  onSelectionAction?: (action: string, text: string) => void;
  setActiveTool: (tool: AnnotationTool) => void;
  setActiveColor: (color: string) => void;
  onSave: (type: 'pdf' | 'json') => void;
  highlightSearchPage?: number;
  // Navigation & Zoom Handlers
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isSidebarOpen: boolean; // Kept in interface to prevent breaking parent type check but unused in logic
}

export interface PDFViewerRef {
  scrollToPage: (page: number) => void;
}

export const PDFViewer = forwardRef<PDFViewerRef, PDFViewerProps>(({
  file,
  pageNumber,
  scale,
  rotation,
  annotations,
  activeTool,
  activeColor,
  onPageChange,
  onDocumentLoadSuccess,
  onAddAnnotation,
  onDeleteAnnotation,
  onUpdateAnnotation,
  onUndoAnnotation,
  onRedoAnnotation,
  canRedo,
  onClearAnnotations,
  onSelectionAction,
  setActiveTool,
  setActiveColor,
  onSave,
  highlightSearchPage,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  // isSidebarOpen is destructured but ignored
}, ref) => {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingProgrammatically = useRef(false);

  const handleLoadSuccess = (pdf: PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    onDocumentLoadSuccess(pdf);
  };

  const scrollToPage = useCallback((targetPage: number) => {
    const element = pageRefs.current[targetPage];
    if (element && containerRef.current) {
      isScrollingProgrammatically.current = true;
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Reset flag after animation approx time
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 500);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    scrollToPage
  }));

  // Sync prop changes to scroll (e.g. from Sidebar click)
  useEffect(() => {
    // We only scroll if the pageNumber change didn't come from our own scroll observer
    // This allows sidebar clicks to work, but prevents fighting during scroll
    if (pageNumber && !isScrollingProgrammatically.current) {
        // We verify if the current visible page is different to avoid jitter
        // But logic is mostly handled by parent calling scrollToPage when needed (like sidebar)
    }
  }, [pageNumber, scrollToPage]);

  // Setup Intersection Observer
  useEffect(() => {
    if (!numPages || !containerRef.current) return;

    const options = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.4
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (isScrollingProgrammatically.current) return;

      // Find the most visible page
      let maxRatio = 0;
      let mostVisiblePage = -1;

      entries.forEach((entry) => {
        if (entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          mostVisiblePage = Number(entry.target.getAttribute('data-page-number'));
        }
      });

      if (mostVisiblePage !== -1) {
        onPageChange(mostVisiblePage);
      }
    }, options);

    Object.values(pageRefs.current).forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [numPages, onPageChange]);

  const pdfContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '2rem',
    paddingBottom: '8rem',
    minHeight: '100%',
    gap: '24px'
  };

  return (
    <div className="flex-1 relative h-full overflow-hidden bg-gray-200/50 flex flex-col">
       <div 
          className="flex-1 overflow-y-auto relative scroll-smooth" 
          ref={containerRef}
        >
            <div style={pdfContainerStyle}>
                <Document
                  file={file}
                  onLoadSuccess={handleLoadSuccess as any}
                  loading={
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                  }
                  error={<div className="text-red-500 mt-10">Failed to load PDF.</div>}
                >
                  {numPages && Array.from(new Array(numPages), (el, index) => {
                    const pageIndex = index + 1;
                    const isSearchResult = highlightSearchPage === pageIndex;
                    return (
                      <div 
                        key={pageIndex}
                        ref={(el) => { pageRefs.current[pageIndex] = el; }}
                        data-page-number={pageIndex}
                        className={`relative shadow-lg transition-all duration-300 ${isSearchResult ? 'ring-4 ring-yellow-400 scale-[1.02]' : ''}`}
                      >
                         <Page 
                            pageNumber={pageIndex} 
                            scale={scale} 
                            rotate={rotation}
                            className="bg-white"
                            loading={<div style={{ width: 600 * scale, height: 800 * scale }} className="bg-white animate-pulse" />}
                            renderTextLayer={true}
                            renderAnnotationLayer={false}
                          />
                          <AnnotationLayer 
                            pageNumber={pageIndex}
                            scale={scale}
                            activeTool={activeTool}
                            activeColor={activeColor}
                            annotations={annotations}
                            onAddAnnotation={(ann) => {
                                onAddAnnotation(ann);
                                if (['text', 'note'].includes(ann.type)) {
                                    setActiveTool('cursor');
                                }
                            }}
                            onDeleteAnnotation={onDeleteAnnotation}
                            onUpdateAnnotation={onUpdateAnnotation}
                            onSelectionAction={onSelectionAction}
                          />
                      </div>
                    );
                  })}
                </Document>
            </div>
        </div>

        {/* Annotation Toolbar (Floating) */}
        <AnnotationToolbar 
            activeTool={activeTool}
            activeColor={activeColor}
            onToolChange={setActiveTool}
            onColorChange={setActiveColor}
            onUndo={onUndoAnnotation}
            onRedo={onRedoAnnotation}
            canRedo={canRedo}
            onClear={onClearAnnotations}
            canUndo={annotations.length > 0}
            onSave={onSave}
            pageNumber={pageNumber}
            scale={scale}
            numPages={numPages}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
            onPageChange={(page) => {
                // When toolbar requests a page change:
                // 1. Scroll to that page specifically
                scrollToPage(page);
                // 2. Notify parent to update state (important because scroll observer is paused during programmatic scroll)
                onPageChange(page);
            }}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
        />
    </div>
  );
});
