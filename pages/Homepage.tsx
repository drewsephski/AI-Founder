import React from 'react';
import { View } from '../types';

interface HomepageProps {
  setView: (view: View) => void;
}

const Homepage: React.FC<HomepageProps> = ({ setView }) => {
  return (
    <div className="h-screen w-full flex items-center justify-center overflow-hidden">
      <main className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl sm:text-7xl lg:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500 font-bricolage">
          The Future of AI is Here
        </h1>
        <p className="mt-8 text-xl sm:text-2xl lg:text-2xl text-secondary-foreground/80 font-bricolage max-w-3xl mx-auto leading-relaxed">
          An elegant, unified platform to explore, build, and interact with cutting-edge AI.
          From conversational business partners to powerful generative tools, your next big idea starts here.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
          <button
            onClick={() => setView(View.Marketplace)}
            className="w-full sm:w-auto px-10 py-4 text-lg bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-transform transform hover:scale-[1.01] shadow-lg"
          >
            Explore Tools
          </button>
          <button
            onClick={() => setView(View.AIHub)}
            className="w-full sm:w-auto px-10 py-4 text-lg bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-accent transition-transform transform hover:scale-[1.01] shadow-lg"
          >
            Start Chatting
          </button>
        </div>
      </main>
    </div>
  );
};

export default Homepage;
