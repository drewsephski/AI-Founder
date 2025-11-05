import React, { useState } from 'react';
import { View } from './types';
import Header from './components/Header';
import Homepage from './pages/Homepage';
import Marketplace from './pages/Marketplace';
import AIHub from './pages/AIHub';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Home);

  const renderView = () => {
    switch (currentView) {
      case View.Home:
        return <Homepage setView={setCurrentView} />;
      case View.Marketplace:
        return <Marketplace />;
      case View.AIHub:
        return <AIHub />;
      case View.Dashboard:
        return <Dashboard />;
      default:
        return <Homepage setView={setCurrentView} />;
    }
  };

  return (
    <div className="bg-background min-h-screen text-foreground font-sans">
      <Header currentView={currentView} setView={setCurrentView} />
      <div className="pt-16">
        {renderView()}
      </div>
    </div>
  );
};

export default App;
