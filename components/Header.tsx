import React, { useState } from 'react';
import { View } from '../types';
import { LogoIcon, MenuIcon, CloseIcon } from './icons/Icons';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/clerk-react';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  userRole: string | null;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, userRole }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { view: View.Marketplace, label: 'Marketplace' },
    { view: View.AIHub, label: 'AI Hub' },
    { view: View.Dashboard, label: 'Dashboard' },
  ];
  
  if (userRole === 'admin') {
      navItems.push({ view: View.Admin, label: 'Admin' });
  }

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
               <SignedIn>
                 <UserButton afterSignOutUrl="/" />
               </SignedIn>
               <SignedOut>
                 <SignInButton mode="modal">
                   <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors">
                      Sign In
                   </button>
                 </SignInButton>
               </SignedOut>
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
            </nav>
        </div>
      )}
    </>
  );
};

export default Header;