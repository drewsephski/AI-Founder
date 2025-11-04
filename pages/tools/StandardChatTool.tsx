import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getStandardChatStream } from '../../services/geminiService';
import { SendIcon, BotIcon, UserIcon } from '../../components/icons/Icons';
import { ChatMessage } from '../../types';

const StandardChatTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    // Add a placeholder for the model's response
    setMessages((prev) => [...prev, { role: 'model', text: '' }]);

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      
      const stream = await getStandardChatStream(history, input);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text += chunkText;
            return newMessages;
        });
      }

    } catch (err) {
      setError('Failed to get a response. Please try again.');
      setMessages(prev => prev.slice(0, -1)); // Remove placeholder on error
    } finally {
      setIsLoading(false);
    }
  }, [input, messages]);

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
            <h1 className="text-4xl font-bold tracking-tight text-foreground font-bricolage">Standard Chat</h1>
            <p className="mt-4 text-lg text-muted-foreground font-bricolage">
              Have a conversation with AI. Ask questions, get advice, or just chat about anything.
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
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.text}
                        {msg.role === 'model' && isLoading && index === messages.length - 1 && (
                          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                        )}
                      </p>
                    </div>
                    {msg.role === 'user' && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center mt-1"><UserIcon className="w-6 h-6" /></div>}
                  </div>
                ))}
                <div ref={messagesEndRef} />
                
                {!messages.length && !isLoading && (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <BotIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Start a conversation with AI</p>
                      <p className="text-sm mt-2">Type a message below to begin</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-border bg-card">
                {error && (
                  <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                    {error}
                  </p>
                )}
                <div className="relative max-w-4xl">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="w-full p-4 pr-16 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition resize-none text-sm leading-relaxed"
                    rows={3}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !input.trim()}
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

export default StandardChatTool;
