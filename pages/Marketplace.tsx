import React, { useState } from 'react';
import { TOOLS } from '../constants';
import { Tool, ToolType } from '../types';
import ToolModal from '../components/ToolModal';
import ImageEditorTool from './tools/ImageEditorTool';
import ComplexQueryTool from './tools/ComplexQueryTool';
import StandardChatTool from './tools/StandardChatTool';

const Marketplace: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const renderToolComponent = () => {
    if (!selectedTool) return null;
    switch (selectedTool.type) {
      case ToolType.ImageEditor:
        return <ImageEditorTool />;
      case ToolType.ComplexQuery:
        return <ComplexQueryTool />;
      case ToolType.StandardChat:
        return <StandardChatTool />;
      default:
        return <p>Tool not found.</p>;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">AI Marketplace</h1>
        <p className="mt-4 text-lg text-secondary-foreground/80">
          Discover and launch powerful AI tools for any task.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TOOLS.map((tool) => (
          <div
            key={tool.title}
            className="bg-card border border-border rounded-lg p-6 flex flex-col hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => setSelectedTool(tool)}
          >
            <div className="flex-grow">
              <span className="text-sm font-medium text-primary">{tool.category}</span>
              <h3 className="text-xl font-semibold mt-2 text-card-foreground">{tool.title}</h3>
              <p className="mt-2 text-secondary-foreground/70">{tool.description}</p>
            </div>
            <div className="mt-6">
              <button className="w-full text-left font-semibold text-primary hover:underline">
                Launch Tool &rarr;
              </button>
            </div>
          </div>
        ))}
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
