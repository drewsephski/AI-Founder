import sql, { requireDatabase } from './database';

interface ClerkUser {
  id: string;
  primaryEmailAddress?: {
    emailAddress: string;
  };
  emailAddresses?: Array<{
    emailAddress: string;
  }>;
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

export async function getOrCreateUser(user: ClerkUser) {
  const db = requireDatabase();
  
  try {
    // Use UPSERT pattern for reliable user creation/updates
    const [userRecord] = await db`
      INSERT INTO users (clerk_id, email, name)
      VALUES (${user.id}, ${user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || ''}, ${user.fullName || user.firstName + ' ' + user.lastName || null})
      ON CONFLICT (clerk_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW()
      RETURNING id
    `;
    
    return userRecord.id;
  } catch (error) {
    console.error('Failed to get or create user:', error);
    throw new Error(`User creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function syncUserToDatabase(user: ClerkUser) {
  try {
    const userId = await getOrCreateUser(user);
    console.log('User synced to database successfully:', { clerk_id: user.id, db_id: userId });
    return userId;
  } catch (error) {
    console.error('Failed to sync user to database:', error);
    throw error;
  }
}

export async function trackToolUsage(user: ClerkUser, toolType: string, toolName: string) {
  if (!user?.id) {
    console.warn('No user provided for tool usage tracking');
    return;
  }
  
  try {
    const db = requireDatabase();
    const userId = await getOrCreateUser(user);
    
    // Atomic upsert for tool usage tracking
    await db`
      INSERT INTO user_tool_usage (user_id, tool_type, tool_name, usage_count, last_used)
      VALUES (${userId}, ${toolType}, ${toolName}, 1, NOW())
      ON CONFLICT (user_id, tool_type) DO UPDATE SET
        usage_count = user_tool_usage.usage_count + 1,
        last_used = NOW(),
        updated_at = NOW()
    `;
    
    console.log('Tool usage tracked:', { userId, toolType, toolName });
  } catch (error) {
    console.error('Failed to track tool usage:', error);
    // Don't throw error - tracking failure shouldn't break user experience
  }
}

export async function getUserSessions(user: ClerkUser) {
  if (!user?.id) {
    console.warn('No user provided for session retrieval');
    return [];
  }
  
  try {
    const db = requireDatabase();
    const userId = await getOrCreateUser(user);
    
    const sessions = await db`
      SELECT * FROM saved_sessions
      WHERE user_id = ${userId}
      ORDER BY timestamp DESC
    `;
    
    return sessions.map((session: any) => ({
      id: session.id.toString(),
      name: session.name,
      timestamp: session.timestamp,
      transcript: JSON.parse(session.transcript)
    }));
  } catch (error) {
    console.error('Failed to get user sessions:', error);
    return [];
  }
}

export async function saveSession(user: ClerkUser, sessionName: string, transcript: any[]) {
  if (!user?.id) {
    throw new Error('User must be authenticated to save sessions');
  }
  
  try {
    const db = requireDatabase();
    const userId = await getOrCreateUser(user);
    
    const [result] = await db`
      INSERT INTO saved_sessions (user_id, name, timestamp, transcript)
      VALUES (${userId}, ${sessionName}, ${new Date().toISOString()}, ${JSON.stringify(transcript)})
      RETURNING id
    `;
    
    console.log('Session saved successfully:', { sessionId: result.id, userId, sessionName });
    return result.id;
  } catch (error) {
    console.error('Failed to save session:', error);
    throw new Error(`Session save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteUserSession(user: ClerkUser, sessionId: string) {
  if (!user?.id) {
    throw new Error('User must be authenticated to delete sessions');
  }
  
  try {
    const db = requireDatabase();
    const userId = await getOrCreateUser(user);
    
    await db`
      DELETE FROM saved_sessions
      WHERE id = ${parseInt(sessionId)} AND user_id = ${userId}
    `;
    
    console.log('Session deleted successfully:', { sessionId, userId });
    return true;
  } catch (error) {
    console.error('Failed to delete session:', error);
    throw new Error(`Session deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getUserToolUsage(user: ClerkUser) {
  if (!user?.id) {
    console.warn('No user provided for tool usage retrieval');
    return [];
  }
  
  try {
    const db = requireDatabase();
    const userId = await getOrCreateUser(user);
    
    const usage = await db`
      SELECT * FROM user_tool_usage
      WHERE user_id = ${userId}
      ORDER BY last_used DESC
    `;
    
    return usage;
  } catch (error) {
    console.error('Failed to get user tool usage:', error);
    return [];
  }
}