import React from 'react';
import { SignIn as ClerkSignIn } from '@clerk/clerk-react';

const SignInPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background mt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 font-bricolage">Welcome Back</h1>
          <p className="text-secondary-foreground/70 font-bricolage">Sign in to your AI Platform account</p>
        </div>
        <ClerkSignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full shadow-lg border border-border bg-card",
              headerTitle: "text-foreground font-bricolage",
              headerSubtitle: "text-secondary-foreground/70 font-bricolage",
              socialButtonsBlockButton: "border border-border bg-background hover:bg-secondary",
              socialButtonsBlockButtonText: "text-foreground font-bricolage",
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-bricolage",
              formFieldInput: "border-border bg-background text-foreground font-bricolage",
              footerActionLink: "text-primary hover:text-primary/80 font-bricolage"
            },
            variables: {
              colorPrimary: "#2563eb",
              colorBackground: "#ffffff",
              colorInputBackground: "#ffffff",
              colorInputText: "#000000",
            }
          }}
          routing="path"
          path="/sign-in"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
};

export default SignInPage;