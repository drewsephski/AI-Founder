import React from 'react';
import { SignIn as ClerkSignIn } from '@clerk/clerk-react';

const SignIn: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background mt-16">
      <div className="w-full max-w-md">
        <ClerkSignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full shadow-lg",
            },
          }}
          redirectUrl="/dashboard"
          routing="path"
          path="/sign-in"
        />
      </div>
    </div>
  );
};

export default SignIn;