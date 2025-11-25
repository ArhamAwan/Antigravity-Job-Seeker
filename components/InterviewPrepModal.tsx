import React, { useState, useEffect } from 'react';
import { X, Mic, Send, Loader2, CheckCircle, AlertCircle, ChevronRight, Award, RefreshCw } from 'lucide-react';
import { JobOpportunity, CVAnalysis } from '../types';
import { generateInterviewQuestions, evaluateInterviewAnswer } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  job: JobOpportunity;
  analysis: CVAnalysis;
}

interface Evaluation {
  score: number;
  feedback: string;
  improvedAnswer: string;
}

const InterviewPrepModal: React.FC<Props> = ({ isOpen, onClose, job, analysis }) => {
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  // Reset state when modal opens for a new job
  useEffect(() => {
    if (isOpen && job) {
      loadQuestions();
      setSelectedQuestionIndex(null);
      setUserAnswer('');
      setEvaluation(null);
    }
  }, [isOpen, job]);

  const loadQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const q = await generateInterviewQuestions(job, analysis);
      setQuestions(q);
    } catch (error) {
      console.error("Failed to load questions", error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleEvaluate = async () => {
    if (selectedQuestionIndex === null || !userAnswer.trim()) return;

    setIsEvaluating(true);
    try {
      const result = await evaluateInterviewAnswer(questions[selectedQuestionIndex], userAnswer);
      setEvaluation(result);
    } catch (error) {
      console.error("Evaluation failed", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRetry = () => {
    setUserAnswer('');
    setEvaluation(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <Mic className="w-6 h-6 text-indigo-400" />
              Interview Prep
            </h2>
            <p className="text-slate-400 text-sm">Target: <span className="text-indigo-300 font-medium">{job.title}</span> at {job.company}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
          
          {/* Sidebar: Questions List */}
          <div className="w-full md:w-1/3 border-r border-slate-800 bg-slate-950/30 overflow-y-auto p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Challenge Questions</h3>
            
            {isLoadingQuestions ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-slate-400 text-sm">Generating challenges...</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedQuestionIndex(idx);
                    setUserAnswer('');
                    setEvaluation(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative group
                    ${selectedQuestionIndex === idx 
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5
                      ${selectedQuestionIndex === idx ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}
                    `}>
                      {idx + 1}
                    </span>
                    <p className={`text-sm line-clamp-3 ${selectedQuestionIndex === idx ? 'text-indigo-100' : 'text-slate-300'}`}>
                      {q}
                    </p>
                  </div>
                  {selectedQuestionIndex === idx && (
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Main Area: Simulation */}
          <div className="w-full md:w-2/3 p-6 overflow-y-auto bg-slate-900 flex flex-col">
            {selectedQuestionIndex !== null ? (
              <div className="flex-grow flex flex-col space-y-6">
                
                {/* Question Display */}
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/20">
                    Question {selectedQuestionIndex + 1}
                  </span>
                  <h3 className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                    "{questions[selectedQuestionIndex]}"
                  </h3>
                </div>

                {/* Answer Input / Evaluation Display */}
                {!evaluation ? (
                  <div className="flex-grow flex flex-col space-y-4 animate-fade-in">
                    <div className="relative flex-grow">
                      <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here... (Be specific and use examples)"
                        className="w-full h-full min-h-[200px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none font-sans text-base leading-relaxed"
                      />
                      <div className="absolute bottom-4 right-4 text-xs text-slate-600">
                        {userAnswer.length} chars
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleEvaluate}
                        disabled={!userAnswer.trim() || isEvaluating}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all
                          ${!userAnswer.trim() || isEvaluating
                            ? 'bg-slate-800 cursor-not-allowed text-slate-500' 
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:scale-[1.02]'
                          }`}
                      >
                        {isEvaluating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Analyzing Response...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            <span>Submit Answer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow space-y-6 animate-fade-in-up">
                    {/* Score Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">Impact Score</span>
                        <div className={`text-4xl font-bold ${
                          evaluation.score >= 80 ? 'text-green-400' : 
                          evaluation.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {evaluation.score}/100
                        </div>
                      </div>
                      <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                        <div className="mt-1">
                          {evaluation.score >= 80 ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-yellow-400" />}
                        </div>
                        <div>
                          <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Feedback</span>
                          <p className="text-slate-300 text-sm leading-relaxed">{evaluation.feedback}</p>
                        </div>
                      </div>
                    </div>

                    {/* Improved Answer */}
                    <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Award className="w-24 h-24 text-indigo-500" />
                      </div>
                      <h4 className="text-indigo-400 font-bold mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Gold Standard Answer
                      </h4>
                      <p className="text-indigo-100/90 text-sm leading-relaxed italic relative z-10">
                        "{evaluation.improvedAnswer}"
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                  <ChevronRight className="w-10 h-10 text-slate-600" />
                </div>
                <p className="text-slate-400 text-lg">Select a challenge from the left to begin.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPrepModal;
