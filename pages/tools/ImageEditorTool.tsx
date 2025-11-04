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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground font-bricolage">AI Image Editor</h1>
            <p className="mt-4 text-lg text-muted-foreground font-bricolage">
              Transform your images with AI-powered editing. Upload an image and describe the changes you want to make.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            {/* Image Display Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground">Original Image</h3>
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg min-h-[400px] bg-background">
                  {originalImage ? (
                    <img src={originalImage} alt="Original" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
                  ) : (
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">Upload an image to begin editing</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="text-sm file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-colors cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground">Edited Image</h3>
                <div className="flex items-center justify-center p-6 border-2 border-dashed border-border rounded-lg min-h-[400px] bg-background">
                  {isLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                      <p className="mt-4 text-muted-foreground">Processing your image...</p>
                    </div>
                  ) : editedImage ? (
                    <img src={editedImage} alt="Edited" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
                  ) : (
                    <p className="text-muted-foreground text-center">Your edited image will appear here</p>
                  )}
                </div>
              </div>
            </div>

            {/* Prompt and Actions */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Describe the changes you want to make
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Add a vintage filter, Remove the background, Change the lighting to golden hour..."
                  className="w-full p-4 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition text-sm leading-relaxed"
                  rows={4}
                  disabled={isLoading || !originalImage}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {!originalImage && "Please upload an image to start"}
                  {originalImage && !prompt && "Please describe the changes you want"}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !prompt || !originalImage}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isLoading ? 'Processing...' : 'Generate Image'}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorTool;
