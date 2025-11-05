import React, { useState, useCallback, useRef, useEffect } from 'react';
import { searchWithGoogle } from '../../services/geminiService';
import { SendIcon, BotIcon, UserIcon, LinkIcon } from '../../components/icons/Icons';
import { ChatMessage } from '../../types';

const GoogleSearchTool: React.FC = () => {
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
      const { text, sources } = await searchWithGoogle(prompt);
      const modelMessage: ChatMessage = { role: 'model', text: text, sources: sources };
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
    <div className="flex flex-col h-[65vh]">
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><BotIcon className="w-5 h-5" /></div>}
            <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50">
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><LinkIcon className="w-3 h-3" /> Sources:</h4>
                  <ul className="space-y-1">
                    {msg.sources.map((source, i) => (
                      <li key={i}>
                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/80 hover:underline break-all">
                          {i + 1}. {source.web.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center"><UserIcon className="w-5 h-5" /></div>}
          </div>
        ))}
         {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><BotIcon className="w-5 h-5" /></div>
            <div className="p-3 rounded-lg bg-secondary flex items-center space-x-2">
              <span className="text-sm">Searching...</span>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border">
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="w-full p-3 pr-12 bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-secondary disabled:text-secondary-foreground/50 transition-colors"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleSearchTool;
