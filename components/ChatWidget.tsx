import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, User, Bot } from 'lucide-react';
import { chatWithAI } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm JobNado AI. How can I help you with your career journey today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    // Add user message
    const newMessages = [...messages, { role: 'user', text: userMessage } as Message];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Prepare history for API (excluding the initial greeting if needed, but keeping it is fine)
      // We map our simple Message type to the API's expected format
      const history = newMessages.map(m => ({
        role: m.role,
        parts: m.text
      }));

      // Call API
      // Note: We pass the history *excluding* the last message we just added, 
      // and pass the last message as the 'message' argument to the service.
      // Actually, the service I wrote expects history + new message.
      // Let's adjust: pass previous history + current message.
      
      const apiHistory = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        parts: m.text
      }));
      
      const responseText = await chatWithAI(apiHistory, userMessage);

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered a glitch in the matrix. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto mb-4 w-[350px] h-[500px] bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in origin-bottom-right">
          
          {/* Header */}
          <div className="p-4 bg-indigo-600/20 border-b border-indigo-500/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">JobNado Assistant</h3>
                <p className="text-[10px] text-indigo-300">Online • AI Powered</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/50">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-slate-700' : 'bg-indigo-900/50 border border-indigo-500/30'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-indigo-300" />}
                </div>
                
                <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-indigo-300" />
                 </div>
                 <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-slate-700 flex items-center gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about your career..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_rgba(79,70,229,0.7)] transition-all duration-300 transform hover:scale-110"
      >
        <div className="absolute inset-0 rounded-full bg-indigo-400 opacity-0 group-hover:animate-ping"></div>
        {isOpen ? (
          <X className="w-6 h-6 relative z-10" />
        ) : (
          <MessageCircle className="w-6 h-6 relative z-10" />
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
