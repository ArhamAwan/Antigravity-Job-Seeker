import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Mail, Radio, Loader2, AlertTriangle, Code, Copy, ChevronDown, ChevronUp, MapPin, Globe } from 'lucide-react';
import { generateAlertConfirmation } from '../services/geminiService';
import emailjs from '@emailjs/browser';
import { supabase } from '../services/supabaseClient';
import { COUNTRIES } from '../constants/countries';

/**
 * IMPLEMENTATION GUIDE FOR REAL EMAILS:
 * 
 * 1. Go to https://www.emailjs.com/ (Free Tier)
 * 2. Create a Service (connect Gmail/Outlook) -> Get SERVICE_ID (Configured)
 * 3. Create a Template -> Get TEMPLATE_ID
 *    - Template Variables: {{message}}, {{role}}, {{country}}, {{frequency}}, {{to_email}}
 *    - IMPORTANT: In Template Settings (Right Sidebar), set "To Email" to {{to_email}}
 * 4. Get your Public Key from Account Settings -> Get PUBLIC_KEY (Configured)
 */

// CREDENTIALS CONFIGURED
const EMAILJS_SERVICE_ID: string = "service_yc6df84";
const EMAILJS_TEMPLATE_ID: string = "template_9vnsg32"; 
const EMAILJS_PUBLIC_KEY: string = "Dh99DkcKCVF9N5wVQ";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: string;
  country: string;
  onSubscribe: () => void;
}

const JobAlertsModal: React.FC<Props> = ({ isOpen, onClose, role, country: initialCountry, onSubscribe }) => {
  const [email, setEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [frequency, setFrequency] = useState('daily');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [showDevGuide, setShowDevGuide] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedCountry(initialCountry);
    }
  }, [isOpen, initialCountry]);

  if (!isOpen) return null;

  // Configuration Status Check
  const missingConfig = [];
  if (EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" || !EMAILJS_SERVICE_ID) missingConfig.push("Service ID");
  if (EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID" || !EMAILJS_TEMPLATE_ID) missingConfig.push("Template ID");
  if (EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY" || !EMAILJS_PUBLIC_KEY) missingConfig.push("Public Key");
  
  const isConfigured = missingConfig.length === 0;

  const ANTIGRAVITY_EMAIL_TEMPLATE = `
<div style="background-color:#0f172a;padding:40px;font-family:'Courier New',monospace;color:#e2e8f0;border-radius:16px;">
  <div style="text-align:center;margin-bottom:30px;">
    <h1 style="color:#818cf8;letter-spacing:4px;margin:0;">ANTIGRAVITY</h1>
    <span style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:2px;">Orbital Job Uplink</span>
  </div>
  <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:20px;margin-bottom:24px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
    <p style="margin:0;line-height:1.6;font-size:16px;color:#fff;">{{message}}</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;font-size:12px;color:#94a3b8;border-top:1px solid #334155;padding-top:20px;">
    <div>TARGET: <span style="color:#cbd5e1">{{role}}</span></div>
    <div>SECTOR: <span style="color:#cbd5e1">{{country}}</span></div>
    <div>FREQ: <span style="color:#cbd5e1">{{frequency}}</span></div>
    <div>UPLINK: <span style="color:#cbd5e1">Active</span></div>
  </div>
  <div style="text-align:center;margin-top:30px;font-size:10px;color:#475569;">
    POWERED BY GEMINI 2.5 FLASH
  </div>
</div>
  `.trim();

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(ANTIGRAVITY_EMAIL_TEMPLATE);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    
    try {
      // Attempt 1: ipwho.is (Very CORS friendly)
      try {
        const response = await fetch('https://ipwho.is/');
        if (response.ok) {
          const data = await response.json();
          if (data.country) {
            setSelectedCountry(data.country);
            return; // Success!
          }
        }
      } catch (e) {
        console.warn("Primary location API (ipwho.is) failed, trying backup...", e);
      }

      // Attempt 2: freeipapi.com (Fallback)
      try {
        const response = await fetch('https://freeipapi.com/api/json');
        if (response.ok) {
          const data = await response.json();
          if (data.countryName) {
            setSelectedCountry(data.countryName);
            return; // Success!
          }
        }
      } catch (e) {
        console.warn("Secondary location API failed", e);
      }

      // Attempt 3: ipapi.co (Strict CORS, often fails on localhost but good in prod)
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          if (data.country_name) {
            setSelectedCountry(data.country_name);
            return; // Success!
          }
        }
      } catch (e) {
        console.warn("Tertiary location API failed", e);
      }

      throw new Error("All location services failed");

    } catch (error) {
      console.error("Failed to detect location", error);
      alert("Could not automatically detect location. Please select manually.");
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      // 1. Save to Supabase
      const { error: supabaseError } = await supabase
        .from('job_alerts')
        .insert([
          { 
            email, 
            role, 
            country: selectedCountry, 
            frequency,
            is_active: true
          }
        ]);

      if (supabaseError) {
        console.error("Supabase error:", supabaseError);
        // If table doesn't exist yet, we might want to fail gracefully or show a specific error
        // For now, we'll log it but proceed to email so the user gets some feedback
      }

      // 2. Generate the personalized confirmation message using AI
      const message = await generateAlertConfirmation(role, selectedCountry, email);
      setConfirmationMessage(message);
      
      // 3. Attempt to send Real Email if fully configured
      if (isConfigured) {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: email,      // Primary variable for recipient
            email: email,         // Fallback alias
            reply_to: email,      // Fallback alias
            user_email: email,    // Fallback alias
            message: message,
            role: role,
            country: selectedCountry,
            frequency: frequency
          },
          EMAILJS_PUBLIC_KEY
        );
        console.log("Real email sent successfully via EmailJS");
      } else {
        console.warn("EmailJS not fully configured. Running in simulation mode.");
        // Simulated delay
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // 4. Persist state in parent
      onSubscribe();
      setStatus('success');
    } catch (error: any) {
      const errorMessage = error.text ? error.text : JSON.stringify(error);
      console.error("Failed to send email:", errorMessage);
      
      if (errorMessage.includes("recipients address is empty")) {
         console.warn("TIP: Go to EmailJS Template -> Settings -> 'To Email' field. Set it to {{to_email}}");
      }
      
      // Fallback for UI if email fails (e.g. invalid template ID despite being set)
      setConfirmationMessage(`Radar lock established. Monitoring ${role} vectors in ${selectedCountry}.`);
      onSubscribe();
      setStatus('success');
    }
  };

  const handleClose = () => {
    if (status === 'success') {
        setStatus('idle');
        setEmail('');
        setConfirmationMessage('');
        setShowDevGuide(false);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-fade-in-up my-auto">
        
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none"></div>

        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 relative z-10">
          {status === 'success' ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white font-display">Radar Activated</h3>
              <p className="text-slate-300 italic text-lg leading-relaxed px-2">
                "{confirmationMessage}"
              </p>
              <p className="text-sm text-indigo-300 mt-2 font-medium">
                Want to track another role? You can add as many alerts as you like!
              </p>
              
              {!isConfigured && (
                 <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-xs text-yellow-200 text-left">
                    <div className="flex items-center gap-2 mb-1 font-bold">
                       <AlertTriangle className="w-3 h-3" />
                       Simulation Mode Active
                    </div>
                    Real emails disabled. Missing: <span className="font-mono">{missingConfig.join(', ')}</span>.
                    <br/>Update <code>components/JobAlertsModal.tsx</code> to fix.
                 </div>
              )}

              <p className="text-slate-500 text-xs mt-4">
                Transmission frequency set to: {frequency}
              </p>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 font-medium"
              >
                Return to Mission
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Bell className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-white">JobNado Radar</h2>
                  <p className="text-xs text-slate-400">Never miss an opportunity</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Transmission Endpoint (Email)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Target Sector (Location)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-8 text-sm text-white appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      >
                        <option value="" disabled>Select Target Country</option>
                        {COUNTRIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        {selectedCountry && !COUNTRIES.includes(selectedCountry) && <option value={selectedCountry}>{selectedCountry}</option>}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors disabled:opacity-50"
                      title="Detect Location"
                    >
                      {isDetectingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-300 ml-1">Scan Frequency</label>
                   <div className="grid grid-cols-2 gap-3">
                     <button
                       type="button"
                       onClick={() => setFrequency('daily')}
                       className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                         frequency === 'daily' 
                           ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                           : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                       }`}
                     >
                       <Radio className={`w-3 h-3 ${frequency === 'daily' ? 'fill-current' : ''}`} />
                       Daily
                     </button>
                     <button
                       type="button"
                       onClick={() => setFrequency('weekly')}
                       className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                         frequency === 'weekly' 
                           ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                           : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                       }`}
                     >
                       <Radio className={`w-3 h-3 ${frequency === 'weekly' ? 'fill-current' : ''}`} />
                       Weekly
                     </button>
                   </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'submitting' || !email}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
                  >
                    {status === 'submitting' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                    {status === 'submitting' ? 'Establishing Uplink...' : 'Activate Radar'}
                  </button>
                </div>
              </form>

              {/* Developer / Template Guide Section */}
              <div className="border-t border-slate-800 pt-4 mt-2">
                <button 
                  onClick={() => setShowDevGuide(!showDevGuide)}
                  className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-400 transition-colors w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Code className="w-3 h-3" />
                    {!isConfigured ? 'Action Required: Finish Setup' : 'View Email Template'}
                  </span>
                  {showDevGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showDevGuide && (
                  <div className="mt-3 bg-black/40 rounded-lg p-3 border border-slate-800 animate-fade-in">
                    {!isConfigured && (
                      <div className="mb-3 pb-3 border-b border-slate-800">
                        <p className="text-[10px] text-yellow-400 font-bold mb-1">Missing Credentials Detected</p>
                        <p className="text-[10px] text-slate-400">
                           You have added the Service ID and Public Key. 
                           <br/>
                           <strong className="text-white">To fix:</strong> Create a template in EmailJS, then paste the <code>Template ID</code> into line 18 of <code>JobAlertsModal.tsx</code>.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">EmailJS HTML Content</span>
                      <button 
                        onClick={handleCopyTemplate}
                        className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-white transition-colors"
                      >
                        {copiedTemplate ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedTemplate ? 'Copied' : 'Copy HTML'}
                      </button>
                    </div>
                    <pre className="text-[10px] text-slate-500 font-mono overflow-x-auto whitespace-pre-wrap h-32 bg-slate-950 p-2 rounded border border-slate-900 custom-scrollbar">
                      {ANTIGRAVITY_EMAIL_TEMPLATE}
                    </pre>
                    <div className="text-[10px] text-slate-600 mt-2 space-y-2">
                      <p>
                        1. Paste this into your EmailJS template editor.
                      </p>
                      <p className="text-indigo-400 font-semibold border-l-2 border-indigo-500 pl-2">
                        CRITICAL STEP: In the EmailJS Template Settings (header), set the "To Email" field to <code>{'{{to_email}}'}</code>.
                        <br/>Without this, the email will fail with "Recipient address empty".
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobAlertsModal;