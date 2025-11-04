import React, { useState } from 'react';
import { View } from './types';
import { useUser } from '@clerk/clerk-react';
import Header from './components/Header';
import Homepage from './pages/Homepage';
import Marketplace from './pages/Marketplace';
import AIHub from './pages/AIHub';
import Dashboard from './pages/Dashboard';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import ComplexQueryTool from './pages/tools/ComplexQueryTool';
import ImageEditorTool from './pages/tools/ImageEditorTool';
import StandardChatTool from './pages/tools/StandardChatTool';
import { initializeDatabase } from './lib/database';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Home);
  const { user, isLoaded } = useUser();

  // Initialize database schema on app start
  React.useEffect(() => {
    const initDb = async () => {
      try {
        await initializeDatabase();
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    initDb();
  }, []);

  // Auto-redirect authenticated users from auth pages to dashboard
  React.useEffect(() => {
    if (user && (currentView === View.SignIn || currentView === View.SignUp)) {
      setCurrentView(View.Dashboard);
    }
  }, [user, currentView]);

  // Show loading state while Clerk loads
  if (!isLoaded) {
    return (
      <div className="bg-background min-h-screen text-foreground font-sans flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case View.Home:
        return <Homepage setView={setCurrentView} />;
      case View.Marketplace:
        return <Marketplace currentUser={user} setView={setCurrentView} />;
      case View.AIHub:
        return <AIHub currentUser={user} />;
      case View.Dashboard:
        return <Dashboard currentUser={user} />;
      case View.SignIn:
        return <SignInPage />;
      case View.SignUp:
        return <SignUpPage />;
      case View.ToolChat:
        return <StandardChatTool />;
      case View.ToolComplexQuery:
        return <ComplexQueryTool />;
      case View.ToolImageEditor:
        return <ImageEditorTool />;
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
