import React, { useState, useContext } from 'react';
import { TOOLS } from '../constants';
import { Tool, ToolType, UserPlan, View } from '../types';
import ToolModal from '../components/ToolModal';
import ImageEditorTool from './tools/ImageEditorTool';
import ComplexQueryTool from './tools/ComplexQueryTool';
import StandardChatTool from './tools/StandardChatTool';
import ImageGeneratorTool from './tools/ImageGeneratorTool';
import VideoAnalyzerTool from './tools/VideoAnalyzerTool';
import GoogleSearchTool from './tools/GoogleSearchTool';
import { StarIcon } from '../components/icons/Icons';
import { useUser } from '../UserContext';
import { AppViewContext } from '../App';
import { toggleFavorite } from '../services/supabaseService';

const Marketplace: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const { userPlan, canAccessTool, authenticated, user } = useUser();
  const { setView } = useContext(AppViewContext)!;
  const [userFavorites, setUserFavorites] = useState<ToolType[]>([]); // To store user's favorites

  const handleToolLaunch = (tool: Tool) => {
    if (!authenticated && tool.requiredPlan && tool.requiredPlan !== 'starter') {
      alert("Please log in or register to access this tool."); // Replace with a more elegant solution
      setView(View.Auth);
      return;
    }
    setSelectedTool(tool);
  };

  const handleToggleFavorite = async (toolType: ToolType, isCurrentlyFavorite: boolean) => {
    if (!authenticated || !user?.id) {
      alert("Please sign in to manage your favorites.");
      setView(View.Auth);
      return;
    }
    try {
      await toggleFavorite(user.id, toolType, !isCurrentlyFavorite);
      if (!isCurrentlyFavorite) {
        setUserFavorites(prev => [...prev, toolType]);
      } else {
        setUserFavorites(prev => prev.filter(fav => fav !== toolType));
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      alert("Failed to update favorites. Please try again.");
    }
  };

  const renderToolComponent = () => {
    if (!selectedTool) return null;

    const hasAccess = canAccessTool(selectedTool.requiredPlan);

    if (!hasAccess) {
      return (
        <div className="text-center p-8">
          <h3 className="text-2xl font-semibold text-card-foreground mb-4">Upgrade Required</h3>
          <p className="text-secondary-foreground/80 mb-6">
            This feature requires the {selectedTool.requiredPlan?.charAt(0)?.toUpperCase() + selectedTool.requiredPlan?.slice(1)} Plan.
            Please upgrade your subscription to access this tool.
          </p>
          <button
            onClick={() => {
              setView(View.Pricing);
              setSelectedTool(null);
            }}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
          >
            Go to Pricing
          </button>
        </div>
      );
    }

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

  const displayedTools = TOOLS;

  const getPlanLabel = (plan: UserPlan | undefined) => {
    if (!plan || plan === 'starter') return 'Free';
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const getPlanClass = (plan: UserPlan | undefined) => {
    if (!plan || plan === 'starter') return 'text-success';
    if (plan === 'pro') return 'text-blue-400';
    if (plan === 'advanced') return 'text-purple-400';
    return 'text-secondary-foreground/60';
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">AI Marketplace</h1>
        <p className="mt-4 text-lg text-secondary-foreground/80">
          Discover and launch powerful AI tools for any task.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedTools.map((tool) => {
          const accessGranted = canAccessTool(tool.requiredPlan);
          const planRequiredLabel = getPlanLabel(tool.requiredPlan);
          const planRequiredClass = getPlanClass(tool.requiredPlan);
          const isFavorite = userFavorites.includes(tool.type);

          return (
            <div
              key={tool.title}
              className={`bg-card border rounded-lg p-6 flex flex-col transition-all relative group ${
                accessGranted
                  ? 'hover:border-primary/50 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed border-dashed border-secondary-foreground/30'
              }`}
              onClick={() => handleToolLaunch(tool)}
            >
              <button
                  onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(tool.type, isFavorite);
                  }}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${isFavorite ? 'text-yellow-400' : 'text-secondary-foreground/50 hover:text-yellow-400'}`}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                  <StarIcon filled={isFavorite} className="w-6 h-6" />
              </button>
              <div className="flex-grow">
                <span className={`text-sm font-medium ${tool.requiredPlan ? planRequiredClass : 'text-primary'}`}>{tool.category}</span>
                <h3 className="text-xl font-semibold mt-2 text-card-foreground">{tool.title}</h3>
                <p className="mt-2 text-secondary-foreground/70">{tool.description}</p>
              </div>
              <div className="mt-6 flex justify-between items-center">
                  <span className="text-xs font-semibold text-secondary-foreground/60">
                      {tool.requiredPlan ? (accessGranted ? 'Access Granted' : `Requires ${planRequiredLabel} Plan`) : 'Free Access'}
                  </span>
                  <span className="font-semibold text-sm text-primary group-hover:underline">
                      {accessGranted ? 'Launch Tool →' : 'View Plan →'}
                  </span>
              </div>
            </div>
          );
        })}
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