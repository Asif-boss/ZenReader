import React from 'react';
import { X, FileText, Plus } from 'lucide-react';
import { DocumentState } from '../types';

interface TabHeaderProps {
  documents: DocumentState[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  documents,
  activeTabId,
  onTabClick,
  onCloseTab,
  onNewTab
}) => {
  return (
    <div className="flex items-center bg-[#f6f5f4] border-b border-gray-300 px-3 pt-3 pb-2 gap-2 overflow-x-auto scrollbar-hide select-none h-20">
      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => onTabClick(doc.id)}
          className={`group relative flex items-center gap-3 px-4 py-3 min-w-[180px] max-w-[260px] h-12 rounded-lg cursor-pointer transition-all duration-200 shadow-sm border ${
            activeTabId === doc.id
              ? 'bg-white border-gray-200 text-gray-900 ring-1 ring-black/5'
              : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}
        >
          <FileText size={18} className={activeTabId === doc.id ? "text-blue-600" : "opacity-50"} />
          <span className="truncate text-sm font-medium flex-1">{doc.file.name}</span>
          <button
            onClick={(e) => onCloseTab(doc.id, e)}
            className="p-1.5 rounded-md hover:bg-gray-300 text-gray-400 hover:text-red-600 transition-colors opacity-100"
            title="Close tab"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      
      <button 
        onClick={onNewTab}
        className="p-3 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-black transition-all active:scale-95 h-12 w-12 flex items-center justify-center"
        title="Open another file"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};