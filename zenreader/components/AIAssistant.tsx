import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  X, 
  Bot, 
  Loader2, 
  FileQuestion, 
  Sparkles, 
  GraduationCap, 
  LayoutList, 
  Languages, 
  ArrowRightLeft, 
  Copy, 
  Check,
  Eraser
} from 'lucide-react';
import { ChatMessage } from '../types';
import { translateText } from '../services/geminiService';

export interface AIAssistantStateParams {
  tab: 'chat' | 'tools' | 'translate';
  translationText?: string;
  timestamp: number;
}

interface AIAssistantProps {
  onClose: () => void;
  onSendMessage: (text: string) => Promise<void>;
  onSummarize: () => void;
  onFullDocSummarize: () => void;
  onGenerateExam: () => void;
  onTopicExtraction: () => void;
  messages: ChatMessage[];
  isLoading: boolean;
  currentPageText: string;
  externalState?: AIAssistantStateParams | null;
}

const LANGUAGES = [
  'Bengali', 'Hindi', 'Urdu', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Chinese (Simplified)', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Turkish', 
  'Dutch', 'Polish', 'English', 'Indonesian', 'Vietnamese', 'Thai', 'Hebrew', 
  'Ukrainian', 'Greek', 'Czech', 'Swedish'
];

// --- Markdown Renderer ---
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const sections: React.ReactNode[] = [];
  const lines = content.split('\n');
  let currentList: React.ReactNode[] = [];
  
  const processInline = (text: string, keyPrefix: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={`${keyPrefix}-${i}`} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
  };

  const flushList = () => {
      if (currentList.length > 0) {
          sections.push(
              <ul key={`ul-${sections.length}`} className="list-disc pl-5 mb-3 space-y-1 text-gray-700 dark:text-gray-300">
                  {currentList}
              </ul>
          );
          currentList = [];
      }
  };

  lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (/^[\*\-]\s/.test(trimmed)) {
          currentList.push(
              <li key={`li-${i}`}>
                  {processInline(trimmed.substring(2), `li-${i}`)}
              </li>
          );
      } else {
          flushList();
          if (trimmed.startsWith('### ')) {
              sections.push(<h3 key={`h3-${i}`} className="text-sm font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">{processInline(trimmed.slice(4), `h3-${i}`)}</h3>);
          } else if (trimmed.startsWith('## ')) {
              sections.push(<h2 key={`h2-${i}`} className="text-base font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">{processInline(trimmed.slice(3), `h2-${i}`)}</h2>);
          } else if (trimmed.startsWith('# ')) {
              sections.push(<h1 key={`h1-${i}`} className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">{processInline(trimmed.slice(2), `h1-${i}`)}</h1>);
          } else if (trimmed === '') {
              if (sections.length > 0) sections.push(<div key={`br-${i}`} className="h-2" />);
          } else {
              sections.push(<div key={`p-${i}`} className="mb-1 text-gray-800 dark:text-gray-200 leading-relaxed">{processInline(line, `p-${i}`)}</div>);
          }
      }
  });
  flushList();
  return <div className="markdown-content text-sm">{sections}</div>;
};

export const AIAssistant: React.FC<AIAssistantProps> = ({
  onClose,
  onSendMessage,
  onSummarize,
  onFullDocSummarize,
  onGenerateExam,
  onTopicExtraction,
  messages,
  isLoading,
  currentPageText,
  externalState
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'tools' | 'translate'>('chat');
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Translate State
  const [transInput, setTransInput] = useState('');
  const [transOutput, setTransOutput] = useState('');
  const [targetLang, setTargetLang] = useState('Bengali');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync external state updates (e.g. from context menu)
  useEffect(() => {
    if (externalState) {
      setActiveTab(externalState.tab);
      // Only update input if provided, allowing simple tab switches
      if (externalState.translationText !== undefined) {
        setTransInput(externalState.translationText);
        // Auto translate if text is provided
        if (externalState.translationText) {
             setTransOutput(''); 
        }
      }
    }
  }, [externalState]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeTab]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && !isLoading) {
      onSendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const handleTranslate = async () => {
      if (!transInput.trim()) return;
      setIsTranslating(true);
      const result = await translateText(transInput, targetLang);
      setTransOutput(result);
      setIsTranslating(false);
  };

  const handleCopyTranslation = () => {
      if (!transOutput) return;
      navigator.clipboard.writeText(transOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-2xl relative animate-slide-in-right font-sans rounded-2xl overflow-hidden">
      
      {/* --- HEADER & TABS --- */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-200/50 dark:border-gray-700/50 shrink-0 z-10 bg-white/40 dark:bg-black/20">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                    <Bot size={18} className="text-white" />
                </div>
                <span className="font-bold text-gray-800 dark:text-white tracking-tight">AI Assistant</span>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={18} />
            </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl relative">
            {(['chat', 'tools', 'translate'] as const).map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-200 z-10 ${
                        activeTab === tab 
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                    }`}
                >
                    {tab === 'chat' && <Sparkles size={14} />}
                    {tab === 'tools' && <LayoutList size={14} />}
                    {tab === 'translate' && <Languages size={14} />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            ))}
        </div>
      </div>

      {/* --- CHAT TAB --- */}
      {activeTab === 'chat' && (
        <>
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-50 p-6 text-center">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 ring-1 ring-blue-100 dark:ring-blue-800">
                            <Sparkles size={32} className="text-blue-500 dark:text-blue-400" />
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-semibold mb-1">How can I help?</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">Ask questions about your PDF, summarize content, or generate study notes.</p>
                    </div>
                )}
                
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-sm shadow-blue-500/20' 
                                : 'bg-white/80 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm backdrop-blur-sm'
                        }`}>
                            <MarkdownRenderer content={msg.text} />
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                     <div className="flex justify-start animate-fade-in">
                        <div className="bg-white/80 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-3 backdrop-blur-sm">
                            <Loader2 size={16} className="animate-spin text-blue-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-black/20">
                <form onSubmit={handleChatSubmit} className="relative">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask anything..."
                        disabled={isLoading}
                        className="w-full pl-4 pr-12 py-3 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 shadow-inner"
                    />
                    <button 
                        type="submit" 
                        disabled={!chatInput.trim() || isLoading}
                        className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </>
      )}

      {/* --- TOOLS TAB --- */}
      {activeTab === 'tools' && (
          <div className="flex-1 overflow-y-auto p-4">
             <div className="grid grid-cols-1 gap-3">
                 <ToolCard 
                    icon={FileQuestion} 
                    color="blue" 
                    title="Summarize Page" 
                    desc="Get a quick summary of the currently visible page." 
                    onClick={onSummarize} 
                 />
                 <ToolCard 
                    icon={FileQuestion} 
                    color="purple" 
                    title="Summarize Document" 
                    desc="Analyze the first 10 pages for a full overview." 
                    onClick={onFullDocSummarize} 
                 />
                 <ToolCard 
                    icon={GraduationCap} 
                    color="green" 
                    title="Generate Quiz" 
                    desc="Create 3 MCQs and a short answer question." 
                    onClick={onGenerateExam} 
                 />
                 <ToolCard 
                    icon={LayoutList} 
                    color="orange" 
                    title="Extract Topics" 
                    desc="Identify key concepts and definitions." 
                    onClick={onTopicExtraction} 
                 />
             </div>
          </div>
      )}

      {/* --- TRANSLATE TAB --- */}
      {activeTab === 'translate' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
             
             {/* Source Input */}
             <div className="flex-1 flex flex-col min-h-0 mb-4">
                <div className="flex justify-between items-center mb-2 px-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Source Text</label>
                    {transInput && (
                        <button onClick={() => setTransInput('')} className="text-gray-400 hover:text-red-500 text-xs flex items-center gap-1">
                            <Eraser size={12} /> Clear
                        </button>
                    )}
                </div>
                <textarea 
                    value={transInput}
                    onChange={(e) => setTransInput(e.target.value)}
                    placeholder="Paste or type text to translate..."
                    className="w-full flex-1 p-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl resize-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all custom-scrollbar placeholder-gray-400 dark:placeholder-gray-500 shadow-inner"
                />
             </div>

             {/* Controls */}
             <div className="bg-white/70 dark:bg-gray-800/70 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-4 flex items-center gap-3 backdrop-blur-sm">
                 <div className="flex-1">
                     <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Translate to</label>
                     <select 
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="w-full text-sm font-semibold text-gray-800 dark:text-gray-200 bg-transparent outline-none cursor-pointer"
                     >
                         {LANGUAGES.map(lang => <option key={lang} value={lang} className="text-gray-900 bg-white">{lang}</option>)}
                     </select>
                 </div>
                 
                 <div className="w-px h-8 bg-gray-200 dark:bg-gray-600" />
                 
                 <button 
                    onClick={handleTranslate}
                    disabled={!transInput.trim() || isTranslating}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                 >
                    {isTranslating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRightLeft size={16} />}
                    Translate
                 </button>
             </div>

             {/* Output */}
             <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2 px-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Result</label>
                    {transOutput && (
                        <button 
                            onClick={handleCopyTranslation} 
                            className={`text-xs flex items-center gap-1 transition-colors ${copied ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400 hover:text-blue-700'}`}
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    )}
                </div>
                <div className={`w-full flex-1 p-3 bg-gray-100/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700/50 rounded-xl text-sm overflow-y-auto custom-scrollbar ${!transOutput ? 'text-gray-400 dark:text-gray-600 italic flex items-center justify-center' : 'text-gray-800 dark:text-gray-200'}`}>
                    {isTranslating ? (
                        <div className="flex flex-col items-center gap-2 opacity-50">
                            <Loader2 size={20} className="animate-spin text-blue-500" />
                            <span>Translating...</span>
                        </div>
                    ) : transOutput ? (
                        <div className="whitespace-pre-wrap">{transOutput}</div>
                    ) : (
                        "Translation will appear here"
                    )}
                </div>
             </div>

          </div>
      )}

    </div>
  );
};

// Helper Component for Tools Grid
const ToolCard = ({ icon: Icon, color, title, desc, onClick }: { icon: any, color: string, title: string, desc: string, onClick: () => void }) => {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white',
    };

    const borderClasses: Record<string, string> = {
        blue: 'hover:border-blue-200 dark:hover:border-blue-700/50 hover:ring-2 hover:ring-blue-50 dark:hover:ring-blue-900/10',
        purple: 'hover:border-purple-200 dark:hover:border-purple-700/50 hover:ring-2 hover:ring-purple-50 dark:hover:ring-purple-900/10',
        green: 'hover:border-green-200 dark:hover:border-green-700/50 hover:ring-2 hover:ring-green-50 dark:hover:ring-green-900/10',
        orange: 'hover:border-orange-200 dark:hover:border-orange-700/50 hover:ring-2 hover:ring-orange-50 dark:hover:ring-orange-900/10',
    };

    return (
        <button 
            onClick={onClick} 
            className={`w-full text-left bg-white/60 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all group backdrop-blur-sm ${borderClasses[color]}`}
        >
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl transition-colors shrink-0 ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block mb-1 group-hover:text-gray-900 dark:group-hover:text-white">{title}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                </div>
            </div>
        </button>
    );
};