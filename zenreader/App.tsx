
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { pdfjs } from 'react-pdf';
import { PDFToolbar } from './components/PDFToolbar';
import { AIAssistant, AIAssistantStateParams } from './components/AIAssistant';
import { PDFViewer, PDFViewerRef } from './components/PDFViewer';
import { Sidebar } from './components/Sidebar';
import { ConfirmModal } from './components/ConfirmModal';
import { 
  summarizePageContent, 
  askQuestionAboutContext, 
  translateText, 
  explainText, 
  generateExamQuestions,
  extractTopics
} from './services/geminiService';
import { savePDFWithAnnotations } from './services/pdfModifier';
import { ChatMessage, PDFDocumentProxy, Annotation, AnnotationTool, DocumentState, ViewLayout } from './types';
import { UploadCloud, Loader2 } from 'lucide-react';

// Initialize PDF.js worker
const pdfjsVersion = pdfjs.version;
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

const App: React.FC = () => {
  // --- Global State ---
  const [documents, setDocuments] = useState<DocumentState[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [layout, setLayout] = useState<ViewLayout>('single');
  const [isAIActive, setIsAIActive] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Active UI Tool State
  const [activeTool, setActiveTool] = useState<AnnotationTool>('cursor');
  const [activeColor, setActiveColor] = useState<string>('#f59e0b');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  
  // Modal State
  const [pendingCloseId, setPendingCloseId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // AI Sidebar External Control
  const [aiOverride, setAiOverride] = useState<AIAssistantStateParams | null>(null);

  // Refs
  const viewerRef = useRef<PDFViewerRef>(null);
  const [pdfProxyMap, setPdfProxyMap] = useState<{[key: string]: PDFDocumentProxy}>({});

  // --- Effects ---
  useEffect(() => {
    // Sync body background style with theme
    if (isDarkMode) {
      document.body.classList.remove('light-bg');
      document.body.style.backgroundColor = '#111827'; // Dark gray
    } else {
      document.body.classList.add('light-bg');
      document.body.style.backgroundColor = '#f3f4f6';
    }
  }, [isDarkMode]);

  // --- Helpers ---

  const getActiveDoc = () => documents.find(d => d.id === activeTabId);

  const updateActiveDoc = (updates: Partial<DocumentState>) => {
    if (!activeTabId) return;
    setDocuments(prev => prev.map(doc => doc.id === activeTabId ? { ...doc, ...updates } : doc));
  };

  const updateDocById = (id: string, updates: Partial<DocumentState>) => {
    setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, ...updates } : doc));
  };

  // --- Handlers ---

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files) as File[];
      const newDocs: DocumentState[] = [];
      let existingDocId: string | null = null;

      fileList.forEach(file => {
        const isDuplicate = documents.some(doc => 
            doc.file.name === file.name && 
            doc.file.size === file.size &&
            doc.file.lastModified === file.lastModified
        );

        if (isDuplicate) {
            const existing = documents.find(doc => 
                doc.file.name === file.name && 
                doc.file.size === file.size &&
                doc.file.lastModified === file.lastModified
            );
            if (existing) existingDocId = existing.id;
        } else {
            newDocs.push({
                id: Math.random().toString(36).substr(2, 9),
                file,
                scale: 1.0,
                rotation: 0,
                currentPage: 1,
                numPages: null,
                annotations: [],
                deletedAnnotations: [],
                aiMessages: [],
                scrollPosition: 0,
                hasUnsavedChanges: false
            });
        }
      });

      if (newDocs.length > 0) {
        setDocuments(prev => [...prev, ...newDocs]);
        setActiveTabId(newDocs[0].id);
      } else if (existingDocId) {
        setActiveTabId(existingDocId);
      }
    }
    if (event.target) event.target.value = '';
  };

  const handleDocumentLoadSuccess = (id: string, pdf: PDFDocumentProxy) => {
    setPdfProxyMap(prev => ({ ...prev, [id]: pdf }));
    updateDocById(id, { numPages: pdf.numPages });
  };

  const attemptCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = documents.find(d => d.id === id);
    if (doc && doc.hasUnsavedChanges) {
        setPendingCloseId(id);
    } else {
        performCloseTab(id);
    }
  };

  const performCloseTab = (id: string) => {
    const newDocs = documents.filter(d => d.id !== id);
    setDocuments(newDocs);
    if (activeTabId === id && newDocs.length > 0) {
      setActiveTabId(newDocs[newDocs.length - 1].id);
    } else if (newDocs.length === 0) {
      setActiveTabId(null);
    }
    const newProxies = { ...pdfProxyMap };
    delete newProxies[id];
    setPdfProxyMap(newProxies);
    setPendingCloseId(null);
  };

  const handleSave = async () => {
      const doc = getActiveDoc();
      if (!doc) return;

      setIsSaving(true);
      try {
          // Flatten annotations into PDF
          const modifiedPdfBytes = await savePDFWithAnnotations(doc.file, doc.annotations);
          const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.file.name.replace('.pdf', '_edited.pdf');
          a.click();
          URL.revokeObjectURL(url);
          
          // Mark as clean
          updateActiveDoc({ hasUnsavedChanges: false });
      } catch (e) {
          console.error("Failed to save PDF", e);
          alert("Failed to save PDF. Please try again.");
      } finally {
          setIsSaving(false);
      }
  };

  // --- AI Logic Helpers ---

  const getPageText = async (docId: string, pageNum: number) => {
    const proxy = pdfProxyMap[docId];
    if (!proxy) return "";
    try {
      const page = await proxy.getPage(pageNum);
      const textContent = await page.getTextContent();
      return textContent.items.map((item: any) => item.str).join(' ');
    } catch (e) {
      console.error(e);
      return "";
    }
  };

  const getFullDocText = async (docId: string) => {
    const proxy = pdfProxyMap[docId];
    if (!proxy || !proxy.numPages) return "";
    let fullText = "";
    const maxPages = Math.min(proxy.numPages, 10); 
    for(let i=1; i<=maxPages; i++) {
        fullText += await getPageText(docId, i) + "\n";
    }
    return fullText;
  }

  const addAIMessage = (docId: string, text: string, role: 'user' | 'model') => {
      const doc = documents.find(d => d.id === docId);
      if(!doc) return;
      const msg: ChatMessage = {
          id: Date.now().toString() + Math.random(),
          role,
          text,
          timestamp: Date.now()
      };
      updateDocById(docId, { aiMessages: [...doc.aiMessages, msg] });
  };

  // --- AI Action Handlers ---

  const handleAISendMessage = async (text: string) => {
    const doc = getActiveDoc();
    if (!doc) return;

    addAIMessage(doc.id, text, 'user');
    setAiLoading(true);

    const context = await getPageText(doc.id, doc.currentPage);
    const answer = await askQuestionAboutContext(text, context || "No context available.");

    addAIMessage(doc.id, answer, 'model');
    setAiLoading(false);
  };

  const handleSummarize = async () => {
    const doc = getActiveDoc();
    if (!doc) return;
    
    setIsAIActive(true);
    addAIMessage(doc.id, "Summarizing current page...", 'user');
    setAiLoading(true);
    const context = await getPageText(doc.id, doc.currentPage);
    const summary = await summarizePageContent(context);

    addAIMessage(doc.id, summary, 'model');
    setAiLoading(false);
  };

  const handleFullDocSummarize = async () => {
    const doc = getActiveDoc();
    if (!doc) return;

    setIsAIActive(true);
    addAIMessage(doc.id, "Summarizing full document (first 10 pages)...", 'user');
    setAiLoading(true);
    const context = await getFullDocText(doc.id);
    const summary = await summarizePageContent(context);

    addAIMessage(doc.id, summary, 'model');
    setAiLoading(false);
  };

  const handleGenerateExam = async () => {
    const doc = getActiveDoc();
    if (!doc) return;

    setIsAIActive(true);
    addAIMessage(doc.id, "Generate a quiz for this page.", 'user');
    setAiLoading(true);
    const context = await getPageText(doc.id, doc.currentPage);
    const quiz = await generateExamQuestions(context);
    addAIMessage(doc.id, quiz, 'model');
    setAiLoading(false);
  };

  const handleTopicExtraction = async () => {
    const doc = getActiveDoc();
    if (!doc) return;

    setIsAIActive(true);
    addAIMessage(doc.id, "Extract key topics.", 'user');
    setAiLoading(true);
    const context = await getPageText(doc.id, doc.currentPage);
    const topics = await extractTopics(context);
    addAIMessage(doc.id, topics, 'model');
    setAiLoading(false);
  };

  // --- Selection Menu Actions ---

  const handleSelectionAction = async (action: string, text: string) => {
      const doc = getActiveDoc();
      if (!doc) return;

      if (action === 'copy') {
          navigator.clipboard.writeText(text);
          return;
      }

      if (action === 'google-search') {
          window.open(`https://www.google.com/search?q=${encodeURIComponent(text)}`, '_blank');
          return;
      }

      setIsAIActive(true);
      
      if (action === 'translate') {
          setAiOverride({
              tab: 'translate',
              translationText: text,
              timestamp: Date.now()
          });
          return;
      } 
      
      setAiOverride({
          tab: 'chat',
          timestamp: Date.now()
      });
      setAiLoading(true);

      if (action === 'explain') {
          addAIMessage(doc.id, `Explain: "${text.substring(0, 50)}..."`, 'user');
          const result = await explainText(text, 'simple');
          addAIMessage(doc.id, result, 'model');
      } else if (action === 'exam') {
          addAIMessage(doc.id, `Quiz based on selection...`, 'user');
          const result = await generateExamQuestions(text);
          addAIMessage(doc.id, result, 'model');
      } else if (action === 'note') {
          setActiveTool('note');
          addAIMessage(doc.id, `Draft a note for: "${text.substring(0, 50)}..."`, 'user');
          const note = await explainText(text, 'simple');
          addAIMessage(doc.id, `Draft Note:\n${note}`, 'model');
      }
      
      setAiLoading(false);
  };

  // --- Render ---
  
  const activeDoc = getActiveDoc();

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden text-gray-900 dark:text-gray-100 transition-colors duration-500 ${isDarkMode ? 'dark' : ''}`}>
      
      <ConfirmModal 
        isOpen={!!pendingCloseId}
        onClose={() => setPendingCloseId(null)}
        onConfirm={() => pendingCloseId && performCloseTab(pendingCloseId)}
        title="Unsaved Changes"
        message="You have unsaved annotations. Closing this tab will discard them. Are you sure you want to close without saving?"
      />

      {/* Loading Overlay for Save */}
      {isSaving && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center flex-col gap-4 text-white animate-fade-in">
              <Loader2 size={48} className="animate-spin" />
              <div className="font-semibold text-lg">Saving PDF with Annotations...</div>
          </div>
      )}

      {/* 1. Global Floating Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-40">
        <PDFToolbar 
            documents={documents}
            activeTabId={activeTabId || ''}
            onTabClick={setActiveTabId}
            onCloseTab={attemptCloseTab}
            onNewTab={() => document.getElementById('file-upload')?.click()}
            
            fileName={activeDoc?.file.name || null}
            pageNumber={activeDoc?.currentPage || 1}
            numPages={activeDoc?.numPages || null}
            scale={activeDoc?.scale || 1}
            layout={layout}
            
            onZoomIn={() => activeDoc && updateActiveDoc({ scale: Math.min(activeDoc.scale + 0.1, 3) })}
            onZoomOut={() => activeDoc && updateActiveDoc({ scale: Math.max(activeDoc.scale - 0.1, 0.5) })}
            onPrevPage={() => {
            if(activeDoc && activeDoc.currentPage > 1) {
                updateActiveDoc({ currentPage: activeDoc.currentPage - 1 });
                viewerRef.current?.scrollToPage(activeDoc.currentPage - 1);
            }
            }}
            onNextPage={() => {
            if(activeDoc && activeDoc.numPages && activeDoc.currentPage < activeDoc.numPages) {
                updateActiveDoc({ currentPage: activeDoc.currentPage + 1 });
                viewerRef.current?.scrollToPage(activeDoc.currentPage + 1);
            }
            }}
            onRotate={() => activeDoc && updateActiveDoc({ rotation: (activeDoc.rotation + 90) % 360 })}
            onToggleAI={() => setIsAIActive(!isAIActive)}
            onToggleLayout={() => setLayout(prev => prev === 'single' ? 'split-vertical' : 'single')}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onFileChange={handleFileChange} 
            isAIActive={isAIActive}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
      </div>

      {/* 2. Main Workspace */}
      <div className="flex flex-1 pt-24 pb-4 px-4 overflow-hidden gap-4 relative">
        
        {/* Left Sidebar */}
        {activeDoc && isSidebarOpen && (
           <div className="w-72 shrink-0 animate-slide-in-right z-30 flex flex-col h-full">
               <Sidebar 
                  file={activeDoc.file}
                  numPages={activeDoc.numPages}
                  currentPage={activeDoc.currentPage}
                  pdfProxy={activeTabId ? pdfProxyMap[activeTabId] : null}
                  onPageClick={(pageNum) => {
                     updateActiveDoc({ currentPage: pageNum });
                     viewerRef.current?.scrollToPage(pageNum);
                  }}
               />
           </div>
        )}

        {/* Center Viewer Area */}
        <div className={`flex-1 flex overflow-hidden relative rounded-2xl shadow-2xl transition-all duration-300 ${!activeDoc ? 'bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700/50' : 'bg-transparent'}`}>
           {!activeDoc ? (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <div className="w-24 h-24 bg-white/80 dark:bg-gray-700/80 rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10">
                 <UploadCloud size={48} className="text-blue-500 opacity-80" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">No Document Open</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Upload a PDF to start reading and analyzing</p>
                <button 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
                >
                  Open PDF
                </button>
             </div>
           ) : (
             <div className="flex-1 h-full relative rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                  <PDFViewer 
                    ref={viewerRef}
                    file={activeDoc.file}
                    pageNumber={activeDoc.currentPage}
                    scale={activeDoc.scale}
                    rotation={activeDoc.rotation}
                    annotations={activeDoc.annotations}
                    activeTool={activeTool}
                    activeColor={activeColor}
                    onDocumentLoadSuccess={(pdf) => handleDocumentLoadSuccess(activeDoc.id, pdf)}
                    onPageChange={(page) => updateActiveDoc({ currentPage: page })}
                    onAddAnnotation={(ann) => updateActiveDoc({ 
                        annotations: [...activeDoc.annotations, ann],
                        deletedAnnotations: [], // Clear redo stack on new action
                        hasUnsavedChanges: true
                    })}
                    onDeleteAnnotation={(id) => updateActiveDoc({ 
                        annotations: activeDoc.annotations.filter(a => a.id !== id),
                        hasUnsavedChanges: true
                    })}
                    onUpdateAnnotation={(id, up) => updateActiveDoc({ 
                        annotations: activeDoc.annotations.map(a => a.id === id ? { ...a, ...up } : a) as Annotation[],
                        hasUnsavedChanges: true
                    })}
                    
                    // Undo: Move last annotation to deletedAnnotations
                    onUndoAnnotation={() => {
                        const last = activeDoc.annotations[activeDoc.annotations.length - 1];
                        if (last) {
                            updateActiveDoc({ 
                                annotations: activeDoc.annotations.slice(0, -1),
                                deletedAnnotations: [...activeDoc.deletedAnnotations, last],
                                hasUnsavedChanges: true
                            });
                        }
                    }}
                    
                    // Redo: Move last deleted annotation back to annotations
                    onRedoAnnotation={() => {
                        const lastDeleted = activeDoc.deletedAnnotations[activeDoc.deletedAnnotations.length - 1];
                        if (lastDeleted) {
                            updateActiveDoc({
                                annotations: [...activeDoc.annotations, lastDeleted],
                                deletedAnnotations: activeDoc.deletedAnnotations.slice(0, -1),
                                hasUnsavedChanges: true
                            });
                        }
                    }}
                    canRedo={activeDoc.deletedAnnotations.length > 0}
                    
                    onClearAnnotations={() => updateActiveDoc({ annotations: [], hasUnsavedChanges: true })}
                    onSelectionAction={handleSelectionAction} 
                    setActiveTool={setActiveTool}
                    setActiveColor={setActiveColor}
                    onSave={handleSave}

                    onPrevPage={() => {
                        if(activeDoc.currentPage > 1) {
                            updateActiveDoc({ currentPage: activeDoc.currentPage - 1 });
                            viewerRef.current?.scrollToPage(activeDoc.currentPage - 1);
                        }
                    }}
                    onNextPage={() => {
                        if(activeDoc.numPages && activeDoc.currentPage < activeDoc.numPages) {
                            updateActiveDoc({ currentPage: activeDoc.currentPage + 1 });
                            viewerRef.current?.scrollToPage(activeDoc.currentPage + 1);
                        }
                    }}
                    onZoomIn={() => updateActiveDoc({ scale: Math.min(activeDoc.scale + 0.1, 3) })}
                    onZoomOut={() => updateActiveDoc({ scale: Math.max(activeDoc.scale - 0.1, 0.5) })}
                    
                    isSidebarOpen={isSidebarOpen}
                  />
             </div>
           )}
        </div>

        {/* Right AI Sidebar */}
        {isAIActive && activeDoc && (
          <div className="w-96 shrink-0 z-30 h-full">
            <AIAssistant 
              onClose={() => setIsAIActive(false)}
              onSendMessage={handleAISendMessage}
              onSummarize={handleSummarize}
              onFullDocSummarize={handleFullDocSummarize}
              onGenerateExam={handleGenerateExam}
              onTopicExtraction={handleTopicExtraction}
              messages={activeDoc.aiMessages}
              isLoading={aiLoading}
              currentPageText=""
              externalState={aiOverride}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
