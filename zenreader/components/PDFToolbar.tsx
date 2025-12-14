import React, { useRef } from 'react';
import { 
  Sparkles,
  Upload,
  PanelLeft,
  FileText,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from './Button';
import { ViewLayout, DocumentState } from '../types';

interface PDFToolbarProps {
  documents: DocumentState[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onNewTab: () => void;

  fileName: string | null;
  pageNumber: number;
  numPages: number | null;
  scale: number;
  layout: ViewLayout;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onRotate: () => void;
  onToggleAI: () => void;
  onToggleLayout: () => void;
  onToggleSidebar: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isAIActive: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const PDFToolbar: React.FC<PDFToolbarProps> = ({
  documents,
  activeTabId,
  onTabClick,
  onCloseTab,
  onNewTab,

  fileName,
  pageNumber,
  numPages,
  scale,
  onZoomIn,
  onZoomOut,
  onPrevPage,
  onNextPage,
  onToggleAI,
  onToggleSidebar,
  onFileChange,
  isAIActive,
  isDarkMode,
  onToggleTheme
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-16 px-4 flex items-center justify-between z-50 rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
      
      {/* LEFT: Sidebar Toggle & Tabs */}
      <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden">
        <Button 
            variant="icon" 
            onClick={onToggleSidebar} 
            title="Toggle Sidebar"
        >
            <PanelLeft size={20} />
        </Button>
        
        <div className="w-px h-6 bg-gray-300/50 dark:bg-gray-700/50" />

        {/* Tabs Scroll Container */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full py-1">
            {documents.map((doc) => (
                <div
                key={doc.id}
                onClick={() => onTabClick(doc.id)}
                className={`group relative flex items-center gap-2 px-3 py-1.5 min-w-[120px] max-w-[200px] h-9 rounded-lg cursor-pointer transition-all duration-200 border text-xs font-medium shrink-0 ${
                    activeTabId === doc.id
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30 shadow-sm'
                    : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
                >
                    <FileText size={14} className={activeTabId === doc.id ? "text-blue-500" : "opacity-50"} />
                    <span className="truncate flex-1">{doc.file.name}</span>
                    <button
                        onClick={(e) => onCloseTab(doc.id, e)}
                        className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Close tab"
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept=".pdf"
          multiple 
          className="hidden"
          onChange={onFileChange} 
        />
        
        <Button
            variant="ghost"
            onClick={handleOpenClick}
            className="gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
        >
            <Upload size={18} />
            <span className="hidden sm:inline">Open</span>
        </Button>

        <Button 
            variant="icon" 
            onClick={onToggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        <div className="w-px h-5 bg-gray-300/50 dark:bg-gray-700/50 mx-1" />

        <Button 
          variant={isAIActive ? 'primary' : 'glass'} 
          size="sm" 
          onClick={onToggleAI}
          className={`h-9 font-medium rounded-full px-4 border shadow-sm ${
              isAIActive 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Sparkles size={16} className={`mr-2 ${isAIActive ? 'animate-pulse' : ''}`} />
          AI Assistant
        </Button>
      </div>
    </div>
  );
};