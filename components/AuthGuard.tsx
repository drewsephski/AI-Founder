import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { user, isLoaded } = useUser();

  // Show loading state while Clerk loads
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show fallback or sign-in prompt
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h2 className="text-3xl font-bold tracking-tight text-card-foreground mb-4">
            Authentication Required
          </h2>
          <p className="text-lg text-secondary-foreground/80 mb-8 max-w-md">
            You need to be signed in to access this feature. Please sign in to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-md hover:bg-accent transition-colors">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default AuthGuard;