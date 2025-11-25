import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { AppPhase } from '../types';

interface Props {
  currentPhase?: AppPhase;
}

const OnboardingTour: React.FC<Props> = ({ currentPhase }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  // Initial Tour Steps
  const initialSteps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-lg text-indigo-400">Welcome to JobNado AI! 🌪️</h3>
          <p className="text-slate-300">Let's get you set up with your personal AI job agent. This quick tour will show you how to launch your career search.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-cv-input',
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-lg text-indigo-400">Step 1: Upload Trajectory 📄</h3>
          <p className="text-slate-300">Paste your CV text, upload a PDF, or <b>drop an image</b> directly. Our AI will analyze your skills and experience to find hidden opportunities.</p>
        </div>
      ),
    },
    {
      target: '.tour-country-select',
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-lg text-indigo-400">Step 2: Select Sector 🌍</h3>
          <p className="text-slate-300">Choose your target country. Use the map pin button to auto-detect your current location instantly.</p>
        </div>
      ),
    },
    {
      target: '.tour-analyze-btn',
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-lg text-indigo-400">Step 3: Initiate Launch 🚀</h3>
          <p className="text-slate-300">Click here to start the analysis. We'll decode your profile and scan the web for live job matches.</p>
        </div>
      ),
    },
  ];

  // Analysis Review Tour Steps
  const analysisSteps: Step[] = [
    {
      target: '.tour-competencies',
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-lg text-indigo-400">Decoded DNA 🧬</h3>
          <p className="text-slate-300">We've mapped your core hard and soft skills. This is the foundation of your professional gravity well.</p>
        </div>
      ),
      placement: 'auto',
      disableBeacon: true,
    },
    {
      target: '.tour-permutations',
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-lg text-indigo-400">Role Permutations 🔀</h3>
          <p className="text-slate-300">Don't limit yourself. We've identified adjacent roles and industries where your skills are highly valued.</p>
        </div>
      ),
    },
    {
      target: '.tour-sweep-btn',
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-lg text-indigo-400">Launch Web Sweep 🚀</h3>
          <p className="text-slate-300">Ready? Click here to scan the live job market using these parameters.</p>
        </div>
      ),
    },
  ];

  // Results Tour Steps
  const resultsSteps: Step[] = [
    {
      target: '.tour-job-card:first-child',
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-lg text-indigo-400">Target Acquired 🎯</h3>
          <p className="text-slate-300">We've found high-probability matches. Each card shows the role, company, and why you're a fit.</p>
        </div>
      ),
      placement: 'auto',
      disableBeacon: true,
    },
    {
      target: '.tour-prep-btn:first-child', // Targets the button inside the first card if scoped correctly
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-lg text-indigo-400">AI Interview Coach 🎤</h3>
          <p className="text-slate-300">Click "Prep Me" to practice with an AI interviewer. Get custom questions and instant feedback on your answers.</p>
        </div>
      ),
    },
    {
      target: '.tour-cover-btn:first-child',
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-lg text-indigo-400">Auto-Cover Letter ✍️</h3>
          <p className="text-slate-300">Generate a tailored, high-impact cover letter for this specific role in seconds.</p>
        </div>
      ),
    },
    {
      target: '.tour-radar-btn',
      content: (
        <div className="text-left space-y-2">
          <h3 className="font-bold text-lg text-indigo-400">Job Radar 📡</h3>
          <p className="text-slate-300">Don't miss out. Enable the Job Radar to get daily email alerts for new matches in this sector.</p>
        </div>
      ),
    },
  ];

  useEffect(() => {
    // Logic for Initial Tour
    if (!currentPhase || currentPhase === AppPhase.IDLE) {
      const hasSeenTour = localStorage.getItem('jobnado_tour_seen');
      if (!hasSeenTour) {
        setSteps(initialSteps);
        setRun(true);
      }
    }
    
    // Logic for Analysis Review Tour
    if (currentPhase === AppPhase.REVIEW_ANALYSIS) {
      const hasSeenAnalysisTour = localStorage.getItem('jobnado_analysis_tour_seen');
      if (!hasSeenAnalysisTour) {
        setTimeout(() => {
          setSteps(analysisSteps);
          setRun(true);
        }, 800);
      }
    }
    
    // Logic for Results Tour
    if (currentPhase === AppPhase.RESULTS) {
      const hasSeenResultsTour = localStorage.getItem('jobnado_results_tour_seen');
      if (!hasSeenResultsTour) {
        // Small delay to ensure DOM elements are rendered
        setTimeout(() => {
          setSteps(resultsSteps);
          setRun(true);
        }, 1000);
      }
    }
  }, [currentPhase]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status) || action === ACTIONS.CLOSE || type === EVENTS.TOUR_END) {
      setRun(false);
      
      // Mark specific tour as seen based on current phase
      if (currentPhase === AppPhase.RESULTS) {
        localStorage.setItem('jobnado_results_tour_seen', 'true');
      } else if (currentPhase === AppPhase.REVIEW_ANALYSIS) {
        localStorage.setItem('jobnado_analysis_tour_seen', 'true');
      } else {
        localStorage.setItem('jobnado_tour_seen', 'true');
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      disableCloseOnEsc
      scrollToFirstStep
      scrollOffset={150}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#1e293b',
          backgroundColor: '#1e293b',
          overlayColor: 'rgba(15, 23, 42, 0.85)',
          primaryColor: '#6366f1',
          textColor: '#e2e8f0',
          width: 400,
          zIndex: 1000,
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          borderRadius: '8px',
          color: '#fff',
          fontWeight: 'bold',
          padding: '10px 20px',
        },
        buttonBack: {
          color: '#94a3b8',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#64748b',
        },
      }}
    />
  );
};

export default OnboardingTour;
