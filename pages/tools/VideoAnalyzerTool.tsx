import React, { useState, useCallback, useRef } from 'react';
import { analyzeVideo } from '../../services/geminiService';

const MAX_FRAMES = 10;
const FRAME_CAPTURE_INTERVAL_S = 1;

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to convert blob to base64.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const VideoAnalyzerTool: React.FC = () => {
  const [prompt, setPrompt] = useState('Summarize this video, identify key moments, and suggest highlights for engagement.');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setAnalysis(null);
      setError(null);
    }
  };

  const extractFrames = useCallback(async (videoElement: HTMLVideoElement): Promise<{mimeType: string, data: string}[]> => {
      return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          const frames: {mimeType: string, data: string}[] = [];
          
          let currentTime = 0;
          const duration = videoElement.duration;
          const interval = Math.max(FRAME_CAPTURE_INTERVAL_S, duration / MAX_FRAMES);

          videoElement.currentTime = 0;

          const captureFrame = async () => {
              if (!context) return;
              canvas.width = videoElement.videoWidth;
              canvas.height = videoElement.videoHeight;
              context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
              
              const blob = await new Promise<Blob | null>(resolveBlob => canvas.toBlob(resolveBlob, 'image/jpeg', 0.8));
              if(blob){
                  const base64Data = await blobToBase64(blob);
                  frames.push({ mimeType: 'image/jpeg', data: base64Data });
              }

              currentTime += interval;
              setProgress(`Extracting frames... (${frames.length}/${Math.min(MAX_FRAMES, Math.floor(duration/interval))})`);

              if (currentTime <= duration && frames.length < MAX_FRAMES) {
                  videoElement.currentTime = currentTime;
              } else {
                  resolve(frames);
              }
          };
          
          videoElement.onseeked = captureFrame;
          captureFrame();
      });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!videoFile || !videoRef.current) {
      setError('Please upload a video first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    
    try {
      setProgress('Extracting frames...');
      const frames = await extractFrames(videoRef.current);
      if (frames.length === 0) {
        throw new Error('Could not extract any frames from the video.');
      }
      setProgress('Analyzing video with AI...');
      const result = await analyzeVideo(prompt, frames);
      setAnalysis(result);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to analyze video: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  }, [prompt, videoFile, extractFrames]);

  return (
    <div className="space-y-6">
      <div className="p-4 border-2 border-dashed border-border rounded-lg bg-background">
          {!videoSrc ? (
            <div className="text-center text-secondary-foreground h-64 flex flex-col justify-center">
              <p>Upload a video to begin</p>
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="mx-auto mt-4 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
            </div>
          ) : (
            <video ref={videoRef} src={videoSrc} controls className="w-full max-h-80 rounded" />
          )}
      </div>

      <div className="flex flex-col space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to analyze in the video..."
          className="w-full p-3 bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition"
          rows={2}
          disabled={isLoading || !videoFile}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !videoFile}
          className="self-end px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 disabled:bg-secondary disabled:text-secondary-foreground/50 transition-colors"
        >
          {isLoading ? 'Processing...' : 'Analyze Video'}
        </button>
      </div>

      {isLoading && <p className="text-primary text-sm text-center">{progress}</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      {analysis && (
        <div className="mt-6 p-4 bg-secondary rounded-lg border border-border">
          <h3 className="text-lg font-semibold mb-2">Analysis Result</h3>
          <p className="whitespace-pre-wrap text-secondary-foreground/90">{analysis}</p>
        </div>
      )}
    </div>
  );
};

export default VideoAnalyzerTool;
