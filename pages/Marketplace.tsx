import React, { useState, useEffect } from 'react';
import { TOOLS } from '../constants';
import { Tool, ToolType } from '../types';
import ToolModal from '../components/ToolModal';
import ImageEditorTool from './tools/ImageEditorTool';
import ComplexQueryTool from './tools/ComplexQueryTool';
import StandardChatTool from './tools/StandardChatTool';
import ImageGeneratorTool from './tools/ImageGeneratorTool';
import VideoAnalyzerTool from './tools/VideoAnalyzerTool';
import GoogleSearchTool from './tools/GoogleSearchTool';
import { StarIcon } from '../components/icons/Icons';

const Marketplace: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [favorites, setFavorites] = useState<ToolType[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  // FIX: Add type assertion to empty object to satisfy TypeScript's strict checking for Record types.
  const [usageData, setUsageData] = useState<Record<ToolType, number>>({} as Record<ToolType, number>);

  useEffect(() => {
    try {
      const storedFavorites = JSON.parse(localStorage.getItem('favorite_tools') || '[]') as ToolType[];
      setFavorites(storedFavorites);
      const storedUsage = JSON.parse(localStorage.getItem('tool_usage') || '{}') as Record<ToolType, number>;
      setUsageData(storedUsage);
    } catch (error) {
      console.error('Failed to load data from local storage:', error);
      setFavorites([]);
      // FIX: Add type assertion to empty object to satisfy TypeScript's strict checking.
      setUsageData({} as Record<ToolType, number>);
    }
  }, []);

  const trackToolUsage = (toolType: ToolType) => {
    setUsageData(prevUsageData => {
      const newUsageData = { ...prevUsageData, [toolType]: (prevUsageData[toolType] || 0) + 1 };
      localStorage.setItem('tool_usage', JSON.stringify(newUsageData));
      return newUsageData;
    });
  };

  const handleCardClick = (tool: Tool) => {
    trackToolUsage(tool.type);
    setSelectedTool(tool);
  };

  const toggleFavorite = (toolType: ToolType) => {
    const newFavorites = favorites.includes(toolType)
      ? favorites.filter(t => t !== toolType)
      : [...favorites, toolType];
    setFavorites(newFavorites);
    localStorage.setItem('favorite_tools', JSON.stringify(newFavorites));
  };

  const renderToolComponent = () => {
    if (!selectedTool) return null;
    switch (selectedTool.type) {
      case ToolType.ImageEditor:
        return <ImageEditorTool />;
      case ToolType.ComplexQuery:
        return <ComplexQueryTool />;
      case ToolType.StandardChat:
        return <StandardChatTool />;
      case ToolType.ImageGenerator:
        return <ImageGeneratorTool />;
      case ToolType.VideoAnalyzer:
        return <VideoAnalyzerTool />;
      case ToolType.GoogleSearch:
        return <GoogleSearchTool />;
      default:
        return <p>Tool not found.</p>;
    }
  };

  const displayedTools = showFavoritesOnly
    ? TOOLS.filter(tool => favorites.includes(tool.type))
    : TOOLS;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">AI Marketplace</h1>
        <p className="mt-4 text-lg text-secondary-foreground/80">
          Discover and launch powerful AI tools for any task.
        </p>
      </div>

      <div className="flex justify-end items-center mb-8">
        <label htmlFor="favorites-toggle" className="flex items-center cursor-pointer">
          <span className="mr-3 text-sm font-medium">Show Favorites</span>
          <div className="relative">
            <input type="checkbox" id="favorites-toggle" className="sr-only" checked={showFavoritesOnly} onChange={() => setShowFavoritesOnly(!showFavoritesOnly)} />
            <div className="block bg-secondary w-14 h-8 rounded-full"></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showFavoritesOnly ? 'translate-x-6 bg-primary' : ''}`}></div>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedTools.map((tool) => (
          <div
            key={tool.title}
            className="bg-card border border-border rounded-lg p-6 flex flex-col hover:border-primary/50 transition-all cursor-pointer relative group"
            onClick={() => handleCardClick(tool)}
          >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(tool.type);
                }}
                className="absolute top-4 right-4 p-2 rounded-full text-secondary-foreground/50 hover:text-yellow-400 transition-colors z-10"
                aria-label={favorites.includes(tool.type) ? 'Remove from favorites' : 'Add to favorites'}
            >
                <StarIcon filled={favorites.includes(tool.type)} className={`w-6 h-6 ${favorites.includes(tool.type) ? 'text-yellow-400' : ''}`} />
            </button>
            <div className="flex-grow">
              <span className="text-sm font-medium text-primary">{tool.category}</span>
              <h3 className="text-xl font-semibold mt-2 text-card-foreground">{tool.title}</h3>
              <p className="mt-2 text-secondary-foreground/70">{tool.description}</p>
            </div>
            <div className="mt-6 flex justify-between items-center">
                <span className="text-xs font-semibold text-secondary-foreground/60">
                    Launches: {usageData[tool.type] || 0}
                </span>
                <span className="font-semibold text-primary group-hover:underline text-sm">
                    Launch Tool &rarr;
                </span>
            </div>
          </div>
        ))}
         {displayedTools.length === 0 && showFavoritesOnly && (
            <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-card border border-border rounded-lg">
                <p className="text-secondary-foreground">You haven't favorited any tools yet.</p>
                <p className="text-sm text-secondary-foreground/60 mt-2">Click the star on a tool to add it here.</p>
            </div>
        )}
      </div>

      <ToolModal
        isOpen={!!selectedTool}
        onClose={() => setSelectedTool(null)}
        title={selectedTool?.title || ''}
      >
        {renderToolComponent()}
      </ToolModal>
    </div>
  );
};

export default Marketplace;