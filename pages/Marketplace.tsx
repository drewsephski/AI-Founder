import React, { useState, useEffect, useMemo } from 'react';
// FIX: Import `useClerk` to get access to the `openSignIn` function.
import { useAuth, useSession, useClerk } from '@clerk/clerk-react';
import { createClerkSupabaseClient, getFavorites, getUsageData, toggleFavorite, incrementToolUsage } from '../services/supabaseService';
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

const DAILY_USAGE_LIMIT = 5;

const Marketplace: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [favorites, setFavorites] = useState<ToolType[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [usageData, setUsageData] = useState<Record<ToolType, number>>({} as Record<ToolType, number>);

  // FIX: `openSignIn` is not available on `useAuth`. It should be retrieved from `useClerk`.
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { session } = useSession();
  const supabase = useMemo(() => createClerkSupabaseClient(session), [session]);

  useEffect(() => {
    const loadData = async () => {
      if (supabase && isSignedIn) {
        try {
          const [favs, usage] = await Promise.all([
            getFavorites(supabase),
            getUsageData(supabase)
          ]);
          setFavorites(favs);
          setUsageData(usage);
        } catch (error) {
          console.error('Failed to load user data from Supabase:', error);
        }
      } else {
        // Clear data when user signs out
        setFavorites([]);
        setUsageData({} as Record<ToolType, number>);
      }
    };
    loadData();
  }, [supabase, isSignedIn]);

  const handleToolLaunch = async (tool: Tool) => {
    if (isSignedIn && supabase) {
      const currentUsage = usageData[tool.type] || 0;
      if (currentUsage >= DAILY_USAGE_LIMIT) {
        return; // Do nothing if limit is reached
      }
      const { error } = await incrementToolUsage(supabase, tool.type);
      if (!error) {
        setUsageData(prev => ({ ...prev, [tool.type]: (prev[tool.type] || 0) + 1 }));
      }
    }
    setSelectedTool(tool);
  };

  const handleToggleFavorite = async (toolType: ToolType) => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    if (!supabase) return;

    const isCurrentlyFavorite = favorites.includes(toolType);
    await toggleFavorite(supabase, toolType, isCurrentlyFavorite);
    setFavorites(prev => isCurrentlyFavorite ? prev.filter(t => t !== toolType) : [...prev, toolType]);
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

      {isSignedIn && (
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedTools.map((tool) => {
          const currentUsage = usageData[tool.type] || 0;
          const limitReached = isSignedIn && currentUsage >= DAILY_USAGE_LIMIT;

          return (
            <div
              key={tool.title}
              className={`bg-card border border-border rounded-lg p-6 flex flex-col transition-all relative group ${
                limitReached 
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:border-primary/50 cursor-pointer'
              }`}
              onClick={() => !limitReached && handleToolLaunch(tool)}
            >
              <button
                  onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(tool.type);
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
                      {isSignedIn ? `Daily Launches: ${currentUsage} / ${DAILY_USAGE_LIMIT}` : 'Usage tracked on sign-in'}
                  </span>
                  <span className={`font-semibold text-sm ${
                      limitReached 
                      ? 'text-red-400' 
                      : 'text-primary group-hover:underline'
                  }`}>
                      {limitReached ? 'Limit Reached' : 'Launch Tool →'}
                  </span>
              </div>
            </div>
          )
        })}
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