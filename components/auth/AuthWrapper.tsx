import React from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';

const AuthWrapper: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={className}>
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
        {children}
      </SignedIn>
      <SignedOut>
        <div className="flex items-center space-x-4">
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-foreground hover:opacity-80 transition-opacity">
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
    </div>
  );
};

export default AuthWrapper;