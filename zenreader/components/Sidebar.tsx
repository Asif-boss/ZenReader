import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { Search, Grid, SearchX } from 'lucide-react';
import { PDFDocumentProxy, SearchResult } from '../types';

interface SidebarProps {
  file: File | null;
  numPages: number | null;
  currentPage: number;
  onPageClick: (page: number) => void;
  pdfProxy: PDFDocumentProxy | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  file,
  numPages,
  currentPage,
  onPageClick,
  pdfProxy
}) => {
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'search'>('thumbnails');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !pdfProxy) return;

    setIsSearching(true);
    setSearchResults([]);
    const results: SearchResult[] = [];

    try {
      // Basic text search implementation
      for (let i = 1; i <= (numPages || 0); i++) {
        const page = await pdfProxy.getPage(i);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(' ');
        
        if (text.toLowerCase().includes(searchQuery.toLowerCase())) {
          // Find context snippet
          const index = text.toLowerCase().indexOf(searchQuery.toLowerCase());
          const snippet = text.substring(Math.max(0, index - 20), Math.min(text.length, index + 40));
          
          results.push({
            page: i,
            matchText: `...${snippet}...`,
            index
          });
        }
      }
      setSearchResults(results);
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setIsSearching(false);
    }
  };

  if (!file) return <div className="w-full h-full" />;

  return (
    <div className="w-full h-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 flex flex-col shadow-xl rounded-2xl overflow-hidden transition-all duration-300">
      {/* Tab Controls */}
      <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-black/20">
        <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('thumbnails')}
            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 rounded-lg transition-all duration-200 ${
              activeTab === 'thumbnails' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Grid size={14} /> Thumbnails
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 rounded-lg transition-all duration-200 ${
              activeTab === 'search' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Search size={14} /> Search
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {activeTab === 'thumbnails' && (
          <div className="p-4 space-y-4 flex flex-col items-center">
            <Document file={file}>
               {numPages && Array.from(new Array(numPages), (el, index) => (
                 <div 
                    key={`thumb-${index + 1}`}
                    onClick={() => onPageClick(index + 1)}
                    className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] rounded-xl overflow-hidden border-2 bg-white dark:bg-gray-800 ${
                        currentPage === index + 1 
                        ? 'border-blue-500 shadow-lg ring-4 ring-blue-500/10' 
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'
                    }`}
                 >
                    <div className="opacity-90 hover:opacity-100 transition-opacity">
                        <Page 
                            pageNumber={index + 1} 
                            width={180} 
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            loading={<div className="w-[180px] h-[240px] bg-white/10 animate-pulse" />}
                        />
                    </div>
                    <div className="text-center text-[10px] text-gray-500 dark:text-gray-400 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 font-semibold tracking-wide">
                        Page {index + 1}
                    </div>
                 </div>
               ))}
            </Document>
          </div>
        )}

        {activeTab === 'search' && (
            <div className="flex flex-col h-full">
                <form onSubmit={handleSearch} className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="relative group">
                        <input 
                            type="text" 
                            placeholder="Find in document..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 outline-none transition-all shadow-sm focus:ring-2 focus:ring-blue-500/20"
                        />
                        <Search className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500" size={14} />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSearching}
                        className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wide disabled:opacity-50 transition-all shadow-md active:scale-95"
                    >
                        {isSearching ? 'Searching...' : 'Find Matches'}
                    </button>
                </form>

                <div className="flex-1 overflow-y-auto p-2">
                    {searchResults.length === 0 && !isSearching && searchQuery && (
                         <div className="flex flex-col items-center justify-center mt-10 text-gray-400">
                            <SearchX size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">No matches found</p>
                         </div>
                    )}
                    {searchResults.map((result, idx) => (
                        <div 
                            key={idx}
                            onClick={() => onPageClick(result.page)}
                            className="p-3 mb-2 bg-white/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-all group"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md uppercase tracking-wider">Page {result.page}</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                                {result.matchText}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};