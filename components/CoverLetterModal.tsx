import React, { useState, useEffect } from 'react';
import { X, FileText, Copy, Check, Loader2, Download, RefreshCw } from 'lucide-react';
import { JobOpportunity, CVAnalysis } from '../types';
import { generateCoverLetter } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  job: JobOpportunity;
  analysis: CVAnalysis;
}

const CoverLetterModal: React.FC<Props> = ({ isOpen, onClose, job, analysis }) => {
  const [content, setContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && job) {
      generateLetter();
    }
  }, [isOpen, job]);

  const generateLetter = async () => {
    setIsGenerating(true);
    try {
      const letter = await generateCoverLetter(job, analysis);
      setContent(letter);
    } catch (error) {
      console.error("Failed to generate cover letter", error);
      setContent("Error generating cover letter. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              Auto-Cover Letter
            </h2>
            <p className="text-slate-400 text-sm">Tailored for <span className="text-indigo-300 font-medium">{job.title}</span> at {job.company}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 bg-slate-950/30">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <div className="text-center">
                <p className="text-white font-medium">Drafting your narrative...</p>
                <p className="text-slate-500 text-sm">Connecting your skills to the role requirements.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white text-slate-900 p-8 rounded-xl shadow-lg font-serif leading-relaxed whitespace-pre-wrap text-sm md:text-base max-w-2xl mx-auto">
              {content}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
          <button
            onClick={generateLetter}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>

          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              disabled={isGenerating || !content}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CoverLetterModal;
