import React from 'react';
import { View } from '../types';

interface HomepageProps {
  setView: (view: View) => void;
}

const Homepage: React.FC<HomepageProps> = ({ setView }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-screen text-center">
      <main className="max-w-3xl">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">
          The Future of AI is Here
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-secondary-foreground/80">
          An elegant, unified platform to explore, build, and interact with cutting-edge AI.
          From conversational business partners to powerful generative tools, your next big idea starts here.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setView(View.Marketplace)}
            className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-transform transform hover:scale-[1.01]"
          >
            Explore Tools
          </button>
          <button
            onClick={() => setView(View.AIHub)}
            className="w-full sm:w-auto px-8 py-3 bg-secondary text-secondary-foreground font-semibold rounded-md hover:bg-accent transition-transform transform hover:scale-[1.01]"
          >
            Start Chatting
          </button>
        </div>
      </main>
    </div>
  );
};

export default Homepage;
