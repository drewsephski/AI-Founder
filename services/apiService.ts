import { requireDatabase, isDatabaseAvailable, User } from '../lib/database';
import { syncUserToDatabase } from '../lib/userManager';
import { SavedSession, TranscriptionEntry } from '../types';

// API Response types for better type safety
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SessionApiResponse extends ApiResponse<SavedSession> {}
export interface SessionsListApiResponse extends ApiResponse<SavedSession[]> {}
export interface UserApiResponse extends ApiResponse<{ id: number }> {}

// Enhanced session service with type safety
export class SessionService {
  private static instance: SessionService;
  private currentUser: any = null;

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
  }

  // Check if user is authenticated
  private requireAuth(): void {
    if (!this.currentUser?.id) {
      throw new Error('User must be authenticated to perform this action');
    }
  }

  // Enhanced session loading with comprehensive error handling
  async loadUserSessions(): Promise<SessionsListApiResponse> {
    if (!isDatabaseAvailable()) {
      console.warn('Database not available, falling back to localStorage');
      return this.loadLocalStorageSessions();
    }

    try {
      this.requireAuth();
      
      // Sync user first to ensure they exist in database
      await syncUserToDatabase(this.currentUser!);
      
      const db = requireDatabase();
      const [userRecord] = await db`
        SELECT id FROM users WHERE clerk_id = ${this.currentUser!.id}
      `;

      if (!userRecord) {
        console.warn('User not found in database after sync');
        return this.loadLocalStorageSessions();
      }

      const sessions = await db`
        SELECT * FROM saved_sessions 
        WHERE user_id = ${userRecord.id} 
        ORDER BY timestamp DESC
      `;

      const formattedSessions: SavedSession[] = sessions.map((session: any) => ({
        id: session.id.toString(),
        name: session.name,
        timestamp: session.timestamp,
        transcript: JSON.parse(session.transcript)
      }));

      // Store sessions in localStorage as backup
      this.saveToLocalStorage(formattedSessions);

      return {
        success: true,
        data: formattedSessions,
        message: `Loaded ${formattedSessions.length} sessions from database`
      };

    } catch (error) {
      console.error('Failed to load sessions from database:', error);
      
      // Fallback to localStorage
      return this.loadLocalStorageSessions();
    }
  }

  // Enhanced session saving with comprehensive error handling
  async saveSession(sessionName: string, transcript: TranscriptionEntry[]): Promise<SessionApiResponse> {
    if (!this.currentUser?.id) {
      return {
        success: false,
        error: 'User must be authenticated to save sessions'
      };
    }

    // Try database first
    if (isDatabaseAvailable()) {
      try {
        this.requireAuth();
        
        // Sync user first
        await syncUserToDatabase(this.currentUser);
        
        const db = requireDatabase();
        const [userRecord] = await db`
          SELECT id FROM users WHERE clerk_id = ${this.currentUser.id}
        `;

        if (!userRecord) {
          throw new Error('User not found in database');
        }

        const [result] = await db`
          INSERT INTO saved_sessions (user_id, name, timestamp, transcript)
          VALUES (${userRecord.id}, ${sessionName}, ${new Date().toISOString()}, ${JSON.stringify(transcript)})
          RETURNING id
        `;

        const newSession: SavedSession = {
          id: result.id.toString(),
          name: sessionName,
          timestamp: new Date().toISOString(),
          transcript
        };

        // Update localStorage as backup
        this.addToLocalStorage(newSession);

        return {
          success: true,
          data: newSession,
          message: 'Session saved successfully to database'
        };

      } catch (error) {
        console.error('Database save failed:', error);
        // Fall through to localStorage
      }
    }

    // Fallback to localStorage
    const newSession: SavedSession = {
      id: crypto.randomUUID(),
      name: sessionName,
      timestamp: new Date().toISOString(),
      transcript
    };

    this.addToLocalStorage(newSession);

    return {
      success: true,
      data: newSession,
      message: 'Session saved to local storage (database unavailable)'
    };
  }

  // Enhanced session deletion
  async deleteSession(sessionId: string): Promise<ApiResponse<boolean>> {
    if (!this.currentUser?.id) {
      return {
        success: false,
        error: 'User must be authenticated to delete sessions'
      };
    }

    // Try database first
    if (isDatabaseAvailable()) {
      try {
        this.requireAuth();
        
        const db = requireDatabase();
        const [userRecord] = await db`
          SELECT id FROM users WHERE clerk_id = ${this.currentUser.id}
        `;

        if (!userRecord) {
          throw new Error('User not found in database');
        }

        await db`
          DELETE FROM saved_sessions 
          WHERE id = ${parseInt(sessionId)} AND user_id = ${userRecord.id}
        `;

        // Update localStorage
        this.removeFromLocalStorage(sessionId);

        return {
          success: true,
          data: true,
          message: 'Session deleted successfully'
        };

      } catch (error) {
        console.error('Database deletion failed:', error);
        // Continue with localStorage deletion
      }
    }

    // Fallback to localStorage
    this.removeFromLocalStorage(sessionId);

    return {
      success: true,
      data: true,
      message: 'Session removed from local storage'
    };
  }

  // Session migration from localStorage to database
  async migrateLocalSessions(): Promise<ApiResponse<number>> {
    if (!this.currentUser?.id) {
      return {
        success: false,
        error: 'User must be authenticated to migrate sessions'
      };
    }

    if (!isDatabaseAvailable()) {
      return {
        success: false,
        error: 'Database not available for migration'
      };
    }

    try {
      this.requireAuth();
      
      // Get localStorage sessions
      const localSessions = this.getLocalStorageSessions();
      
      if (localSessions.length === 0) {
        return {
          success: true,
          data: 0,
          message: 'No local sessions found to migrate'
        };
      }

      // Sync user first
      await syncUserToDatabase(this.currentUser);
      
      const db = requireDatabase();
      const [userRecord] = await db`
        SELECT id FROM users WHERE clerk_id = ${this.currentUser.id}
      `;

      if (!userRecord) {
        throw new Error('User not found in database');
      }

      let migratedCount = 0;
      
      // Migrate each session
      for (const session of localSessions) {
        try {
          await db`
            INSERT INTO saved_sessions (user_id, name, timestamp, transcript)
            VALUES (${userRecord.id}, ${session.name}, ${session.timestamp}, ${JSON.stringify(session.transcript)})
            ON CONFLICT DO NOTHING
          `;
          migratedCount++;
        } catch (error) {
          console.warn(`Failed to migrate session ${session.name}:`, error);
        }
      }

      // Clear localStorage after successful migration
      if (migratedCount > 0) {
        localStorage.removeItem('aihub_sessions');
      }

      return {
        success: true,
        data: migratedCount,
        message: `Successfully migrated ${migratedCount} sessions to database`
      };

    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // LocalStorage helper methods
  private saveToLocalStorage(sessions: SavedSession[]) {
    try {
      localStorage.setItem('aihub_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private addToLocalStorage(session: SavedSession) {
    try {
      const existingSessions = this.getLocalStorageSessions();
      existingSessions.unshift(session);
      localStorage.setItem('aihub_sessions', JSON.stringify(existingSessions));
    } catch (error) {
      console.warn('Failed to add to localStorage:', error);
    }
  }

  private removeFromLocalStorage(sessionId: string) {
    try {
      const existingSessions = this.getLocalStorageSessions();
      const filtered = existingSessions.filter(s => s.id !== sessionId);
      localStorage.setItem('aihub_sessions', JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  private getLocalStorageSessions(): SavedSession[] {
    try {
      return JSON.parse(localStorage.getItem('aihub_sessions') || '[]');
    } catch (error) {
      console.warn('Failed to parse localStorage sessions:', error);
      return [];
    }
  }

  private loadLocalStorageSessions(): SessionsListApiResponse {
    const sessions = this.getLocalStorageSessions();
    
    return {
      success: true,
      data: sessions,
      message: `Loaded ${sessions.length} sessions from local storage`
    };
  }

  // Check if migration is needed
  hasLocalSessions(): boolean {
    try {
      const sessions = this.getLocalStorageSessions();
      return sessions.length > 0;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const sessionService = SessionService.getInstance();