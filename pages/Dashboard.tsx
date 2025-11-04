import React, { useState, useEffect } from 'react';
import { SavedSession } from '../types';
import { BotIcon, UserIcon } from '../components/icons/Icons';

const Dashboard: React.FC = () => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);

  useEffect(() => {
    try {
      const storedSessions = JSON.parse(localStorage.getItem('aihub_sessions') || '[]') as SavedSession[];
      // Sort sessions by date, newest first
      storedSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSessions(storedSessions);
      if (storedSessions.length > 0) {
        setSelectedSession(storedSessions[0]);
      }
    } catch (error) {
      console.error("Failed to load sessions from local storage:", error);
    }
  }, []);

  const deleteSession = (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);
        localStorage.setItem('aihub_sessions', JSON.stringify(updatedSessions));
        if (selectedSession?.id === sessionId) {
            setSelectedSession(updatedSessions.length > 0 ? updatedSessions[0] : null);
        }
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Conversation History</h1>
        <p className="mt-4 text-lg text-secondary-foreground/80">
          Review your past conversations with the AI Cofounder.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-card-foreground">No Saved Sessions</h2>
            <p className="mt-4 text-secondary-foreground/70">
                Your saved conversations from the AI Hub will appear here.
            </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8 min-h-[60vh]">
          {/* Session List */}
          <div className="md:w-1/3 lg:w-1/4 bg-card border border-border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Sessions</h2>
            <ul className="space-y-2 overflow-y-auto max-h-[55vh]">
              {sessions.map((session) => (
                <li key={session.id}>
                  <button
                    onClick={() => setSelectedSession(session)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${selectedSession?.id === session.id ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent'}`}
                  >
                    <p className="font-semibold truncate">{session.name}</p>
                    <p className={`text-xs ${selectedSession?.id === session.id ? 'text-primary-foreground/80' : 'text-secondary-foreground/60'}`}>
                      {new Date(session.timestamp).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Transcript Viewer */}
          <div className="flex-grow bg-card border border-border rounded-lg p-6">
            {selectedSession ? (
              <>
                 <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
                    <div>
                        <h2 className="text-2xl font-semibold text-card-foreground">{selectedSession.name}</h2>
                        <p className="text-sm text-secondary-foreground/70">{new Date(selectedSession.timestamp).toLocaleString()}</p>
                    </div>
                    <button
                        onClick={() => deleteSession(selectedSession.id)}
                        className="px-3 py-1 bg-red-600/20 text-red-400 rounded-md hover:bg-red-600/40 text-sm font-semibold transition-colors"
                    >
                        Delete
                    </button>
                 </div>
                <div className="overflow-y-auto h-[45vh] pr-2 space-y-4">
                  {selectedSession.transcript.map((entry, index) => (
                    <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                      {entry.speaker === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><BotIcon className="w-5 h-5" /></div>}
                      <div className={`p-3 rounded-lg max-w-lg ${entry.speaker === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                         <p className="whitespace-pre-wrap">{entry.text}</p>
                      </div>
                      {entry.speaker === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center"><UserIcon className="w-5 h-5" /></div>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-secondary-foreground/70">Select a session to view its transcript.</p>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;