import React, { useState, useEffect, useMemo } from 'react';
import { SignedIn, SignedOut, useAuth, useSession } from '@clerk/clerk-react';
import { View } from './types';
import Header from './components/Header';
import Homepage from './pages/Homepage';
import Marketplace from './pages/Marketplace';
import AIHub from './pages/AIHub';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import { createClerkSupabaseClient, getUserRole } from './services/supabaseService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Home);
  const [userRole, setUserRole] = useState<string | null>(null);

  const { isSignedIn } = useAuth();
  const { session } = useSession();
  const supabase = useMemo(() => createClerkSupabaseClient(session), [session]);

  useEffect(() => {
    const fetchRole = async () => {
      if (isSignedIn && supabase) {
        const role = await getUserRole(supabase);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
    };
    fetchRole();
  }, [isSignedIn, supabase]);


  const renderView = () => {
    switch (currentView) {
      case View.Home:
        return <Homepage setView={setCurrentView} />;
      case View.Marketplace:
        return <Marketplace />;
      case View.AIHub:
      case View.Dashboard:
        return (
          <>
            <SignedIn>
              {currentView === View.AIHub && <AIHub />}
              {currentView === View.Dashboard && <Dashboard />}
            </SignedIn>
            <SignedOut>
              <div className="container mx-auto px-4 py-24 text-center">
                <h2 className="text-2xl font-bold">Authentication Required</h2>
                <p className="mt-4 text-lg text-secondary-foreground/80">
                  Please sign in to access the {currentView === View.AIHub ? 'AI Hub' : 'Dashboard'}.
                </p>
              </div>
            </SignedOut>
          </>
        );
      case View.Admin:
        return (
           <SignedIn>
              {userRole === 'admin' ? (
                <Admin />
              ) : (
                 <div className="container mx-auto px-4 py-24 text-center">
                    <h2 className="text-2xl font-bold">Access Denied</h2>
                    <p className="mt-4 text-lg text-secondary-foreground/80">
                      You do not have permission to view this page.
                    </p>
                  </div>
              )}
           </SignedIn>
        )
      default:
        return <Homepage setView={setCurrentView} />;
    }
  };

  return (
    <div className="bg-background min-h-screen text-foreground font-sans">
      <Header currentView={currentView} setView={setCurrentView} userRole={userRole} />
      <div className="pt-16">
        {renderView()}
      </div>
    </div>
  );
};

export default App;