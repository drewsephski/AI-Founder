import React, { useState, useEffect } from 'react';
import { useUser } from '../UserContext';
import { View } from '../types';
import { useContext } from 'react';
import { AppViewContext } from '../App';

interface SaveSessionModalProps {
  isOpen: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

const SaveSessionModal: React.FC<SaveSessionModalProps> = ({ isOpen, onSave, onClose }) => {
  const [sessionName, setSessionName] = useState('');
  const { authenticated } = useUser();
  const { setView } = useContext(AppViewContext)!;

  useEffect(() => {
    if (isOpen) {
      setSessionName(`Session ${new Date().toLocaleString()}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!authenticated) {
      alert("Please log in to save your conversation sessions.");
      onClose(); // Close modal
      setView(View.Auth); // Redirect to auth page
      return;
    }
    if (sessionName.trim()) {
      onSave(sessionName.trim());
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleSave();
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">Save Session</h2>
        <p className="text-secondary-foreground/80 mb-6">Enter a name for this conversation to save it for later review.</p>
        
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-3 bg-secondary border border-border rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition mb-6"
          placeholder="e.g., Initial Brainstorm"
          autoFocus
        />

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md font-semibold hover:bg-accent transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={!sessionName.trim() || !authenticated}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 disabled:bg-secondary disabled:text-secondary-foreground/50 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSessionModal;