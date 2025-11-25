import React, { useState } from 'react';
import { JobOpportunity, CVAnalysis } from '../types';
import { ArrowUpRight, Building2, BrainCircuit, AlertCircle, MessageSquare, Copy, Check, Loader2, Mic, FileText } from 'lucide-react';
import { generateOutreach } from '../services/geminiService';

interface Props {
  job: JobOpportunity;
  analysis?: CVAnalysis | null; // Optional to support passing analysis context
  onPrepMe?: (job: JobOpportunity) => void;
  onCoverLetter?: (job: JobOpportunity) => void;
}

const JobCard: React.FC<Props> = ({ job, analysis, onPrepMe, onCoverLetter }) => {
  const [outreach, setOutreach] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-indigo-400';
    return 'text-yellow-400';
  };

  const handleGenerateOutreach = async () => {
    if (!analysis) return;
    setIsGenerating(true);
    try {
      const text = await generateOutreach(job, analysis);
      setOutreach(text);
    } catch (e) {
      // Fallback handled in service
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (outreach) {
      navigator.clipboard.writeText(outreach);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="group relative bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl p-6 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] overflow-hidden flex flex-col">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-slate-400">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">{job.company}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
             <div className={`text-2xl font-display font-bold ${getScoreColor(job.matchScore)}`}>
               {job.matchScore}%
             </div>
             <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Match</span>
          </div>
        </div>

        <div className="flex-grow">
           <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 mb-4">
              <div className="flex items-start gap-2">
                 <BrainCircuit className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                 <p className="text-sm text-slate-300 italic leading-relaxed">
                   "{job.reasoning}"
                 </p>
              </div>
           </div>
           
           {job.isSimulated && (
             <div className="flex items-center gap-2 text-xs text-yellow-500/80 mb-2">
               <AlertCircle className="w-3 h-3" />
               <span>Simulated result - Live data unavailable</span>
             </div>
           )}

           {/* Outreach Section */}
           {outreach && (
             <div className="mb-4 animate-fade-in">
               <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3 relative">
                 <p className="text-sm text-indigo-200 font-mono whitespace-pre-wrap">{outreach}</p>
                 <button 
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 p-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 rounded text-indigo-300 transition-colors"
                    title="Copy to clipboard"
                 >
                   {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                 </button>
               </div>
             </div>
           )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-3">
          <div className="flex gap-3">
            {analysis && !outreach && (
              <button
                onClick={handleGenerateOutreach}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 rounded-lg transition-colors text-sm font-medium border border-slate-700"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                {isGenerating ? 'Drafting...' : 'Draft Outreach'}
              </button>
            )}

            <button
              onClick={() => onPrepMe && onPrepMe(job)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 rounded-lg transition-colors text-sm font-medium border border-slate-700"
            >
              <Mic className="w-4 h-4" />
              <span>Prep Me</span>
            </button>

            <button
              onClick={() => onCoverLetter && onCoverLetter(job)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 rounded-lg transition-colors text-sm font-medium border border-slate-700"
            >
              <FileText className="w-4 h-4" />
              <span>Cover Letter</span>
            </button>
          </div>

          <a 
            href={job.applicationUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center justify-between px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors group/btn shadow-[0_0_15px_rgba(79,70,229,0.3)] w-full"
          >
            <span className="text-sm font-medium">Apply Now</span>
            <ArrowUpRight className="w-4 h-4 transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default JobCard;