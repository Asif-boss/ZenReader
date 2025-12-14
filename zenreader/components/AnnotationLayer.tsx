import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { 
  Annotation, 
  AnnotationTool, 
  TextAnnotation, 
  NoteAnnotation, 
  HighlightAnnotation 
} from '../types';
import { MessageSquare, Trash, X } from 'lucide-react';
import { SelectionMenu } from './SelectionMenu';

interface AnnotationLayerProps {
  pageNumber: number;
  scale: number;
  activeTool: AnnotationTool;
  activeColor: string;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onSelectionAction?: (action: string, text: string) => void;
}

// --- Memoized Components ---

const TextAnnotationItem = memo(({ ann, onUpdate, onDelete, isHandTool, isSelected, onSelect }: { ann: TextAnnotation, onUpdate: any, onDelete: any, isHandTool: boolean, isSelected: boolean, onSelect: any }) => {
    const [localContent, setLocalContent] = useState(ann.content);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if(textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalContent(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const handleBlur = () => {
        if (localContent !== ann.content) {
            onUpdate(ann.id, { content: localContent });
        }
    };

    return (
        <div
            className={`absolute z-20 group transition-all ${isHandTool ? 'cursor-pointer' : 'pointer-events-auto'}`}
            style={{ 
                left: `${ann.x}%`, 
                top: `${ann.y}%`,
                border: isSelected ? '2px dashed #3b82f6' : 'none',
                padding: isSelected ? '4px' : '0'
            }}
            onClick={(e) => {
                if (isHandTool) {
                    e.stopPropagation();
                    onSelect(ann.id);
                }
            }}
        >
            <textarea 
                ref={textAreaRef}
                value={localContent}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Type..."
                autoFocus={ann.content === ''}
                readOnly={isHandTool}
                className={`bg-transparent outline-none font-medium resize-none overflow-hidden leading-tight p-1.5 rounded transition-all ${!isHandTool ? 'border border-dashed border-gray-300 hover:border-blue-400 focus:border-blue-500 shadow-sm focus:shadow-md focus:bg-white/90' : 'cursor-pointer'}`}
                style={{ 
                    fontSize: `${Math.max(12, ann.fontSize)}px`, 
                    color: ann.color,
                    minWidth: '150px',
                    height: 'auto'
                }}
                onMouseDown={e => e.stopPropagation()} 
                onClick={e => {
                     if (!isHandTool) e.stopPropagation();
                }}
            />
            
            {/* Standard Delete Button (Always available in edit mode, or if selected in hand mode) */}
            {(isSelected || (!isHandTool && !isSelected)) && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(ann.id); }}
                    className={`${isHandTool ? 'flex' : 'hidden group-hover:flex'} absolute -top-3 -right-3 text-white bg-red-500 shadow-md rounded-full p-1.5 scale-90 hover:scale-100 transition-transform z-30`}
                    title="Delete Text"
                    onMouseDown={e => e.stopPropagation()}
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
});

const NoteAnnotationItem = memo(({ ann, onUpdate, onDelete, isHandTool, isSelected, onSelect }: { ann: NoteAnnotation, onUpdate: any, onDelete: any, isHandTool: boolean, isSelected: boolean, onSelect: any }) => {
    const [localContent, setLocalContent] = useState(ann.content);

    const handleBlur = () => {
         if (localContent !== ann.content) {
            onUpdate(ann.id, { content: localContent });
        }
    };

    return (
        <div 
            className={`absolute z-20 pointer-events-auto ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-full' : ''}`}
            style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
            onClick={(e) => {
                if (isHandTool) {
                    e.stopPropagation();
                    onSelect(ann.id);
                } else {
                    e.stopPropagation();
                }
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <button 
                onClick={(e) => {
                        if (isHandTool) return;
                        e.stopPropagation();
                        onUpdate(ann.id, { isOpen: !ann.isOpen });
                }}
                className={`text-yellow-500 hover:text-yellow-600 drop-shadow-md bg-white rounded-full p-1 transition-transform hover:scale-110 ${isHandTool ? 'cursor-pointer' : ''}`}
            >
                <MessageSquare size={20} fill={ann.color} color="white" />
            </button>
            
            {isSelected && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(ann.id); }}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-sm z-30"
                >
                    <X size={10} />
                </button>
            )}
            
            {!isHandTool && ann.isOpen && (
                <div 
                    className="absolute top-8 left-0 w-64 bg-yellow-50 border border-yellow-200 shadow-xl rounded-xl p-3 animate-pop-in z-30 cursor-auto flex flex-col gap-2"
                    onMouseDown={e => e.stopPropagation()} 
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center border-b border-yellow-100 pb-1">
                        <span className="text-xs font-bold text-yellow-700">Sticky Note</span>
                        <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); onDelete(ann.id); }} className="text-red-400 p-1 hover:bg-red-50 hover:text-red-600 rounded transition-colors">
                                <Trash size={12} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onUpdate(ann.id, { isOpen: false }); }} className="text-gray-400 p-1 hover:bg-gray-100 hover:text-gray-600 rounded transition-colors">
                                <X size={12} />
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={localContent}
                        onChange={(e) => setLocalContent(e.target.value)}
                        onBlur={handleBlur}
                        className="w-full h-24 bg-transparent resize-none text-sm text-gray-800 outline-none placeholder-gray-400"
                        placeholder="Write your note here..."
                        autoFocus
                    />
                </div>
            )}
        </div>
    );
});

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  pageNumber,
  scale,
  activeTool,
  activeColor,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  onUpdateAnnotation,
  onSelectionAction
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{x: number, y: number} | null>(null);
  
  // Selection State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectionMenu, setSelectionMenu] = useState<{x: number, y: number, text: string} | null>(null);

  const pageAnnotations = annotations.filter(a => a.page === pageNumber);
  const isDrawingTool = ['pen', 'marker', 'box', 'circle', 'arrow', 'text', 'note'].includes(activeTool);
  const isHandTool = activeTool === 'hand';

  // Reset selection on tool change
  useEffect(() => {
    setIsDrawing(false);
    setStartPoint(null);
    setDragCurrent(null);
    setCurrentPath([]);
    setSelectionMenu(null);
    setSelectedId(null);
  }, [activeTool]);

  // Handle Delete Key
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
              onDeleteAnnotation(selectedId);
              setSelectedId(null);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, onDeleteAnnotation]);

  const getRelativeCoords = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const xRaw = ((e.clientX - rect.left) / rect.width) * 100;
    const yRaw = ((e.clientY - rect.top) / rect.height) * 100;
    return { 
        x: Math.max(0, Math.min(100, xRaw)), 
        y: Math.max(0, Math.min(100, yRaw)) 
    };
  };

  // --- SELECTION HANDLER ---
  const handleSelectionChange = useCallback(() => {
    if (activeTool !== 'cursor') {
        setSelectionMenu(null);
        return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) {
        setSelectionMenu(null);
        return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Check if selection is primarily inside this page
    if (
        rect.top >= containerRect.top && 
        rect.bottom <= containerRect.bottom &&
        rect.left >= containerRect.left &&
        rect.right <= containerRect.right
    ) {
        const text = selection.toString().trim();
        if (text.length > 0) {
            const x = ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100;
            const y = ((rect.top - containerRect.top) / containerRect.height) * 100;
            setSelectionMenu({ x, y, text });
            return;
        }
    }
    setSelectionMenu(null);
  }, [activeTool]);

  const handleGlobalMouseUp = useCallback(() => {
      setTimeout(handleSelectionChange, 10);
      if (['highlight', 'underline', 'strikethrough'].includes(activeTool)) {
         handleTextHighlight();
      }
  }, [handleSelectionChange, activeTool]);
  
  const handleTextHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) return;

    const pageRects = Array.from(rects).filter(rect => {
        return (
            rect.top + rect.height > containerRect.top &&
            rect.top < containerRect.bottom &&
            rect.left + rect.width > containerRect.left &&
            rect.left < containerRect.right
        );
    });

    if (pageRects.length === 0) return;

    const relativeRects = pageRects.map(rect => ({
      x: ((rect.left - containerRect.left) / containerRect.width) * 100,
      y: ((rect.top - containerRect.top) / containerRect.height) * 100,
      width: (rect.width / containerRect.width) * 100,
      height: (rect.height / containerRect.height) * 100
    }));

    if (relativeRects.length > 0) {
      const newHighlight: HighlightAnnotation = {
        id: Date.now().toString(),
        page: pageNumber,
        type: activeTool as any,
        color: activeColor,
        createdAt: Date.now(),
        rects: relativeRects
      };
      onAddAnnotation(newHighlight);
      selection.removeAllRanges();
    }
  };

  useEffect(() => {
     document.addEventListener('mouseup', handleGlobalMouseUp);
     return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleGlobalMouseUp]);


  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    // Clear selections if clicking background in hand mode
    if (isHandTool && e.target === containerRef.current) {
        setSelectedId(null);
    }

    if (activeTool === 'cursor' && e.target !== containerRef.current) {
    } else {
        if (selectionMenu) setSelectionMenu(null);
    }
    
    if (!isDrawingTool) return;
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    
    e.preventDefault(); 
    
    const coords = getRelativeCoords(e);
    setStartPoint(coords);
    setIsDrawing(true);

    if (activeTool === 'pen' || activeTool === 'marker') {
      setCurrentPath([coords]);
    } else if (activeTool === 'note') {
      onAddAnnotation({
        id: Date.now().toString(),
        page: pageNumber,
        type: 'note',
        color: activeColor,
        createdAt: Date.now(),
        x: coords.x,
        y: coords.y,
        content: '',
        isOpen: true
      });
      setIsDrawing(false);
    } else if (activeTool === 'text') {
      onAddAnnotation({
        id: Date.now().toString(),
        page: pageNumber,
        type: 'text',
        color: activeColor,
        createdAt: Date.now(),
        x: coords.x,
        y: coords.y,
        content: '',
        fontSize: 16
      });
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;
    const coords = getRelativeCoords(e);

    if (activeTool === 'pen' || activeTool === 'marker') {
      setCurrentPath(prev => [...prev, coords]);
    } else {
      setDragCurrent(coords);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;

    if ((activeTool === 'pen' || activeTool === 'marker') && currentPath.length > 1) {
          const isMarker = activeTool === 'marker';
          onAddAnnotation({
            id: Date.now().toString(),
            page: pageNumber,
            type: activeTool,
            color: activeColor,
            createdAt: Date.now(),
            points: currentPath,
            strokeWidth: isMarker ? 1.5 : 0.3, 
            opacity: isMarker ? 0.4 : 1
          });
    } else if (['box', 'circle', 'arrow'].includes(activeTool) && dragCurrent) {
        const width = dragCurrent.x - startPoint.x;
        const height = dragCurrent.y - startPoint.y;
        
        if (Math.abs(width) > 1 || Math.abs(height) > 1) {
            onAddAnnotation({
                id: Date.now().toString(),
                page: pageNumber,
                type: activeTool as any,
                color: activeColor,
                createdAt: Date.now(),
                x: startPoint.x,
                y: startPoint.y,
                width: width,
                height: height,
                strokeWidth: 0.3
            });
        }
    }

    setIsDrawing(false);
    setCurrentPath([]);
    setStartPoint(null);
    setDragCurrent(null);
  };

  // Helper to calculate SVG bounding box for visual selection
  const getSvgBounds = (ann: Annotation) => {
      let x = 0, y = 0, w = 0, h = 0;
      if (ann.type === 'pen' || ann.type === 'marker') {
          if ('points' in ann) {
              const xs = ann.points.map(p => p.x);
              const ys = ann.points.map(p => p.y);
              x = Math.min(...xs);
              y = Math.min(...ys);
              w = Math.max(...xs) - x;
              h = Math.max(...ys) - y;
          }
      } else if (ann.type === 'box' || ann.type === 'circle' || ann.type === 'arrow') {
          if ('x' in ann) {
             x = Math.min(ann.x, ann.x + ann.width);
             y = Math.min(ann.y, ann.y + ann.height);
             w = Math.abs(ann.width);
             h = Math.abs(ann.height);
          }
      }
      return { x, y, w, h };
  };

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 z-10 outline-none ${isDrawingTool || isHandTool ? 'pointer-events-auto' : 'pointer-events-none'} ${isDrawingTool ? 'cursor-crosshair' : ''} ${isHandTool ? 'cursor-default' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {selectionMenu && (
          <div className="pointer-events-auto">
            <SelectionMenu 
                x={selectionMenu.x} 
                y={selectionMenu.y} 
                text={selectionMenu.text} 
                onAction={(action, text) => {
                    if (onSelectionAction) onSelectionAction(action, text);
                    setSelectionMenu(null);
                    window.getSelection()?.removeAllRanges();
                }}
            />
          </div>
      )}

      {/* Render Selected Box for SVGs */}
      {selectedId && isHandTool && pageAnnotations.find(a => a.id === selectedId && ['pen', 'marker', 'box', 'circle', 'arrow'].includes(a.type)) && (
          (() => {
              const ann = pageAnnotations.find(a => a.id === selectedId)!;
              const { x, y, w, h } = getSvgBounds(ann);
              // Add a bit of padding
              const p = 1; 
              return (
                  <div 
                    className="absolute border-2 border-dashed border-blue-500 z-50 pointer-events-none"
                    style={{
                        left: `${x - p}%`,
                        top: `${y - p}%`,
                        width: `${w + p*2}%`,
                        height: `${h + p*2}%`
                    }}
                  >
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteAnnotation(ann.id); setSelectedId(null); }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md pointer-events-auto hover:scale-110 transition-transform"
                        onMouseDown={e => e.stopPropagation()}
                      >
                          <X size={12} />
                      </button>
                  </div>
              );
          })()
      )}

      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none" 
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      >
        <defs>
            {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#000000'].map(c => (
                <marker 
                    key={`arrow-${c}`} 
                    id={`arrowhead-${c.replace('#', '')}`} 
                    markerWidth="6" 
                    markerHeight="6" 
                    refX="5" 
                    refY="3" 
                    orient="auto"
                >
                    <path d="M0,0 L6,3 L0,6" fill={c} />
                </marker>
            ))}
        </defs>

        {pageAnnotations.map(ann => {
            const commonProps = {
                key: ann.id,
                className: `${isHandTool ? 'pointer-events-auto cursor-pointer' : ''}`,
                onClick: (e: any) => {
                    if(isHandTool) {
                        e.stopPropagation();
                        setSelectedId(ann.id);
                    }
                }
            };
            
            // For click detection on thin lines, we might need a transparent wider stroke
            // simplified here by assuming user clicks accurately or stroke is wide enough.
            // Pointer events stroke helps.

            switch(ann.type) {
                case 'pen': 
                case 'marker':
                    return <path 
                        {...commonProps}
                        d={`M ${ann.points.map(p => `${p.x},${p.y}`).join(' L ')}`} 
                        stroke={ann.color} 
                        strokeWidth={ann.strokeWidth}
                        strokeOpacity={ann.opacity || 1}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none" 
                    />
                case 'box':
                    return <rect
                        {...commonProps}
                        x={Math.min(ann.x, ann.x + ann.width)}
                        y={Math.min(ann.y, ann.y + ann.height)}
                        width={Math.abs(ann.width)}
                        height={Math.abs(ann.height)}
                        stroke={ann.color}
                        strokeWidth="0.3"
                        fill="none"
                    />;
                case 'circle':
                    return <ellipse
                        {...commonProps}
                        cx={ann.x + ann.width/2}
                        cy={ann.y + ann.height/2}
                        rx={Math.abs(ann.width)/2}
                        ry={Math.abs(ann.height)/2}
                        stroke={ann.color}
                        strokeWidth="0.3"
                        fill="none"
                    />;
                case 'arrow':
                    return <line
                        {...commonProps}
                        x1={ann.x}
                        y1={ann.y}
                        x2={ann.x + ann.width}
                        y2={ann.y + ann.height}
                        stroke={ann.color}
                        strokeWidth="0.3"
                        markerEnd={`url(#arrowhead-${ann.color.replace('#', '')})`}
                    />;
                default: return null;
            }
        })}

        {isDrawing && (activeTool === 'pen' || activeTool === 'marker') && currentPath.length > 0 && (
           <path 
             d={`M ${currentPath.map(p => `${p.x},${p.y}`).join(' L ')}`}
             stroke={activeColor}
             strokeWidth={activeTool === 'marker' ? 1.5 : 0.3}
             strokeOpacity={activeTool === 'marker' ? 0.4 : 1}
             strokeLinecap="round"
             strokeLinejoin="round"
             fill="none"
           />
        )}
        
        {isDrawing && dragCurrent && startPoint && (
             activeTool === 'box' ? (
                <rect
                    x={Math.min(startPoint.x, dragCurrent.x)}
                    y={Math.min(startPoint.y, dragCurrent.y)}
                    width={Math.abs(dragCurrent.x - startPoint.x)}
                    height={Math.abs(dragCurrent.y - startPoint.y)}
                    stroke={activeColor}
                    strokeWidth="0.3"
                    fill="none"
                />
             ) : activeTool === 'circle' ? (
                <ellipse
                    cx={(startPoint.x + dragCurrent.x)/2}
                    cy={(startPoint.y + dragCurrent.y)/2}
                    rx={Math.abs(dragCurrent.x - startPoint.x)/2}
                    ry={Math.abs(dragCurrent.y - startPoint.y)/2}
                    stroke={activeColor}
                    strokeWidth="0.3"
                    fill="none"
                />
             ) : activeTool === 'arrow' ? (
                 <line
                    x1={startPoint.x}
                    y1={startPoint.y}
                    x2={dragCurrent.x}
                    y2={dragCurrent.y}
                    stroke={activeColor}
                    strokeWidth="0.3"
                    markerEnd={`url(#arrowhead-${activeColor.replace('#', '')})`}
                 />
             ) : null
        )}
      </svg>

      {pageAnnotations.map(ann => {
          if (ann.type === 'highlight' || ann.type === 'underline' || ann.type === 'strikethrough') {
              const isSelected = selectedId === ann.id;
              return ann.rects.map((r, i) => (
                  <div
                    key={`${ann.id}-${i}`}
                    className={`absolute hover:opacity-80 transition-opacity group ${isHandTool ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
                    onClick={(e) => {
                        if(isHandTool) {
                            e.stopPropagation();
                            setSelectedId(ann.id);
                        }
                    }}
                    style={{
                        left: `${r.x}%`,
                        top: `${r.y}%`,
                        width: `${r.width}%`,
                        height: `${r.height}%`,
                        backgroundColor: ann.type === 'highlight' ? ann.color : 'transparent',
                        opacity: ann.type === 'highlight' ? 0.3 : 1,
                        borderBottom: ann.type === 'underline' ? `2px solid ${ann.color}` : 'none',
                        border: isSelected ? '2px dashed #3b82f6' : 'none'
                    }}
                  >
                      {ann.type === 'strikethrough' && (
                          <div className="w-full h-[2px] absolute top-1/2" style={{backgroundColor: ann.color}} />
                      )}
                      {(isSelected) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteAnnotation(ann.id); setSelectedId(null); }}
                            className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white p-1 rounded-full shadow-md z-50 scale-75 hover:scale-100 transition-transform flex"
                            onMouseDown={e => e.stopPropagation()}
                          >
                              <Trash size={10} />
                          </button>
                      )}
                  </div>
              ));
          } else if (ann.type === 'text') {
              return <TextAnnotationItem 
                  key={ann.id} 
                  ann={ann} 
                  onUpdate={onUpdateAnnotation} 
                  onDelete={onDeleteAnnotation} 
                  isHandTool={isHandTool}
                  isSelected={selectedId === ann.id}
                  onSelect={setSelectedId}
              />;
          } else if (ann.type === 'note') {
              return <NoteAnnotationItem 
                  key={ann.id} 
                  ann={ann} 
                  onUpdate={onUpdateAnnotation} 
                  onDelete={onDeleteAnnotation} 
                  isHandTool={isHandTool}
                  isSelected={selectedId === ann.id}
                  onSelect={setSelectedId}
              />;
          }
      })}
    </div>
  );
};