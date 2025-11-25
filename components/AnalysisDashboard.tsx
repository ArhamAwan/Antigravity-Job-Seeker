import React from 'react';
import { CVAnalysis } from '../types';
import { Target, Briefcase, Zap, Globe, ExternalLink, Copy, Check } from 'lucide-react';

interface Props {
  analysis: CVAnalysis;
  onProceed: (selectedRole?: string) => void;
  isSearching: boolean;
  country: string;
}

const AnalysisDashboard: React.FC<Props> = ({ analysis, onProceed, isSearching, country }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getRoleBadgeColor = (index: number) => {
    const colors = ['bg-indigo-500/20 text-indigo-300 border-indigo-500/50', 'bg-purple-500/20 text-purple-300 border-purple-500/50', 'bg-blue-500/20 text-blue-300 border-blue-500/50'];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full max-w-4xl animate-fade-in mx-auto space-y-8">
      
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Profile Vector Analyzed
        </h2>
        <p className="text-slate-400">Your professional gravity well has been mapped.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Stats Card */}
        <div className="tour-competencies bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Core Competencies</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {analysis.hardSkills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300">
                {skill}
              </span>
            ))}
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Experience Level</span>
                <span className="text-white font-medium">{analysis.experienceLevel}</span>
             </div>
             <div className="h-px bg-slate-700/50" />
             <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                <div className="text-sm text-slate-300">
                  <span className="block text-slate-400 text-xs mb-1">Soft Skills</span>
                  {analysis.softSkills.join(', ')}
                </div>
             </div>
          </div>
        </div>

        {/* Roles Card */}
        <div className="tour-permutations bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Permutations Detected</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">Based on your skills, you are qualified for these roles beyond your current title:</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {analysis.suggestedRoles.map((role, i) => (
              <button 
                key={i} 
                onClick={() => !isSearching && onProceed(role)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all hover:scale-105 active:scale-95 text-left ${getRoleBadgeColor(i)}`}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="mt-auto pt-4 border-t border-slate-700/50">
             <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Adjacent Industries</div>
             <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                {analysis.adjacentIndustries.map((ind, i) => (
                   <span key={i} className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-500" /> {ind}
                   </span>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Strategy Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-semibold text-white pl-1">Antigravity Search Keys</h3>
        <p className="text-slate-400 text-sm pl-1">
          Use these advanced boolean strings to bypass basic filters on major platforms in <span className="text-indigo-400">{country}</span>.
        </p>
        
        <div className="grid gap-4">
          {analysis.antigravityBooleanStrings.map((item, idx) => (
            <div key={idx} className="group bg-slate-900/80 backdrop-blur-md border border-indigo-500/50 hover:border-indigo-500/80 rounded-xl p-4 transition-all shadow-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1">{item.label}</span>
                <div className="flex gap-2">
                   <a 
                     href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(item.query)}&location=${encodeURIComponent(country)}`}
                     target="_blank"
                     rel="noreferrer"
                     className="px-2 py-1 bg-[#0077b5]/20 hover:bg-[#0077b5]/40 text-[#0077b5] border border-[#0077b5]/30 rounded-md text-xs font-bold transition-all flex items-center gap-1"
                     title="Search on LinkedIn"
                   >
                     LinkedIn
                   </a>
                   <a 
                     href={`https://www.indeed.com/jobs?q=${encodeURIComponent(item.query)}&l=${encodeURIComponent(country)}`}
                     target="_blank"
                     rel="noreferrer"
                     className="px-2 py-1 bg-[#2164f3]/20 hover:bg-[#2164f3]/40 text-[#2164f3] border border-[#2164f3]/30 rounded-md text-xs font-bold transition-all flex items-center gap-1"
                     title="Search on Indeed"
                   >
                     Indeed
                   </a>
                   <a 
                     href={`https://www.google.com/search?q=${encodeURIComponent(item.query + " jobs " + country)}`}
                     target="_blank"
                     rel="noreferrer"
                     className="px-2 py-1 bg-slate-600/20 hover:bg-slate-600/40 text-slate-300 border border-slate-600/30 rounded-md text-xs font-bold transition-all flex items-center gap-1"
                     title="Search on Google"
                   >
                     Google
                   </a>
                   <div className="w-px h-6 bg-slate-700 mx-1"></div>
                   <button 
                     onClick={() => copyToClipboard(item.query, idx)}
                     className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                     title="Copy Query"
                   >
                     {copiedIndex === idx ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                   </button>
                </div>
              </div>
              <div className="font-mono text-sm text-slate-300 bg-slate-950/50 p-3 rounded-lg break-words mb-2">
                {item.query}
              </div>
              <p className="text-xs text-slate-500 italic">
                {item.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={() => onProceed()}
          disabled={isSearching}
          className="tour-sweep-btn group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 font-display rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? (
             <span className="flex items-center gap-2">
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Scanning {country}...
             </span>
          ) : (
             <span className="flex items-center gap-2">
               Initiate Web Sweep <ExternalLink className="w-4 h-4" />
             </span>
          )}
          <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 animate-pulse-slow"></div>
        </button>
      </div>
    </div>
  );
};

export default AnalysisDashboard;