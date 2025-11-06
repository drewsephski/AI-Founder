import React, { useState, useCallback, useContext } from 'react';
import { generateImage } from '../../services/geminiService';
import { useUser } from '../../UserContext';
import { View } from '../../types';
import { AppViewContext } from '../../App';

const ImageGeneratorTool: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [style, setStyle] = useState('photorealistic');
  const [negativePrompt, setNegativePrompt] = useState('');

  const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  const styles = ['photorealistic', 'cartoon', 'anime', 'abstract', 'fantasy', 'minimalist'];

  const { userPlan, usageLimits, decrementImageGenerations, authenticated } = useUser();
  const { setView } = useContext(AppViewContext)!;

  const isProPlan = userPlan === 'pro';
  const hasImageGenerationsLeft = usageLimits.imageGenerations > 0;
  const canGenerateImages = authenticated && (userPlan === 'advanced' || (isProPlan && hasImageGenerationsLeft));

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    if (!authenticated) {
      setError("Please log in to generate images.");
      return;
    }
    if (!canGenerateImages) {
      setError(isProPlan ? "You've reached your daily image generation limit. Upgrade to Advanced for unlimited access!" : "Your current plan does not allow image generation. Upgrade to Pro or Advanced.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let finalPrompt = prompt;
      if (style !== 'none') {
        finalPrompt = `A ${style} style image of: ${prompt}`;
      }
      if (negativePrompt.trim()) {
        finalPrompt += `. Avoid the following: ${negativePrompt.trim()}`;
      }
      
      const resultBase64 = await generateImage(finalPrompt, aspectRatio);
      setGeneratedImage(`data:image/png;base64,${resultBase64}`);

      if (isProPlan) {
        await decrementImageGenerations(); // Decrement after successful generation for Pro plan
      }
    } catch (err) {
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio, style, negativePrompt, canGenerateImages, isProPlan, decrementImageGenerations, authenticated]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center p-4 border-2 border-dashed border-border rounded-lg min-h-96 bg-background">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-secondary-foreground">Generating...</p>
          </div>
        ) : generatedImage ? (
          <img src={generatedImage} alt="Generated" className="max-h-full max-w-full object-contain rounded" />
        ) : (
          <p className="text-secondary-foreground">Your generated image will appear here</p>
        )}
      </div>
      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., An astronaut riding a horse on Mars"
          className={`w-full p-3 bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition ${!canGenerateImages ? 'opacity-50 cursor-not-allowed' : ''}`}
          rows={3}
          disabled={isLoading || !canGenerateImages}
        />

        {authenticated ? (
          isProPlan && (
            <p className={`text-sm ${hasImageGenerationsLeft ? 'text-secondary-foreground/70' : 'text-red-400'}`}>
              {hasImageGenerationsLeft ? `You have ${usageLimits.imageGenerations} image generations left today.` : "You've reached your daily image generation limit. Upgrade to Advanced for unlimited access!"}
            </p>
          )
        ) : (
          <p className="text-sm text-yellow-400">
            Please <button onClick={() => setView(View.Auth)} className="text-primary hover:underline">log in</button> to generate images.
          </p>
        )}
        {!authenticated && (userPlan === 'starter') && (
          <p className="text-sm text-yellow-400">
            Image generation is available on Pro and Advanced plans. Upgrade to access!
          </p>
        )}
        

        {/* Advanced Options */}
        <div>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm font-semibold text-primary hover:underline">
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
          {showAdvanced && (
            <div className="mt-4 p-4 bg-secondary/50 border border-border rounded-lg space-y-4 animate-fade-in">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-secondary-foreground mb-2">Aspect Ratio</label>
                <div className="flex flex-wrap gap-2">
                  {aspectRatios.map(ar => (
                    <button
                      key={ar}
                      onClick={() => setAspectRatio(ar)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${aspectRatio === ar ? 'bg-primary text-primary-foreground' : 'bg-accent hover:bg-border'} ${!canGenerateImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!canGenerateImages}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Style */}
              <div>
                <label htmlFor="style-select" className="block text-sm font-medium text-secondary-foreground mb-2">Style</label>
                <select
                  id="style-select"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className={`w-full p-2 bg-accent border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none ${!canGenerateImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!canGenerateImages}
                >
                  {styles.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>

              {/* Negative Prompt */}
              <div>
                <label htmlFor="negative-prompt" className="block text-sm font-medium text-secondary-foreground mb-2">Negative Prompt</label>
                <input
                  id="negative-prompt"
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="e.g., text, watermarks, blurry"
                  className={`w-full p-2 bg-accent border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none ${!canGenerateImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isLoading || !canGenerateImages}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
            <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim() || !canGenerateImages}
            className={`px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 disabled:bg-secondary disabled:text-secondary-foreground/50 transition-colors ${!canGenerateImages ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
            {isLoading ? 'Processing...' : 'Generate'}
            </button>
        </div>
      </div>
       {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default ImageGeneratorTool;