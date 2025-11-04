import React, { useState } from 'react';
import { View } from '../types';
import { LogoIcon, MenuIcon, CloseIcon } from './icons/Icons';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { view: View.Marketplace, label: 'Apps' },
    { view: View.AIHub, label: 'Call' },
    { view: View.Dashboard, label: 'Dashboard' },
  ];

  const handleNavClick = (view: View) => {
    setView(view);
    setIsMenuOpen(false); // Close menu on navigation
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <button onClick={() => handleNavClick(View.Home)} className="flex items-center space-x-2 text-foreground hover:opacity-80 transition-opacity">
                <LogoIcon className="h-6 w-6" />
                <span className="font-semibold text-lg font-bricolage">Strat AI</span>
              </button>
              <nav className="hidden md:flex space-x-6">
                {navItems.map((item) => (
                  <button
                    key={item.view}
                    onClick={() => handleNavClick(item.view)}
                    className={`text-sm font-medium transition-colors font-bricolage ${
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
              {/* Authentication Controls */}
              <SignedOut>
                <div className="hidden sm:flex items-center space-x-2">
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-sm font-medium text-secondary-foreground hover:text-primary transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                      userButtonOuterIdentifier: "text-sm font-medium",
                      userButtonDropdown: "bg-background border border-border"
                    },
                    variables: {
                      colorPrimary: "#2563eb"
                    }
                  }}
                  afterSignOutUrl="/"
                />
              </SignedIn>
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
              {/* Mobile Authentication Controls */}
              <div className="pt-4 mt-4 border-t border-border">
                <SignedOut>
                  <div className="flex flex-col space-y-2">
                    <SignInButton mode="modal">
                      <button
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full px-4 py-3 text-left text-lg font-medium text-secondary-foreground/80 hover:bg-secondary hover:text-primary rounded-md transition-colors"
                      >
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full px-4 py-3 text-left text-lg font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Sign Up
                      </button>
                    </SignUpButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                        userButtonOuterIdentifier: "text-lg font-medium",
                        userButtonDropdown: "bg-background border border-border"
                      },
                      variables: {
                        colorPrimary: "#2563eb"
                      }
                    }}
                    afterSignOutUrl="/"
                  />
                </SignedIn>
              </div>
            </nav>
        </div>
      )}
    </>
  );
};

export default Header;