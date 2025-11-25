import React, { useState, useEffect } from 'react';
import { AppPhase, CVAnalysis, JobOpportunity } from './types';
import { analyzeCV, searchOpportunities } from './services/geminiService';
import CVInput from './components/CVInput';
import AnalysisDashboard from './components/AnalysisDashboard';
import JobCard from './components/JobCard';
import JobAlertsModal from './components/JobAlertsModal';
import OnboardingTour from './components/OnboardingTour';
import { Rocket, Sparkles, AlertTriangle, RefreshCcw, ArrowLeft, BellRing, CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.IDLE);
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [opportunities, setOpportunities] = useState<JobOpportunity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertActive, setAlertActive] = useState(false);
  
  // Lifted state to support "Back" navigation without data loss
  const [cvText, setCvText] = useState('');
  const [country, setCountry] = useState<string>('United States');

  // Load alert state from local storage on mount
  useEffect(() => {
    const storedAlert = localStorage.getItem('antigravity_alert_active');
    if (storedAlert === 'true') {
      setAlertActive(true);
    }
  }, []);

  const handleAnalysis = async () => {
    // Ensure country has a default
    if (!country) setCountry("United States");

    setPhase(AppPhase.ANALYZING);
    setError(null);
    try {
      const result = await analyzeCV(cvText);
      setAnalysis(result);
      setPhase(AppPhase.REVIEW_ANALYSIS);
    } catch (err) {
      console.error(err);
      setError("Failed to decode CV. Please ensure the text is readable and try again.");
      setPhase(AppPhase.IDLE);
    }
  };

  const handleSearch = async (specificRole?: string) => {
    if (!analysis) return;
    setPhase(AppPhase.SEARCHING);
    setError(null);
    try {
      const results = await searchOpportunities(analysis, country, specificRole);
      setOpportunities(results);
      setPhase(AppPhase.RESULTS);
    } catch (err) {
      console.error(err);
      setError("Connection to job sector lost. Retrying orbital scan recommended.");
      setPhase(AppPhase.REVIEW_ANALYSIS);
    }
  };

  const handleSubscribe = () => {
    setAlertActive(true);
    localStorage.setItem('antigravity_alert_active', 'true');
  };

  // Handles internal navigation backwards through the phases
  const handleBack = () => {
    setError(null);
    switch (phase) {
      case AppPhase.ANALYZING:
        setPhase(AppPhase.IDLE);
        break;
      case AppPhase.REVIEW_ANALYSIS:
        setPhase(AppPhase.IDLE);
        break;
      case AppPhase.SEARCHING:
        setPhase(AppPhase.REVIEW_ANALYSIS);
        break;
      case AppPhase.RESULTS:
        setPhase(AppPhase.REVIEW_ANALYSIS);
        break;
      case AppPhase.ERROR:
        if (analysis) setPhase(AppPhase.REVIEW_ANALYSIS);
        else setPhase(AppPhase.IDLE);
        break;
      default:
        break;
    }
  };

  const reset = () => {
    setPhase(AppPhase.IDLE);
    setAnalysis(null);
    setOpportunities([]);
    setError(null);
    setCountry('United States');
    setCvText('');
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-fixed bg-center">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[2px]"></div>
      
      <OnboardingTour />

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
             {phase !== AppPhase.IDLE && (
                <button 
                  onClick={handleBack}
                  className="group flex items-center justify-center p-2 rounded-full bg-slate-800/50 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 transition-all duration-300"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-300 group-hover:text-white" />
                </button>
             )}

            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={reset}>
              <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-display font-bold text-white tracking-tight">JobNado AI</h1>
                <p className="text-xs text-indigo-300 tracking-widest uppercase">Job Agent v1.0</p>
              </div>
            </div>
          </div>
          
          {phase !== AppPhase.IDLE && (
            <button 
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-all"
            >
              <RefreshCcw className="w-4 h-4" /> 
              <span className="hidden sm:inline">Reset System</span>
            </button>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col items-center justify-center w-full">
          
          {error && (
            <div className="w-full max-w-md mx-auto mb-8 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200 animate-fade-in">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {(phase === AppPhase.IDLE || phase === AppPhase.ANALYZING) && (
             <div className="text-center max-w-2xl mx-auto space-y-8 animate-fade-in-up">
               <div className="space-y-4">
                 <h1 className="text-5xl md:text-6xl font-display font-bold text-white leading-tight">
                   JobNado <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">AI</span>
                 </h1>
                 <p className="text-lg text-slate-400 leading-relaxed max-w-lg mx-auto">
                   Spinning up your next career move. We analyze your trajectory, infer hidden roles, and pull live opportunities directly to you.
                 </p>
               </div>
               <CVInput 
                 text={cvText}
                 country={country}
                 onTextChange={setCvText}
                 onCountryChange={setCountry}
                 onAnalyze={handleAnalysis} 
                 isLoading={phase === AppPhase.ANALYZING} 
               />
             </div>
          )}

          {phase === AppPhase.REVIEW_ANALYSIS && analysis && (
            <AnalysisDashboard 
              analysis={analysis} 
              onProceed={handleSearch} 
              isSearching={false}
              country={country}
            />
          )}

          {phase === AppPhase.SEARCHING && (
             <div className="flex flex-col items-center gap-6 text-center max-w-md animate-fade-in">
               <div className="relative w-24 h-24">
                 <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                 <div className="relative flex items-center justify-center w-full h-full bg-slate-900 rounded-full border border-indigo-500/50">
                   <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
                 </div>
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-bold text-white">Performing Web Sweep</h3>
                 <p className="text-slate-400">Scanning sector: <span className="text-indigo-400">{country}</span>. Applying boolean logic to live indices...</p>
               </div>
             </div>
          )}

          {phase === AppPhase.RESULTS && (
            <div className="w-full max-w-5xl space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-800 pb-6">
                 <div>
                   <h2 className="text-3xl font-display font-bold text-white">Opportunities Detected</h2>
                   <p className="text-slate-400 mt-1">
                     Highest probability matches found for <span className="text-indigo-400 font-semibold">{analysis?.suggestedRoles[0]}</span> in <span className="text-indigo-400 font-semibold">{country}</span>
                   </p>
                 </div>
                 <div className="flex gap-3">
                   <button 
                     onClick={() => !alertActive && setIsAlertModalOpen(true)}
                     disabled={alertActive}
                     className={`px-4 py-2 border rounded-lg transition-all text-sm font-medium flex items-center gap-2
                       ${alertActive 
                         ? 'bg-green-500/10 border-green-500/30 text-green-400 cursor-default' 
                         : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border-slate-700 hover:border-slate-600'
                       }`}
                   >
                     {alertActive ? <CheckCircle className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
                     {alertActive ? 'Radar Active' : 'Enable Job Radar'}
                   </button>
                   <button 
                     onClick={() => setPhase(AppPhase.REVIEW_ANALYSIS)}
                     className="px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                   >
                     Adjust Parameters
                   </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {opportunities.map((job) => (
                  <JobCard key={job.id} job={job} analysis={analysis} />
                ))}
              </div>
              
              {opportunities.length === 0 && (
                 <div className="text-center py-12 text-slate-500">
                   <p>No direct signals found. Try adjusting the role permutation.</p>
                 </div>
              )}
            </div>
          )}

        </main>
        
        {/* Footer */}
        <footer className="mt-12 text-center text-slate-600 text-xs py-4 border-t border-slate-900/50">
          <p>Powered by Gemini 2.5 Flash • JobNado AI v1.0</p>
        </footer>

        {/* Modals */}
        <JobAlertsModal 
          isOpen={isAlertModalOpen} 
          onClose={() => setIsAlertModalOpen(false)}
          role={analysis?.suggestedRoles[0] || 'your profile'}
          country={country}
          onSubscribe={handleSubscribe}
        />
      </div>
    </div>
  );
};

export default App;