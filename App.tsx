import React, { useState, createContext, useEffect, ReactNode } from 'react';
import { View } from './types';
import Header from './components/Header';
import Homepage from './pages/Homepage';
import Marketplace from './pages/Marketplace';
import AIHub from './pages/AIHub';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Pricing from './pages/Pricing';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage'; // New import for AuthPage
import { UserProvider, useUser } from './UserContext'; // Import useUser

interface AppViewContextType {
  setView: (view: View) => void;
}
export const AppViewContext = createContext<AppViewContextType | undefined>(undefined);

// Wrapper component to use the context
const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Home);
  const { authenticated, loadingAuth } = useUser();

  // Effect to handle initial view based on URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam && Object.values(View).includes(viewParam as View)) {
      setCurrentView(viewParam as View);
    } else {
      // Default to home or auth based on authentication status
      if (!authenticated && !loadingAuth) {
        setCurrentView(View.Auth);
      }
    }
  }, [authenticated, loadingAuth]);

  // Handle URL changes to update view for internal navigation (e.g., from Paddle redirects)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      if (viewParam && Object.values(View).includes(viewParam as View)) {
        setCurrentView(viewParam as View);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderView = () => {
    if (loadingAuth) {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] text-secondary-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="ml-4">Loading authentication...</p>
        </div>
      );
    }

    // Define protected routes
    const protectedViews = [View.AIHub, View.Dashboard, View.Admin, View.Pricing, View.Checkout];

    if (!authenticated && protectedViews.includes(currentView)) {
      // If not authenticated and trying to access a protected view, redirect to Auth
      setCurrentView(View.Auth);
      return <AuthPage />;
    }

    switch (currentView) {
      case View.Home:
        return <Homepage setView={setCurrentView} />;
      case View.Marketplace:
        return <Marketplace />;
      case View.AIHub:
        return <AIHub />;
      case View.Dashboard:
        return <Dashboard />;
      case View.Admin:
         return <Admin />;
      case View.Pricing:
        return <Pricing />;
      case View.Checkout:
        return <CheckoutPage />;
      case View.Auth: // New case for Auth page
        return <AuthPage />;
      default:
        return <Homepage setView={setCurrentView} />;
    }
  };

  return (
    <AppViewContext.Provider value={{ setView: setCurrentView }}>
      <div className="bg-background min-h-screen text-foreground font-sans">
        <Header currentView={currentView} setView={setCurrentView} />
        <div className="pt-16">
          {renderView()}
        </div>
      </div>
    </AppViewContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
};

export default App;