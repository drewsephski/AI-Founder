import React from 'react';
import { UserButton } from '@clerk/clerk-react';

const AuthButton: React.FC = () => {
  return (
    <div className="flex items-center space-x-4">
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
    </div>
  );
};

export default AuthButton;