import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

const OnboardingTour: React.FC = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if tour has been seen
    const hasSeenTour = localStorage.getItem('jobnado_tour_seen');
    if (!hasSeenTour) {
      setRun(true);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('jobnado_tour_seen', 'true');
    }
  };

  const steps: Step[] = [
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
          <p className="text-slate-300">Paste your CV text or upload a PDF here. Our AI will analyze your skills and experience to find hidden opportunities.</p>
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

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      disableCloseOnEsc
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
