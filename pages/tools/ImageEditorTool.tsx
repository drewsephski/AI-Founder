import React, { useState, useCallback } from 'react';
import { editImage } from '../../services/geminiService';

const ImageEditorTool: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalMimeType, setOriginalMimeType] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setOriginalMimeType(file.type);
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (dataUrl: string) => dataUrl.split(',')[1];

  const handleSubmit = useCallback(async () => {
    if (!prompt || !originalImage || !originalMimeType) {
      setError('Please upload an image and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const base64Data = fileToBase64(originalImage);
      const resultBase64 = await editImage(prompt, base64Data, originalMimeType);
      setEditedImage(`data:image/png;base64,${resultBase64}`);
    } catch (err) {
      setError('Failed to edit image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, originalImage, originalMimeType]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-lg h-80 bg-background">
          {originalImage ? (
            <img src={originalImage} alt="Original" className="max-h-full max-w-full object-contain rounded" />
          ) : (
            <div className="text-center text-secondary-foreground">
              <p>Upload an image to begin</p>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-4 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-center p-4 border-2 border-dashed border-border rounded-lg h-80 bg-background">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-secondary-foreground">Generating...</p>
            </div>
          ) : editedImage ? (
            <img src={editedImage} alt="Edited" className="max-h-full max-w-full object-contain rounded" />
          ) : (
            <p className="text-secondary-foreground">Your edited image will appear here</p>
          )}
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Add a retro filter, or Remove the person in the background"
          className="w-full p-3 bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition"
          rows={3}
          disabled={isLoading || !originalImage}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !prompt || !originalImage}
          className="self-end px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 disabled:bg-secondary disabled:text-secondary-foreground/50 transition-colors"
        >
          {isLoading ? 'Processing...' : 'Generate'}
        </button>
      </div>
       {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default ImageEditorTool;
