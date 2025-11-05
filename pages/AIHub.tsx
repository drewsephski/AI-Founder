import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from '@clerk/clerk-react';
import { createClerkSupabaseClient, saveSession } from '../services/supabaseService';
// Fix: "LiveSession" is not an exported member of "@google/genai".
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { MicIcon, StopIcon } from '../components/icons/Icons';
import { TranscriptionEntry, SavedSession } from '../types';
import SaveSessionModal from '../components/SaveSessionModal';

// Audio helper functions
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// FIX: Add missing audio decoding functions
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// FIX: Replace broken code block with a functional audio resampling implementation
function resampleBuffer(inputBuffer: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array {
  if (fromSampleRate === toSampleRate) {
    return inputBuffer;
  }
  const sampleRateRatio = fromSampleRate / toSampleRate;
  const newLength = Math.round(inputBuffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < inputBuffer.length; i++) {
        accum += inputBuffer[i];
        count++;
    }
    result[offsetResult] = accum / (count || 1);
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

enum CallStatus {
  Idle = 'Ready to call your AI Cofounder.',
  Initializing = 'Initializing audio...',
  Connecting = 'Calling your AI Cofounder...',
  Connected = 'Connected. Waiting for AI...',
  Live = 'Mic is open. You can speak at any time.',
  Ending = 'Call ended. Ready to start a new call.',
}

const AIHub: React.FC = () => {
  const [isConversing, setIsConversing] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.Idle);
  const [error, setError] = useState<string | null>(null);
  const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [transcriptToSave, setTranscriptToSave] = useState<TranscriptionEntry[] | null>(null);
  
  const { session } = useSession();
  const supabase = useMemo(() => createClerkSupabaseClient(session), [session]);

  const transcriptionsRef = useRef(transcriptions);
  transcriptionsRef.current = transcriptions;

  // Fix: Replaced non-exported type "LiveSession" with "any".
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nativeSampleRateRef = useRef<number>(16000);

  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);

  const initialResponseTimerRef = useRef<number | null>(null);
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');
  
  const cleanupAudio = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    audioContextRef.current = null;

    outputSourcesRef.current.forEach(source => source.stop());
    outputSourcesRef.current.clear();

    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close().catch(console.error);
    }
    outputAudioContextRef.current = null;
    nextStartTimeRef.current = 0;
  }, []);

  const stopConversation = useCallback((isError: boolean = false) => {
    if (initialResponseTimerRef.current) {
      clearTimeout(initialResponseTimerRef.current);
      initialResponseTimerRef.current = null;
    }

    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session?.close()).catch(console.error);
        sessionPromiseRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    cleanupAudio();
    
    setIsConversing(false);

    const transcript = transcriptionsRef.current;
    if (!isError && transcript.length > 0) {
      setTranscriptToSave(transcript);
      setIsSaveModalOpen(true);
    } else if (isError) {
      // Clear transcript on error to avoid confusion
      setTranscriptions([]);
    }

    if (!isError) {
      setCallStatus(CallStatus.Ending);
    }
  }, [cleanupAudio]);

  const handleSaveSession = async (sessionName: string) => {
    if (!transcriptToSave || !supabase) return;
    try {
      await saveSession(supabase, sessionName, transcriptToSave);
      handleNewSession(); // Clear transcript after saving
    } catch (e) {
      console.error("Failed to save session:", e);
      setError("Could not save session to the database.");
    } finally {
      setIsSaveModalOpen(false);
      setTranscriptToSave(null);
    }
  };
  
  const handleCloseSaveModal = () => {
    setIsSaveModalOpen(false);
    setTranscriptToSave(null);
  };

  const handleNewSession = () => {
    setTranscriptions([]);
    setCallStatus(CallStatus.Idle);
    setError(null);
  };

  const startConversation = async () => {
    if (isConversing) return;
    
    handleNewSession(); // Always start with a clean state
    setError(null);
    setCallStatus(CallStatus.Initializing);
    setIsConversing(true);

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      nativeSampleRateRef.current = audioContextRef.current.sampleRate;
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: nativeSampleRateRef.current, channelCount: 1 },
      });

      setCallStatus(CallStatus.Connecting);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `You are 'Strat,' an expert AI business strategist and startup cofounder. Your core purpose is to be a proactive, insightful partner who challenges the user to think critically about their business.

Your first action in every call is to speak first. Introduce yourself as 'Strat' and ask if there's a specific business idea or challenge the user wants to focus on today. For example: "It's Strat. Good to connect. Do you have a specific business challenge on your mind, or should we jump into some strategic brainstorming?"

If the user doesn't have a specific topic, or asks you to lead, then you must ask a sharp, strategic business question to kick things off.

Crucially, you must vary this follow-up question in every call. Do not repeat yourself. Draw from different strategic domains to keep the conversation fresh. Here are some examples to inspire your approach:

- On Market & Customer: "Alright, let's jump in. Who is your absolute ideal customer, and what problem are you solving for them that they'd gladly pay for?"
- On Core Assumptions: "Okay, let's get straight to it. What is the single riskiest assumption you're making, and what's the cheapest, fastest way we could test it this week?"
- On Competitive Landscape: "Understood. Tell me, who are your top two competitors, and what is the one thing you're going to do better than both of them?"
- On Vision & Moat: "Perfect. Let's think big. Fast forward five years. What is the unique, defensible advantage—the moat—that will protect your business from copycats?"
- On Pivoting: "Got it. Quick thought experiment: if your main product idea was suddenly off the table, what's the pivot? What's plan B?"

Your tone is direct, sharp, but always constructive. You are focused on actionable strategy, pushing for clarity on market fit, monetization, and sustainable growth. Your goal is to turn vague ideas into concrete plans.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setCallStatus(CallStatus.Connected);

            initialResponseTimerRef.current = window.setTimeout(() => {
              setError('The AI did not respond in time. This may be a temporary issue. Please try again.');
              stopConversation(true);
            }, 8000);

            if (!audioContextRef.current || !mediaStreamRef.current) return;

            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            sessionPromise.then(session => {
                session?.sendRealtimeInput({ text: "Initiate the strategy session." });

                if(scriptProcessorRef.current) {
                  scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const resampledData = resampleBuffer(inputData, nativeSampleRateRef.current, 16000);
                    
                    const l = resampledData.length;
                    const int16 = new Int16Array(l);
                    for (let i = 0; i < l; i++) {
                      int16[i] = resampledData[i] * 32768;
                    }
                    const pcmBlob: Blob = {
                      data: encode(new Uint8Array(int16.buffer)),
                      mimeType: 'audio/pcm;rate=16000',
                    };
                    session?.sendRealtimeInput({ media: pcmBlob });
                  };
                }
            }).catch(err => {
                console.error("Session promise failed:", err);
                setError("Could not establish a connection with the AI.");
                stopConversation(true);
            });
            
            const gainNode = audioContextRef.current.createGain();
            gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
            gainNode.connect(audioContextRef.current.destination);

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(gainNode);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (initialResponseTimerRef.current) {
                clearTimeout(initialResponseTimerRef.current);
                initialResponseTimerRef.current = null;
            }
            if (callStatus === CallStatus.Connected) {
                setCallStatus(CallStatus.Live);
            }

            if (message.serverContent?.outputTranscription) {
                currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.inputTranscription) {
                currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
                const userInput = currentInputTranscription.current.trim();
                const modelOutput = currentOutputTranscription.current.trim();
                setTranscriptions(prev => {
                    const newTranscriptions = [...prev];
                    if (userInput) newTranscriptions.push({ speaker: 'user', text: userInput });
                    if (modelOutput) newTranscriptions.push({ speaker: 'model', text: modelOutput });
                    return newTranscriptions;
                });
                currentInputTranscription.current = '';
                currentOutputTranscription.current = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            const outputCtx = outputAudioContextRef.current;
            if (base64Audio && outputCtx) {
                if (outputCtx.state === 'suspended') {
                    await outputCtx.resume();
                }
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                source.addEventListener('ended', () => outputSourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                outputSourcesRef.current.add(source);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('API Error:', e);
            setError(`Connection to the AI was lost: ${e.message}. Please check your network and try again.`);
            stopConversation(true);
          },
          onclose: () => {
            console.log('Session closed.');
          },
        },
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error('Failed to start conversation:', err);
      let specificError = 'An unexpected error occurred while starting the call. Please try again.';

      if (err instanceof Error) {
          switch (err.name) {
              case 'NotAllowedError':
                  specificError = 'Microphone access denied. Please enable microphone permissions in your browser settings to use the AI Hub.';
                  break;
              case 'NotFoundError':
                  specificError = 'No microphone found. Please ensure a microphone is connected and enabled.';
                  break;
              case 'NotReadableError':
                  specificError = 'There was a hardware error with your microphone. Please check your device connection.';
                  break;
              default:
                  specificError = `Could not start the call due to an initialization error: ${err.message}`;
          }
      }
      
      setError(specificError);
      stopConversation(true);
    }
  };

  const stopConversationStable = useCallback(stopConversation, [stopConversation]);

  useEffect(() => {
    return () => {
      stopConversationStable(true);
    };
  }, [stopConversationStable]);
  
  const statusMessage = error || callStatus;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">AI Cofounder Call</h1>
          <p className="mt-4 text-lg text-secondary-foreground/80">
            Click the button below to start a live voice call with your AI business partner.
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 min-h-[50vh] flex flex-col">
          <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2">
            {transcriptions.map((t, i) => (
              <div key={i} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg max-w-md ${t.speaker === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <span className="font-bold capitalize">{t.speaker}: </span>{t.text}
                </div>
              </div>
            ))}
             {!transcriptions.length && !isConversing && (
                 <div className="flex items-center justify-center h-full text-secondary-foreground">
                    <p>Conversation transcript will appear here.</p>
                </div>
             )}
          </div>
          <div className="flex flex-col items-center border-t border-border pt-6">
            <div className="relative flex justify-center items-center w-full h-5 mb-4">
               <p className={`text-sm text-center ${error ? 'text-red-500' : 'text-secondary-foreground/70'}`}>{statusMessage}</p>
                {!isConversing && transcriptions.length > 0 && (
                  <button 
                    onClick={handleNewSession}
                    className="absolute right-0 text-sm font-semibold text-primary hover:underline"
                  >
                    New Session
                  </button>
                )}
            </div>
            <button
              onClick={isConversing ? () => stopConversation() : startConversation}
              disabled={isConversing && callStatus !== CallStatus.Live && callStatus !== CallStatus.Connected}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isConversing ? 'bg-red-600 hover:bg-red-700 animate-pulse-glow' : 'bg-green-500 hover:bg-green-600'} disabled:bg-secondary disabled:cursor-not-allowed`}
              aria-label={isConversing ? 'End call' : 'Start call'}
            >
              {isConversing ? <StopIcon className="w-8 h-8 text-white" /> : <MicIcon className="w-8 h-8 text-white" />}
            </button>
          </div>
        </div>
      </div>
      <SaveSessionModal 
        isOpen={isSaveModalOpen}
        onSave={handleSaveSession}
        onClose={handleCloseSaveModal}
      />
    </div>
  );
};

export default AIHub;