import React, { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeComplexQuery } from '../../services/geminiService';
import { SendIcon, BotIcon, UserIcon } from '../../components/icons/Icons';
import { ChatMessage } from '../../types';

const ComplexQueryTool: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeComplexQuery(prompt);
      const modelMessage: ChatMessage = { role: 'model', text: result };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (err) {
      setError('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
      }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground font-bricolage">Complex Query Analyzer</h1>
            <p className="mt-4 text-lg text-muted-foreground font-bricolage">
              Ask complex analytical questions and get detailed insights from advanced AI.
            </p>
          </div>

          {/* Chat Container */}
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="flex flex-col h-[70vh]">
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex items-start gap-4 max-w-4xl ${msg.role === 'user' ? 'ml-auto justify-end' : ''}`}>
                    {msg.role === 'model' && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center mt-1"><BotIcon className="w-6 h-6" /></div>}
                    <div className={`p-4 rounded-lg max-w-3xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.role === 'user' && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center mt-1"><UserIcon className="w-6 h-6" /></div>}
                  </div>
                ))}
                 {isLoading && (
                  <div className="flex items-start gap-4 max-w-4xl">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary flex items-center justify-center mt-1"><BotIcon className="w-6 h-6" /></div>
                    <div className="p-4 rounded-lg bg-muted flex items-center space-x-3">
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-6 border-t border-border bg-card">
                {error && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
                <div className="relative max-w-4xl">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a complex analytical question..."
                    className="w-full p-4 pr-16 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition resize-none text-sm leading-relaxed"
                    rows={3}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !prompt.trim()}
                    className="absolute right-4 bottom-4 p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <SendIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplexQueryTool;
