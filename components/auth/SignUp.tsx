import React from 'react';
import { SignUp as ClerkSignUp } from '@clerk/clerk-react';

const SignUp: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background mt-16">
      <div className="w-full max-w-md">
        <ClerkSignUp 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full shadow-lg",
            },
          }}
          redirectUrl="/dashboard"
          routing="path"
          path="/sign-up"
        />
      </div>
    </div>
  );
};

export default SignUp;