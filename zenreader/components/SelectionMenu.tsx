import React from 'react';
import { 
  Languages, 
  Search, 
  BookOpen, 
  Sparkles, 
  Copy, 
  ExternalLink,
  GraduationCap,
  StickyNote
} from 'lucide-react';

interface SelectionMenuProps {
  x: number;
  y: number;
  text: string;
  onAction: (action: string, text: string) => void;
}

export const SelectionMenu: React.FC<SelectionMenuProps> = ({ x, y, text, onAction }) => {
  // Prevent menu from going off-screen (basic clamping)
  const style: React.CSSProperties = {
    left: `${Math.min(Math.max(x, 0), 90)}%`, // Keep somewhat within % bounds
    top: `${Math.max(y - 12, 0)}%`, // Position above selection
    position: 'absolute',
    transform: 'translate(-50%, -100%)',
    zIndex: 100,
  };

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent losing selection
    onAction(action, text);
  };

  return (
    <div 
      style={style}
      className="flex items-center gap-1 p-1 bg-gray-900/90 backdrop-blur text-white rounded-lg shadow-xl animate-pop-in select-none"
      onMouseDown={(e) => e.stopPropagation()} // Prevent closing on click itself
    >
      <button 
        onClick={(e) => handleAction(e, 'copy')}
        className="p-1.5 hover:bg-white/20 rounded transition-colors" 
        title="Copy"
      >
        <Copy size={14} />
      </button>
      
      <div className="w-px h-4 bg-white/20 mx-0.5" />

      <button 
        onClick={(e) => handleAction(e, 'translate')}
        className="p-1.5 hover:bg-white/20 rounded transition-colors" 
        title="Translate (AI)"
      >
        <Languages size={14} />
      </button>

      <button 
        onClick={(e) => handleAction(e, 'explain')}
        className="p-1.5 hover:bg-white/20 rounded transition-colors" 
        title="Explain (AI)"
      >
        <BookOpen size={14} />
      </button>
      
      <button 
        onClick={(e) => handleAction(e, 'exam')}
        className="p-1.5 hover:bg-white/20 rounded transition-colors" 
        title="Generate Quiz"
      >
        <GraduationCap size={14} />
      </button>
      
       <button 
        onClick={(e) => handleAction(e, 'note')}
        className="p-1.5 hover:bg-white/20 rounded transition-colors" 
        title="Create Note"
      >
        <StickyNote size={14} />
      </button>

      <div className="w-px h-4 bg-white/20 mx-0.5" />

      <button 
        onClick={(e) => handleAction(e, 'google-search')}
        className="p-1.5 hover:bg-white/20 rounded transition-colors flex items-center gap-1 text-[10px] font-bold" 
        title="Google Search"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Google</span>
      </button>
    </div>
  );
};
