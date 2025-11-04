# AI Application Analysis and Migration Plan

## Current Application Architecture

### Overview
The current AI application is a React-based client-side application that integrates with Google Gemini API for various AI capabilities. It uses localStorage for data persistence and has no authentication system.

### Current Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Custom CSS with Tailwind-like classes
- **AI Integration**: Google Gemini 2.5 Flash models
- **Audio Processing**: Web Audio API for voice features
- **State Management**: React hooks (useState, useEffect)
- **Data Persistence**: localStorage (browser-based)
- **Authentication**: None (no user management)

## Current Code Analysis

### Data Structures

#### SavedSession (localStorage)
```typescript
export type SavedSession = {
  id: string;
  name: string;
  timestamp: string;
  transcript: TranscriptionEntry[];
};

export type TranscriptionEntry = {
  speaker: 'user' | 'model';
  text: string;
};
```

#### ChatMessage (Tool Usage)
```typescript
export type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};
```

### Current localStorage Usage

#### Storage Key: `'aihub_sessions'`
- **Location**: `AIHub.tsx` (lines 176-177), `Dashboard.tsx` (lines 11, 27)
- **Purpose**: Store conversation transcripts
- **Operations**: 
  - Read on Dashboard load
  - Append new sessions after AI conversations
  - Delete sessions
  - Update session list

### Application Flow

1. **Homepage**: Landing page with navigation to tools
2. **AI Hub**: Live voice conversations with AI strategist "Strat"
3. **Dashboard**: View saved conversation sessions from localStorage
4. **Marketplace**: Browse and access AI tools
5. **Tools**: 
   - StandardChatTool: Text-based chat with streaming responses
   - ComplexQueryTool: Deep reasoning analysis
   - ImageEditorTool: AI-powered image editing

### Current Limitations

- **No Authentication**: Users are anonymous
- **Browser Storage**: Data limited to localStorage capacity and browser
- **No Cross-Device Sync**: Sessions not accessible across devices
- **No User Management**: No way to identify or manage users
- **Limited Scalability**: Cannot handle multiple users
- **No Data Analytics**: No insights into user behavior or usage patterns

## Proposed Migration Architecture

### Target Stack
- **Frontend**: React + TypeScript (existing)
- **Backend**: Node.js/Express or Next.js API routes
- **Database**: Neon (PostgreSQL)
- **Authentication**: Clerk
- **ORM**: Prisma or Drizzle
- **Hosting**: Vercel or similar platform

### Database Schema Design

#### Core Tables

##### 1. Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
```

##### 2. Sessions Table
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    session_type VARCHAR(50) NOT NULL DEFAULT 'ai_hub',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    
    CONSTRAINT session_type_check CHECK (session_type IN ('ai_hub', 'standard_chat', 'complex_query', 'image_editor')),
    CONSTRAINT session_status_check CHECK (status IN ('active', 'completed', 'archived'))
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_user_created ON sessions(user_id, created_at);
CREATE INDEX idx_sessions_type ON sessions(session_type);
```

##### 3. Conversation Entries Table
```sql
CREATE TABLE conversation_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    speaker VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    entry_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    
    CONSTRAINT speaker_check CHECK (speaker IN ('user', 'model'))
);

-- Indexes
CREATE INDEX idx_conversation_entries_session_id ON conversation_entries(session_id);
CREATE INDEX idx_conversation_entries_order ON conversation_entries(session_id, entry_order);
```

##### 4. User Preferences Table
```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, preference_key)
);

-- Indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

##### 5. API Usage Log Table
```sql
CREATE TABLE api_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    model_used VARCHAR(100),
    tokens_used INTEGER DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Indexes
CREATE INDEX idx_api_usage_log_user_id ON api_usage_log(user_id);
CREATE INDEX idx_api_usage_log_created ON api_usage_log(user_id, created_at);
CREATE INDEX idx_api_usage_log_endpoint ON api_usage_log(endpoint);
```

### Clerk Authentication Integration

#### 1. Clerk Setup
```typescript
// Clerk configuration in app
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

#### 2. Protected Routes
```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"]
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"]
};
```

#### 3. User Creation Hook
```typescript
// User synchronization with database
import { currentUser } from '@clerk/nextjs';

export async function createOrUpdateUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const user = await db.users.upsert({
    where: { clerk_user_id: clerkUser.id },
    update: {
      email: clerkUser.emailAddresses[0].emailAddress,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      profile_image_url: clerkUser.imageUrl,
      updated_at: new Date()
    },
    create: {
      clerk_user_id: clerkUser.id,
      email: clerkUser.emailAddresses[0].emailAddress,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      profile_image_url: clerkUser.imageUrl
    }
  });

  return user;
}
```

## Backend API Endpoint Specifications

### Authentication Endpoints

#### POST `/api/auth/sync-user`
- **Purpose**: Sync Clerk user with application database
- **Auth**: Clerk authentication required
- **Response**: User data
- **Body**: None (user data from Clerk)

#### GET `/api/auth/profile`
- **Purpose**: Get current user's profile
- **Auth**: Clerk authentication required
- **Response**: User profile data

### Session Management Endpoints

#### GET `/api/sessions`
- **Purpose**: List user's sessions
- **Auth**: Clerk authentication required
- **Query Parameters**: 
  - `limit` (number, default: 50)
  - `offset` (number, default: 0)
  - `session_type` (optional filter)
- **Response**: Array of sessions with metadata

#### POST `/api/sessions`
- **Purpose**: Create new session
- **Auth**: Clerk authentication required
- **Body**:
  ```json
  {
    "name": "Session Name",
    "session_type": "ai_hub",
    "metadata": {}
  }
  ```
- **Response**: Created session data

#### GET `/api/sessions/:id`
- **Purpose**: Get specific session with entries
- **Auth**: Clerk authentication required (ownership check)
- **Response**: Session with conversation entries

#### PUT `/api/sessions/:id`
- **Purpose**: Update session (name, metadata)
- **Auth**: Clerk authentication required (ownership check)
- **Body**: Session fields to update
- **Response**: Updated session data

#### DELETE `/api/sessions/:id`
- **Purpose**: Delete session
- **Auth**: Clerk authentication required (ownership check)
- **Response**: Success confirmation

#### POST `/api/sessions/:id/entries`
- **Purpose**: Add conversation entry to session
- **Auth**: Clerk authentication required (ownership check)
- **Body**:
  ```json
  {
    "speaker": "user",
    "content": "Message content",
    "metadata": {}
  }
  ```
- **Response**: Created entry

### AI Service Integration Endpoints

#### POST `/api/ai/chat`
- **Purpose**: Standard chat interface
- **Auth**: Clerk authentication required
- **Body**:
  ```json
  {
    "messages": [
      {"role": "user", "content": "Message text"}
    ],
    "session_id": "uuid"
  }
  ```
- **Response**: AI response with usage metadata

#### POST `/api/ai/complex-query`
- **Purpose**: Complex query analysis
- **Auth**: Clerk authentication required
- **Body**:
  ```json
  {
    "query": "Complex analysis request",
    "session_id": "uuid"
  }
  ```
- **Response**: Analysis result

#### POST `/api/ai/image-edit`
- **Purpose**: Image editing with AI
- **Auth**: Clerk authentication required
- **Body**:
  ```json
  {
    "prompt": "Edit instruction",
    "image_data": "base64_encoded_image",
    "session_id": "uuid"
  }
  ```
- **Response**: Edited image data

#### POST `/api/ai/live-chat`
- **Purpose**: Live voice conversation
- **Auth**: Clerk authentication required
- **Body**: Audio stream or WebRTC connection data
- **Response**: Streaming AI responses

### Analytics and Usage Endpoints

#### GET `/api/analytics/usage`
- **Purpose**: User's usage statistics
- **Auth**: Clerk authentication required
- **Query Parameters**: 
  - `period` (week, month, year)
- **Response**: Usage statistics

#### GET `/api/analytics/summary`
- **Purpose**: Global analytics (admin only)
- **Auth**: Clerk authentication + admin role
- **Response**: Application-wide analytics

## Frontend Modifications Required

### 1. Authentication Integration

#### Install Required Dependencies
```bash
npm install @clerk/nextjs
npm install @clerk/themes
```

#### Environment Variables
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up
CLERK_AFTER_SIGN_IN_URL=/dashboard
CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### Authentication Components
```typescript
// components/AuthButton.tsx
import { UserButton } from '@clerk/nextjs';

export const AuthButton = () => {
  return (
    <div className="flex items-center space-x-4">
      <UserButton 
        appearance={{
          elements: {
            avatarBox: "w-8 h-8"
          }
        }}
      />
    </div>
  );
};

// pages/sign-in/[[...index]].tsx
import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />
    </div>
  );
}
```

### 2. API Service Layer

#### API Client Setup
```typescript
// lib/api.ts
import { auth } from '@clerk/nextjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const { getToken } = auth();
    const token = await getToken();
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Session methods
  async getSessions(params?: { limit?: number; offset?: number; type?: string }) {
    const searchParams = new URLSearchParams(params as any);
    return this.makeRequest(`/sessions?${searchParams}`);
  }

  async createSession(data: { name: string; session_type: string; metadata?: any }) {
    return this.makeRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSession(id: string) {
    return this.makeRequest(`/sessions/${id}`);
  }

  async addSessionEntry(sessionId: string, entry: { speaker: string; content: string; metadata?: any }) {
    return this.makeRequest(`/sessions/${sessionId}/entries`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async deleteSession(id: string) {
    return this.makeRequest(`/sessions/${id}`, { method: 'DELETE' });
  }

  // AI methods
  async sendChatMessage(data: { messages: any[]; session_id?: string }) {
    return this.makeRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeComplexQuery(data: { query: string; session_id?: string }) {
    return this.makeRequest('/ai/complex-query', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async editImage(data: { prompt: string; image_data: string; session_id?: string }) {
    return this.makeRequest('/ai/image-edit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
```

### 3. State Management Updates

#### Session Context
```typescript
// contexts/SessionContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUser } from '@clerk/nextjs';

interface SessionContextType {
  sessions: any[];
  currentSession: any | null;
  loading: boolean;
  createSession: (name: string, type: string) => Promise<any>;
  loadSessions: () => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  addEntry: (sessionId: string, entry: any) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const loadSessions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (name: string, sessionType: string) => {
    const session = await api.createSession({ name, session_type: sessionType });
    setSessions(prev => [session, ...prev]);
    return session;
  };

  const deleteSession = async (id: string) => {
    await api.deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSession?.id === id) {
      setCurrentSession(null);
    }
  };

  const addEntry = async (sessionId: string, entry: any) => {
    await api.addSessionEntry(sessionId, entry);
    // Optionally refresh session data
  };

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  return (
    <SessionContext.Provider value={{
      sessions,
      currentSession,
      loading,
      createSession,
      loadSessions,
      deleteSession,
      addEntry,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
```

### 4. Component Updates

#### Updated Header with Authentication
```typescript
// components/Header.tsx (updated)
import React, { useState } from 'react';
import { View } from '../types';
import { LogoIcon, MenuIcon, CloseIcon } from './icons/Icons';
import { AuthButton } from './AuthButton';
import { useUser } from '@clerk/nextjs';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoaded } = useUser();

  // Show loading state while Clerk loads
  if (!isLoaded) {
    return <div className="h-16 bg-background border-b border-border" />;
  }

  // Show sign in prompt for unauthenticated users
  if (!user) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <button onClick={() => setView(View.Home)} className="flex items-center space-x-2 text-foreground hover:opacity-80 transition-opacity">
                <LogoIcon className="h-6 w-6" />
                <span className="font-semibold text-lg">AI Platform</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <AuthButton />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Rest of the existing header for authenticated users
  const navItems = [
    { view: View.Marketplace, label: 'Marketplace' },
    { view: View.AIHub, label: 'AI Hub' },
    { view: View.Dashboard, label: 'Dashboard' },
  ];

  const handleNavClick = (view: View) => {
    setView(view);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <button onClick={() => handleNavClick(View.Home)} className="flex items-center space-x-2 text-foreground hover:opacity-80 transition-opacity">
                <LogoIcon className="h-6 w-6" />
                <span className="font-semibold text-lg">AI Platform</span>
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
              <AuthButton />
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
```

#### Updated Dashboard with Database Integration
```typescript
// pages/Dashboard.tsx (updated)
import React, { useState, useEffect } from 'react';
import { SavedSession } from '../types';
import { BotIcon, UserIcon } from '../components/icons/Icons';
import { useSession } from '../contexts/SessionContext';
import { useUser } from '@clerk/nextjs';
import { SignIn } from '@clerk/nextjs';

const Dashboard: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { sessions, currentSession, setCurrentSession, deleteSession, loading } = useSession();
  const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);

  useEffect(() => {
    if (sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0]);
    }
  }, [sessions, selectedSession]);

  useEffect(() => {
    setCurrentSession(selectedSession);
  }, [selectedSession, setCurrentSession]);

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      await deleteSession(sessionId);
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
      }
    }
  };

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-semibold mb-4">Sign In Required</h2>
          <p className="text-secondary-foreground/70 mb-6">Please sign in to view your conversation history.</p>
          <SignIn />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
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
                      {new Date(session.created_at).toLocaleString()}
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
                    <p className="text-sm text-secondary-foreground/70">
                      {new Date(selectedSession.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSession(selectedSession.id)}
                    className="px-3 py-1 bg-red-600/20 text-red-400 rounded-md hover:bg-red-600/40 text-sm font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <div className="overflow-y-auto h-[45vh] pr-2 space-y-4">
                  {selectedSession.entries?.map((entry, index) => (
                    <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                      {entry.speaker === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><BotIcon className="w-5 h-5" /></div>}
                      <div className={`p-3 rounded-lg max-w-lg ${entry.speaker === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                        <p className="whitespace-pre-wrap">{entry.content}</p>
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
```

### 5. App Structure Updates

#### Updated App.tsx with Providers
```typescript
// App.tsx (updated)
import React from 'react';
import { View } from './types';
import Header from './components/Header';
import Homepage from './pages/Homepage';
import Marketplace from './pages/Marketplace';
import AIHub from './pages/AIHub';
import Dashboard from './pages/Dashboard';
import { SessionProvider } from './contexts/SessionContext';
import { useUser } from '@clerk/nextjs';
import { SignIn } from '@clerk/nextjs';

const App: React.FC = () => {
  const [currentView, setCurrentView] = React.useState<View>(View.Home);
  const { user, isLoaded } = useUser();

  const renderView = () => {
    switch (currentView) {
      case View.Home:
        return <Homepage setView={setCurrentView} />;
      case View.Marketplace:
        return <Marketplace />;
      case View.AIHub:
        return <AIHub />;
      case View.Dashboard:
        return <Dashboard />;
      default:
        return <Homepage setView={setCurrentView} />;
    }
  };

  if (!isLoaded) {
    return (
      <div className="bg-background min-h-screen text-foreground font-sans flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SessionProvider>
      <div className="bg-background min-h-screen text-foreground font-sans">
        <Header currentView={currentView} setView={setCurrentView} />
        <div className="pt-16">
          {renderView()}
        </div>
      </div>
    </SessionProvider>
  );
};

export default App;
```

## Security Considerations

### 1. Authentication Security
- **Clerk Integration**: Use Clerk for secure authentication
- **JWT Tokens**: Implement secure JWT token handling
- **Session Management**: Proper session timeout and refresh
- **CSRF Protection**: Implement CSRF tokens for state-changing operations

### 2. Data Security
- **Input Validation**: Validate all user inputs on both client and server
- **SQL Injection Prevention**: Use parameterized queries with ORM
- **Data Encryption**: Encrypt sensitive data at rest
- **Rate Limiting**: Implement API rate limiting per user

### 3. API Security
- **Authorization**: Verify user ownership for all data operations
- **API Key Management**: Secure storage of Google Gemini API keys
- **HTTPS Only**: Enforce HTTPS for all communications
- **CORS Configuration**: Properly configure CORS policies

### 4. User Data Protection
- **Data Minimization**: Only collect necessary user data
- **Data Retention**: Implement data retention policies
- **GDPR Compliance**: Ensure user data deletion capabilities
- **Audit Logging**: Log user actions for security monitoring

## Data Migration Strategy

### Phase 1: localStorage to JSON Export
```typescript
// migration/export-localStorage.js
function exportUserData() {
  const sessions = JSON.parse(localStorage.getItem('aihub_sessions') || '[]');
  return {
    exported_at: new Date().toISOString(),
    sessions: sessions
  };
}

// Download as JSON file
function downloadData() {
  const data = exportUserData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-platform-data-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}
```

### Phase 2: Database Migration Script
```sql
-- migration/migrate-user-data.sql
INSERT INTO users (clerk_user_id, email, first_name, last_name, created_at)
VALUES 
  ('migration_user', 'migrated@example.com', 'Migrated', 'User', NOW())
ON CONFLICT (clerk_user_id) DO NOTHING;

-- Get the migrated user ID
WITH migrated_user AS (
  SELECT id FROM users WHERE clerk_user_id = 'migration_user'
)
INSERT INTO sessions (user_id, name, session_type, status, created_at, updated_at, metadata)
SELECT 
  migrated_user.id,
  s.name,
  'ai_hub',
  'completed',
  s.timestamp::timestamp,
  s.timestamp::timestamp,
  jsonb_build_object('migrated_from', 'localStorage')
FROM migrated_user,
     json_array_elements('[{"name": "Session 1", "timestamp": "2024-01-01T00:00:00Z"}]'::json) AS s
ON CONFLICT DO NOTHING;

-- Migrate conversation entries
WITH migrated_sessions AS (
  SELECT id, session_data 
  FROM (
    SELECT 
      s.id,
      json_array_elements(s.metadata->'transcript') as session_data
    FROM sessions s
    WHERE s.metadata ? 'migrated_from'
  ) session_entries
)
INSERT INTO conversation_entries (session_id, speaker, content, entry_order, created_at, metadata)
SELECT 
  ms.id,
  (ms.session_data->>'speaker')::text,
  ms.session_data->>'text',
  row_number() OVER (PARTITION BY ms.id ORDER BY ms.id),
  NOW(),
  jsonb_build_object('migrated_from', 'localStorage')
FROM migrated_sessions ms
ON CONFLICT DO NOTHING;
```

### Phase 3: Frontend Migration Handling
```typescript
// components/DataMigrationModal.tsx
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export const DataMigrationModal: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [hasLocalData, setHasLocalData] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    // Check for existing localStorage data
    const sessions = localStorage.getItem('aihub_sessions');
    setHasLocalData(!!sessions);
  }, []);

  const handleMigration = async () => {
    if (!user) return;
    
    setIsMigrating(true);
    try {
      // Export localStorage data
      const localSessions = JSON.parse(localStorage.getItem('aihub_sessions') || '[]');
      
      // Create sessions in database
      for (const session of localSessions) {
        const newSession = await api.createSession({
          name: session.name,
          session_type: 'ai_hub',
          metadata: { migrated_from: 'localStorage' }
        });

        // Add conversation entries
        for (const entry of session.transcript) {
          await api.addSessionEntry(newSession.id, {
            speaker: entry.speaker,
            content: entry.text,
            metadata: { migrated_from: 'localStorage' }
          });
        }
      }

      // Clear localStorage
      localStorage.removeItem('aihub_sessions');
      setMigrationComplete(true);
      
      setTimeout(() => {
        onComplete();
      }, 2000);
      
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  if (!hasLocalData || migrationComplete) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md">
        <h3 className="text-lg font-semibold mb-4">Migrate Your Data</h3>
        <p className="text-gray-600 mb-4">
          We found your saved conversations in your browser. Would you like to migrate them to your new account?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => {
              localStorage.removeItem('aihub_sessions');
              onComplete();
            }}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            disabled={isMigrating}
          >
            Skip
          </button>
          <button
            onClick={handleMigration}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={isMigrating}
          >
            {isMigrating ? 'Migrating...' : 'Migrate Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Implementation Timeline

### Phase 1: Backend Infrastructure (Week 1-2)
1. Set up Neon database
2. Create database schema
3. Implement Clerk authentication
4. Build core API endpoints
5. Set up error handling and logging

### Phase 2: API Integration (Week 2-3)
1. Connect Google Gemini API to backend
2. Implement session management APIs
3. Add user preferences and analytics
4. Set up rate limiting and security

### Phase 3: Frontend Updates (Week 3-4)
1. Install and configure Clerk
2. Create API service layer
3. Update state management
4. Implement authentication UI
5. Update existing components

### Phase 4: Migration & Testing (Week 4-5)
1. Build data migration tools
2. Implement automated testing
3. Performance optimization
4. Security audit
5. User acceptance testing

### Phase 5: Deployment & Monitoring (Week 5-6)
1. Deploy to production
2. Set up monitoring and alerts
3. Implement backup strategies
4. Documentation and user guides
5. Post-launch support

## Cost Considerations

### Database (Neon)
- **Free Tier**: 1 database, 512MB storage, 100 million reads/month
- **Pro Tier**: $25/month - 10GB storage, unlimited reads/writes
- **Recommended**: Start with free tier, upgrade as needed

### Authentication (Clerk)
- **Free Tier**: 10,000 monthly active users
- **Developer Tier**: $25/month - 50,000 MAU
- **Recommended**: Free tier sufficient for initial launch

### Hosting (Vercel)
- **Hobby**: Free - perfect for frontend
- **Pro**: $20/month - better for API routes
- **Recommended**: Pro tier for full-stack application

### API Usage (Google Gemini)
- **Free Tier**: 15 requests per minute, 1,500 requests per day
- **Paid**: $0.0025 per 1K characters (input), $0.01 per 1K characters (output)
- **Estimated Cost**: $50-200/month depending on usage

## Success Metrics

### Technical Metrics
- **Uptime**: 99.9% availability
- **Response Time**: < 200ms average API response
- **Database Performance**: < 50ms query response time
- **Authentication Success Rate**: > 99.5%

### User Metrics
- **User Registration**: Target 100 users in first month
- **Session Creation**: Average 5 sessions per user
- **Data Migration Success**: > 95% localStorage data successfully migrated
- **User Retention**: 70% weekly active users

### Business Metrics
- **API Usage**: Track per-user API consumption
- **Feature Adoption**: Monitor usage of different AI tools
- **Support Tickets**: < 5% of users require support
- **Performance**: Maintain fast loading times across all features

## Conclusion

This migration plan transforms the current client-side AI application into a full-stack, authenticated platform with proper data persistence. The architecture leverages modern technologies (Clerk, Neon, PostgreSQL) to provide a scalable, secure foundation for growth.

Key benefits of this migration:
- **User Authentication**: Secure user accounts and session management
- **Data Persistence**: Reliable database storage replacing localStorage
- **Cross-Device Access**: Sessions accessible from any device
- **Scalability**: Architecture supports multiple users and increased usage
- **Analytics**: User behavior insights and usage tracking
- **Security**: Enterprise-grade authentication and data protection

The phased approach ensures minimal disruption to existing users while providing a smooth migration path for their existing data.