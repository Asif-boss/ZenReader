

import React, { useState, useEffect, useRef } from 'react';
import { 
  MousePointer2, 
  Hand,
  Highlighter, 
  PenTool, 
  Square, 
  Circle, 
  Type, 
  StickyNote, 
  Undo2, 
  Redo2,
  Underline,
  Strikethrough,
  MoveUpRight,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Brush,
  Check,
  Save,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { AnnotationTool, AnnotationColor } from '../types';

interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  activeColor: string;
  onToolChange: (tool: AnnotationTool) => void;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: (type: 'pdf' | 'json') => void;
  pageNumber: number;
  scale: number;
  numPages: number | null;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const COLORS: { hex: AnnotationColor, name: string }[] = [
  { hex: '#000000', name: 'Black' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#f59e0b', name: 'Orange' },
  { hex: '#10b981', name: 'Green' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#8b5cf6', name: 'Purple' },
  { hex: '#ec4899', name: 'Pink' },
];

// Extracted components to prevent re-mounting on render
const ToolbarButton = ({ 
  icon: Icon, 
  title,
  isActive = false,
  onClick,
  disabled = false,
  className = ""
}: { 
  icon: any; 
  title: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) => {
  return (
    <button
      onClick={(e) => { 
        e.preventDefault();
        e.stopPropagation(); 
        if (!disabled) onClick();
      }}
      disabled={disabled}
      title={title}
      type="button"
      className={`relative p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center group outline-none select-none ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-105' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
      } ${disabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''} ${className}`}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
    </button>
  );
};

const Divider = () => <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />;

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  activeTool,
  activeColor,
  onToolChange,
  onColorChange,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  onSave,
  pageNumber,
  scale,
  numPages,
  onPrevPage,
  onNextPage,
  onPageChange,
  onZoomIn,
  onZoomOut
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pageInput, setPageInput] = useState(pageNumber.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageInput(pageNumber.toString());
  }, [pageNumber]);

  const handlePageSubmit = () => {
    const newPage = parseInt(pageInput);
    if (!isNaN(newPage) && newPage >= 1 && numPages && newPage <= numPages) {
      if (newPage !== pageNumber) {
        onPageChange(newPage);
      }
    } else {
      setPageInput(pageNumber.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  // Fixed positioning relative to the screen (viewport) ensures it stays at the bottom
  // regardless of container scrolling or layout.
  const positionClass = "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-pop-in";

  if (isMinimized) {
      return (
          <div className={`${positionClass} pointer-events-auto`}>
              <button
                onClick={() => setIsMinimized(false)}
                className="h-10 px-4 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 text-blue-600 hover:scale-105 transition-transform font-medium text-sm"
                title="Show Toolbar"
              >
                  <Maximize2 size={16} />
                  <span>Show Toolbar</span>
              </button>
          </div>
      );
  }

  return (
    <div className={`${positionClass} flex flex-col items-center w-full max-w-fit px-4 pointer-events-none`}>
      
      {/* Popovers Layer */}
      <div className="relative w-full flex justify-center pointer-events-auto">
          {/* Color Picker Popover */}
          <div className={`absolute bottom-full mb-3 transition-all duration-300 origin-bottom ${showColorPicker ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
            <div 
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-gray-200 dark:border-gray-700 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
            >
            {COLORS.map(({ hex, name }) => (
                <button
                    key={hex}
                    onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onColorChange(hex);
                    setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center relative ${
                    activeColor === hex ? 'border-blue-500 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={name}
                >
                    {activeColor === hex && <Check size={12} className="text-white drop-shadow-md" />}
                </button>
                ))}
            </div>
          </div>
      </div>

      {/* Main Dock Container */}
      <div 
        className="flex items-center gap-1.5 px-2 py-1.5 bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur-lg border border-gray-200 dark:border-gray-800 shadow-2xl rounded-xl select-none pointer-events-auto animate-slide-up"
        onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(false);
        }}
      >
        
        {/* GROUP 1: Navigation */}
        <div className="flex items-center bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-0.5 border border-gray-200/50 dark:border-gray-700/50">
             <button 
                onClick={onPrevPage}
                disabled={pageNumber <= 1}
                className="p-1 rounded-md hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm text-gray-500 dark:text-gray-400 disabled:opacity-30 transition-all"
             >
                <ChevronLeft size={16} />
             </button>

             <div className="flex items-center px-1 font-mono">
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageSubmit}
                    onKeyDown={handleKeyDown}
                    className="w-7 bg-transparent text-center text-xs font-bold text-gray-900 dark:text-white outline-none focus:text-blue-600 selection:bg-blue-100"
                />
                <span className="text-gray-400 text-xs mx-0.5">/</span>
                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium min-w-[1.2rem] text-center">
                    {numPages || '--'}
                </span>
             </div>

             <button 
                onClick={onNextPage}
                disabled={!numPages || pageNumber >= numPages}
                className="p-1 rounded-md hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm text-gray-500 dark:text-gray-400 disabled:opacity-30 transition-all"
             >
                <ChevronRight size={16} />
             </button>
        </div>

        {/* GROUP 2: Zoom */}
        <div className="hidden md:flex items-center bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-0.5 border border-gray-200/50 dark:border-gray-700/50">
            <button onClick={onZoomOut} className="p-1 rounded-md hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm text-gray-500 dark:text-gray-400">
                <Minus size={14} />
            </button>
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 w-8 text-center">
                {Math.round(scale * 100)}%
            </span>
            <button onClick={onZoomIn} className="p-1 rounded-md hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm text-gray-500 dark:text-gray-400">
                <Plus size={14} />
            </button>
        </div>

        <Divider />

        {/* GROUP 3: General Tools */}
        <div className="flex items-center gap-0.5">
            <ToolbarButton 
                icon={MousePointer2} 
                title="Select Tool (V)" 
                isActive={activeTool === 'cursor'} 
                onClick={() => onToolChange('cursor')} 
            />
            <ToolbarButton 
                icon={Hand} 
                title="Hand Tool (Select/Move Annotations)" 
                isActive={activeTool === 'hand'} 
                onClick={() => onToolChange('hand')} 
            />
            <ToolbarButton 
                icon={Type} 
                title="Add Text" 
                isActive={activeTool === 'text'} 
                onClick={() => onToolChange('text')} 
            />
            <ToolbarButton 
                icon={StickyNote} 
                title="Add Note" 
                isActive={activeTool === 'note'} 
                onClick={() => onToolChange('note')} 
            />
        </div>

        <Divider />

        {/* GROUP 4: Annotation Tools */}
        <div className="flex items-center gap-0.5">
            <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5">
                    <ToolbarButton 
                        icon={Highlighter} 
                        title="Highlight" 
                        isActive={activeTool === 'highlight'} 
                        onClick={() => onToolChange('highlight')} 
                    />
                    <ToolbarButton 
                        icon={Underline} 
                        title="Underline" 
                        isActive={activeTool === 'underline'} 
                        onClick={() => onToolChange('underline')} 
                    />
                </div>
            </div>
            <div className="flex gap-0.5">
                <ToolbarButton 
                    icon={Strikethrough} 
                    title="Strikethrough" 
                    isActive={activeTool === 'strikethrough'} 
                    onClick={() => onToolChange('strikethrough')} 
                />
                <ToolbarButton 
                    icon={PenTool} 
                    title="Pen" 
                    isActive={activeTool === 'pen'} 
                    onClick={() => onToolChange('pen')} 
                />
                <ToolbarButton 
                    icon={Brush} 
                    title="Marker" 
                    isActive={activeTool === 'marker'} 
                    onClick={() => onToolChange('marker')} 
                />
            </div>
        </div>

        <Divider />

        {/* GROUP 5: Shapes */}
        <div className="flex items-center gap-0.5">
            <ToolbarButton 
                icon={Square} 
                title="Rectangle" 
                isActive={activeTool === 'box'} 
                onClick={() => onToolChange('box')} 
            />
            <ToolbarButton 
                icon={Circle} 
                title="Circle" 
                isActive={activeTool === 'circle'} 
                onClick={() => onToolChange('circle')} 
            />
            <ToolbarButton 
                icon={MoveUpRight} 
                title="Arrow" 
                isActive={activeTool === 'arrow'} 
                onClick={() => onToolChange('arrow')} 
            />
        </div>

        <Divider />

        {/* GROUP 6: Properties & Actions */}
        <div className="flex items-center gap-1.5 pl-0.5">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    showColorPicker ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Color Picker"
            >
                <div 
                    className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-700 shadow-sm ring-1 ring-gray-200 dark:ring-gray-600"
                    style={{ backgroundColor: activeColor }}
                />
            </button>
            
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

            <div className="flex items-center gap-0.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-0.5 border border-gray-200/50 dark:border-gray-700/50">
                <ToolbarButton 
                    icon={Undo2} 
                    title="Undo" 
                    onClick={onUndo} 
                    disabled={!canUndo} 
                />
                <ToolbarButton 
                    icon={Redo2} 
                    title="Redo" 
                    onClick={onRedo} 
                    disabled={!canRedo} 
                />
            </div>

            <ToolbarButton 
                icon={Save} 
                title="Save PDF" 
                onClick={() => onSave('pdf')} 
                className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            />
            
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Hide Toolbar"
            >
              <Minimize2 size={16} />
            </button>
        </div>

      </div>
    </div>
  );
};