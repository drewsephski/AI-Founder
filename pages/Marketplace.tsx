import React from 'react';
import { TOOLS } from '../constants';
import { Tool, ToolType, View } from '../types';
import { SignInButton, useUser } from '@clerk/clerk-react';

interface MarketplaceProps {
  currentUser: any;
  setView: (view: any) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ currentUser, setView }) => {
  const { isSignedIn } = useUser();

  const handleToolClick = (tool: Tool) => {
    if (isSignedIn) {
      // Navigate to the appropriate tool page based on tool type
      const getViewForTool = (toolType: ToolType): View => {
        switch (toolType) {
          case ToolType.ImageEditor:
            return View.ToolImageEditor;
          case ToolType.ComplexQuery:
            return View.ToolComplexQuery;
          case ToolType.StandardChat:
            return View.ToolChat;
          default:
            return View.AIHub;
        }
      };
      
      const toolView = getViewForTool(tool.type);
      console.log(`Opening tool: ${tool.title} at view: ${toolView}`);
      setView(toolView);
    } else {
      // If not signed in, the SignInButton will handle the authentication
      console.log(`Tool clicked, authentication required for: ${tool.title}`);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight font-bricolage">AI Apps</h1>
        <p className="mt-4 text-lg text-secondary-foreground/80 font-bricolage">
          Discover and launch powerful AI tools for any task.
        </p>
        {currentUser && (
          <p className="mt-2 text-sm text-secondary-foreground/60 font-bricolage">
            Signed in as: {currentUser.primaryEmailAddress?.emailAddress || currentUser.emailAddresses?.[0]?.emailAddress || 'User'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TOOLS.map((tool) => (
          <div
            key={tool.title}
            className="bg-card border border-border rounded-lg p-6 flex flex-col hover:border-primary/50 transition-all"
          >
            <div className="flex-grow">
              <span className="text-sm font-medium text-primary font-bricolage">{tool.category}</span>
              <h3 className="text-xl font-semibold mt-2 text-card-foreground font-bricolage">{tool.title}</h3>
              <p className="mt-2 text-secondary-foreground/70 font-bricolage">{tool.description}</p>
            </div>
            <div className="mt-6">
              {isSignedIn ? (
                <button
                  onClick={() => handleToolClick(tool)}
                  className="w-full text-left font-semibold text-primary hover:underline font-bricolage"
                >
                  Use Tool &rarr;
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button className="w-full text-left font-semibold text-primary hover:underline cursor-pointer font-bricolage">
                    Sign In to Use &rarr;
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isSignedIn && (
        <div className="mt-12 text-center">
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="text-xl font-semibold text-card-foreground mb-2 font-bricolage">Ready to get started?</h3>
            <p className="text-secondary-foreground/80 mb-6 font-bricolage">
              Sign in to access all AI tools and save your work across sessions.
            </p>
            <SignInButton mode="modal">
              <button className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors font-bricolage">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
