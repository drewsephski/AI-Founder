import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getStandardChatStream } from '../../services/geminiService';
import { SendIcon, BotIcon, UserIcon, MicIcon, StopIcon } from '../../components/icons/Icons';
import { ChatMessage, View } from '../../types';
import { useUser } from '../../UserContext';
import { useContext } from 'react';
import { AppViewContext } from '../../App';


// Extend window type for SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    isSecureContext: boolean;
  }
}

const StandardChatTool: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any | null>(null);

  const { userPlan, usageLimits, decrementAIChatGenerations, authenticated } = useUser();
  const { setView } = useContext(AppViewContext)!;
  const isStarterPlan = userPlan === 'starter';
  const hasChatGenerationsLeft = usageLimits.aiChatGenerations > 0;
  const canChat = authenticated && ((isStarterPlan && hasChatGenerationsLeft) || userPlan !== 'starter');


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || !canChat) {
      if (!authenticated) {
        setError("Please log in to use the AI Chatbot.");
      } else if (isStarterPlan && !hasChatGenerationsLeft) {
        setError("You've reached your daily chat limit. Upgrade for more!");
      }
      return;
    }

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    // Add a placeholder for the model's response
    setMessages((prev) => [...prev, { role: 'model', text: '' }]);

    try {
      const history = messages.slice(0, -1).map(msg => ({ // Exclude the placeholder message from history
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
      if (isStarterPlan) {
        await decrementAIChatGenerations(); // Decrement after successful generation for starter plan
      }

    } catch (err) {
      setError('Failed to get a response. Please try again.');
      setMessages(prev => prev.slice(0, -1)); // Remove placeholder on error
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, canChat, isStarterPlan, decrementAIChatGenerations, authenticated, hasChatGenerationsLeft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
      }
  };

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    if (!canChat) {
      if (!authenticated) {
        setError("Please log in to use the AI Chatbot.");
      } else if (isStarterPlan && !hasChatGenerationsLeft) {
        setError("You've reached your daily chat limit. Upgrade for more!");
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported by your browser.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setInput('');
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setInput(transcript);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' && !window.isSecureContext) {
        setError('Speech recognition requires a secure context (HTTPS). Please ensure you are accessing the app over HTTPS or on localhost.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsRecording(false);
    };

    try {
        recognition.start();
    } catch (e: any) {
        if (e.name === 'SecurityError') {
            setError('Speech recognition requires a secure context (HTTPS). Please ensure you are accessing the app over HTTPS or on localhost.');
        } else {
            setError(`Failed to start speech recognition: ${e.message}`);
        }
        setIsRecording(false);
    }
  }, [isRecording, canChat, isStarterPlan, authenticated, hasChatGenerationsLeft]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);


  return (
    <div className="flex flex-col h-[65vh]">
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
             {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><BotIcon className="w-5 h-5" /></div>}
            <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
              <p className="whitespace-pre-wrap">{msg.text}{msg.role === 'model' && isLoading && index === messages.length - 1 && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />}</p>
            </div>
             {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center"><UserIcon className="w-5 h-5" /></div>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border">
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {authenticated ? (
          isStarterPlan && (
            <p className={`text-sm mb-2 ${hasChatGenerationsLeft ? 'text-secondary-foreground/70' : 'text-red-400'}`}>
              {hasChatGenerationsLeft ? `You have ${usageLimits.aiChatGenerations} AI Chat generations left today.` : "You've reached your daily chat limit. Upgrade for more!"}
            </p>
          )
        ) : (
          <p className="text-sm mb-2 text-yellow-400">
            Please <button onClick={() => setView(View.Auth)} className="text-primary hover:underline">log in</button> to use the AI Chatbot.
          </p>
        )}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : "Type your message..."}
            className={`w-full p-3 pr-24 bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition resize-none ${!canChat ? 'opacity-50 cursor-not-allowed' : ''}`}
            rows={2}
            disabled={isLoading || !canChat}
          />
          <button
            onClick={handleMicClick}
            disabled={isLoading || !canChat}
            className={`absolute right-14 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors disabled:bg-secondary disabled:text-secondary-foreground/50 ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? <StopIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim() || !canChat}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-secondary disabled:text-secondary-foreground/50 transition-colors ${!canChat ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Send message"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandardChatTool;