import { useEffect, useState } from 'react';
import { syncPendingChanges } from '@/services/patientService';
import { db } from '@/lib/db';
import { toast } from '@/hooks/use-toast';

export function SyncManager() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check for pending changes on load and whenever online status changes
  useEffect(() => {
    const checkPendingChanges = async () => {
      const count = await db.pendingChanges.count();
      setPendingCount(count);
    };

    checkPendingChanges();

    // Set up event listeners for online status
    const handleOnline = async () => {
      // When we come back online, check for pending changes and sync
      await checkPendingChanges();
      if (pendingCount > 0) {
        syncChanges();
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Set up interval to check for pending changes
    const interval = setInterval(checkPendingChanges, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [pendingCount]);

  // Function to sync pending changes
  const syncChanges = async () => {
    if (!navigator.onLine || isSyncing) return;
    
    try {
      setIsSyncing(true);
      await syncPendingChanges();
      
      // Recheck count after sync
      const newCount = await db.pendingChanges.count();
      setPendingCount(newCount);
      
      if (newCount === 0) {
        toast({
          title: "Sync complete",
          description: "All pending changes have been synchronized with the server.",
        });
      } else {
        toast({
          title: "Sync incomplete",
          description: `${newCount} changes still pending. Will retry later.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error syncing changes:', error);
      toast({
        title: "Sync failed",
        description: "There was an error synchronizing with the server. Will retry later.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Only render notification if there are pending changes
  if (pendingCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-amber-500 rounded-full mr-2 animate-pulse"></div>
            <h3 className="font-medium text-gray-900">Pending Changes</h3>
          </div>
          <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {pendingCount}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          You have {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} that needs to be synchronized.
        </p>
        <div className="mt-3">
          <button
            onClick={syncChanges}
            disabled={!navigator.onLine || isSyncing}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded text-sm font-medium disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : navigator.onLine ? 'Sync Now' : 'Waiting for connection'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SyncManager;
