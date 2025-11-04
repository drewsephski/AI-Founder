import React, { useState } from 'react';
import { UploadIcon, CheckIcon, AlertCircleIcon } from '../components/icons/Icons';
import { sessionService } from '../services/apiService';

interface SessionMigrationProps {
  onMigrationComplete: () => void;
  isVisible: boolean;
}

const SessionMigration: React.FC<SessionMigrationProps> = ({ onMigrationComplete, isVisible }) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  if (!isVisible) return null;

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await sessionService.migrateLocalSessions();
      
      setMigrationResult({
        success: result.success,
        message: result.message || result.error || 'Migration completed',
        count: result.data
      });

      if (result.success) {
        // Wait a moment to show success message, then call completion handler
        setTimeout(() => {
          onMigrationComplete();
        }, 2000);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationResult({
        success: false,
        message: 'Migration failed due to an unexpected error'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDismiss = () => {
    onMigrationComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center space-x-3 mb-4">
          <UploadIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-card-foreground">Migrate Your Sessions</h2>
        </div>
        
        <p className="text-secondary-foreground/80 mb-6">
          We found {sessionService.hasLocalSessions() ? 'saved sessions' : 'some data'} from your previous sessions stored locally. 
          Would you like to migrate these to your secure database account for cloud sync?
        </p>

        {migrationResult ? (
          <div className={`p-4 rounded-md mb-6 ${
            migrationResult.success 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <div className="flex items-center space-x-2">
              {migrationResult.success ? (
                <CheckIcon className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircleIcon className="w-5 h-5 text-red-500" />
              )}
              <p className={`font-medium ${
                migrationResult.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {migrationResult.message}
              </p>
            </div>
            {migrationResult.success && migrationResult.count !== undefined && (
              <p className="text-sm text-green-400/80 mt-2">
                {migrationResult.count} session{migrationResult.count !== 1 ? 's' : ''} migrated successfully
              </p>
            )}
          </div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-md mb-6">
            <div className="flex items-center space-x-2">
              <UploadIcon className="w-5 h-5 text-blue-400" />
              <p className="text-sm font-medium text-blue-400">
                Migration Benefits:
              </p>
            </div>
            <ul className="text-sm text-blue-400/80 mt-2 space-y-1 ml-7">
              <li>• Access your sessions from any device</li>
              <li>• Secure cloud backup</li>
              <li>• Automatic syncing</li>
              <li>• Free up local storage</li>
            </ul>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          {!migrationResult && (
            <button
              onClick={handleDismiss}
              disabled={isMigrating}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md font-semibold hover:bg-accent transition-colors disabled:opacity-50"
            >
              Skip for Now
            </button>
          )}
          <button
            onClick={migrationResult?.success ? handleDismiss : handleMigration}
            disabled={isMigrating}
            className={`px-6 py-2 rounded-md font-semibold transition-colors disabled:opacity-50 ${
              migrationResult?.success
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isMigrating 
              ? 'Migrating...' 
              : migrationResult?.success 
                ? 'Continue' 
                : 'Migrate Sessions'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionMigration;