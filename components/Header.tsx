import React, { useState } from 'react';
import { View } from '../types';
import { LogoIcon, MenuIcon, CloseIcon, UserIcon } from './icons/Icons';
import { useUser } from '../UserContext';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { authenticated, logout, user, loadingAuth } = useUser();

  const navItems = [
    { view: View.Marketplace, label: 'Marketplace' },
    { view: View.AIHub, label: 'AI Hub' },
    { view: View.Dashboard, label: 'Dashboard' },
    { view: View.Pricing, label: 'Pricing' },
  ];

  const handleNavClick = (view: View) => {
    setView(view);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setView(View.Auth); // Redirect to auth page after logout
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    }
    setIsMenuOpen(false);
  };

  const handleLoginRegister = () => {
    setView(View.Auth);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <button onClick={() => handleNavClick(View.Home)} className="flex items-center space-x-2 text-foreground hover:opacity-80 transition-opacity">
                <LogoIcon className="h-6 w-6" />
                <span className="font-semibold text-lg">Strat AI</span>
              </button>
              <nav className="hidden md:flex space-x-6">
                {navItems.map((item) => (
                  <button
                    key={item.view}
                    onClick={() => handleNavClick(item.view)}
                    className={`text-sm font-medium transition-colors ${
                      currentView === item.view
                        ? 'text-primary'
                        : 'text-secondary-foreground/70 hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {!loadingAuth && (
                authenticated ? (
                  <div className="relative group">
                    <button className="flex items-center gap-2 p-2 text-foreground rounded-md hover:bg-secondary transition-colors">
                      <UserIcon className="h-5 w-5" />
                      <span className="hidden lg:inline text-sm font-medium">{user?.email || 'Profile'}</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out z-50">
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-secondary-foreground hover:bg-secondary">
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={handleLoginRegister}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors text-sm"
                  >
                    Login / Register
                  </button>
                )
              )}
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-foreground">
                  {isMenuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-background border-b border-border shadow-lg animate-fade-in-down">
           <nav className="flex flex-col space-y-1 p-4">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`w-full text-left px-4 py-3 rounded-md text-lg font-medium transition-colors ${
                    currentView === item.view
                      ? 'bg-primary text-primary-foreground'
                      : 'text-secondary-foreground/80 hover:bg-secondary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {!loadingAuth && (
                authenticated ? (
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 rounded-md text-lg font-medium transition-colors text-secondary-foreground/80 hover:bg-secondary"
                  >
                    Logout
                  </button>
                ) : (
                  <button 
                    onClick={handleLoginRegister}
                    className="w-full text-left px-4 py-3 rounded-md text-lg font-medium transition-colors text-secondary-foreground/80 hover:bg-secondary"
                  >
                    Login / Register
                  </button>
                )
              )}
            </nav>
        </div>
      )}
    </>
  );
};

export default Header;