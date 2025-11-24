import React, { useRef, useState } from 'react';
import { Upload, FileText, ChevronRight, Globe, FileUp, Loader2 } from 'lucide-react';
import * as pdfjsLibProxy from 'pdfjs-dist';

// Configure PDF.js worker with robust import handling for CDN/ESM environments
// Sometimes the module comes as a default export, sometimes as named exports.
const pdfjsLib: any = (pdfjsLibProxy as any).default || pdfjsLibProxy;

if (pdfjsLib.GlobalWorkerOptions) {
  // Use CDNJS for the worker script as it provides reliable CORS headers and standard script format.
  // Matching version 3.11.174 to the importmap.
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} else {
  console.warn("PDF.js GlobalWorkerOptions not found in imported module", pdfjsLib);
}

interface Props {
  text: string;
  country: string;
  onTextChange: (text: string) => void;
  onCountryChange: (country: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const CVInput: React.FC<Props> = ({ 
  text, 
  country, 
  onTextChange, 
  onCountryChange, 
  onAnalyze, 
  isLoading 
}) => {
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAnalyze();
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      onTextChange(clipboardText);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }

    setIsPdfProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Use the resolved library instance
      // Configured with CMaps to ensure correct character rendering/extraction
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        isEvalSupported: false
      });

      const pdf = await loadingTask.promise;
      
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Extract strings from text items
        // Filter out empty items to prevent excessive whitespace
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + "\n";
      }

      // Basic cleanup of extracted text (removing excessive whitespace)
      const cleanText = fullText.replace(/\s+/g, ' ').trim();
      onTextChange(cleanText);
    } catch (error) {
      console.error("PDF Parsing Error", error);
      alert("Failed to extract text from PDF. It might be encrypted or image-only. Please copy/paste text manually.");
    } finally {
      setIsPdfProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-1 shadow-2xl">
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl p-6 relative overflow-hidden">
          
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-bold text-white">Upload Your Trajectory</h2>
              <p className="text-slate-400 text-sm">Paste your raw CV text or upload a PDF. We'll handle the gravity.</p>
            </div>

            <div className="space-y-4">
              {/* Country Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => onCountryChange(e.target.value)}
                  placeholder="Target Country (e.g. United States, Remote, United Kingdom)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                />
              </div>

              {/* CV Textarea */}
              <div className="relative group">
                <textarea
                  value={text}
                  onChange={(e) => onTextChange(e.target.value)}
                  placeholder={isPdfProcessing ? "Extracting text from PDF..." : "Paste your resume content here..."}
                  disabled={isPdfProcessing}
                  className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none font-mono disabled:opacity-50"
                />
                
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="application/pdf" 
                  className="hidden" 
                  onChange={handlePdfUpload}
                />

                {/* Overlay Buttons (Show when empty) */}
                {!text && !isPdfProcessing && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3 w-full justify-center px-4">
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors backdrop-blur-sm border border-slate-700"
                    >
                      <FileText className="w-4 h-4" />
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={triggerFileUpload}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 rounded-lg text-sm transition-colors backdrop-blur-sm"
                    >
                      <FileUp className="w-4 h-4" />
                      Upload PDF
                    </button>
                  </div>
                )}
                
                {/* PDF Loading Indicator */}
                {isPdfProcessing && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span className="text-sm text-indigo-300">Parsing PDF Structure...</span>
                  </div>
                )}

                {/* Small Upload Button (Show when text exists) */}
                {text && !isPdfProcessing && (
                   <button
                     type="button"
                     onClick={triggerFileUpload}
                     className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-700"
                     title="Upload new PDF (replaces text)"
                   >
                     <FileUp className="w-4 h-4" />
                   </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!text.trim() || isLoading || isPdfProcessing}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all
                ${!text.trim() || isLoading || isPdfProcessing
                  ? 'bg-slate-800 cursor-not-allowed text-slate-500' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-[1.01]'
                }`}
            >
              {isLoading ? (
                <>
                  <Upload className="w-5 h-5 animate-bounce" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Initialize Analysis</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CVInput;