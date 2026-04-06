"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { getQueue, processQueue } from "@/lib/offline/sync-queue";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueLength, setQueueLength] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setQueueLength(getQueue().length);

    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(() => setQueueLength(getQueue().length), 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  async function handleSync() {
    setSyncing(true);
    await processQueue();
    setQueueLength(getQueue().length);
    setSyncing(false);
  }

  if (isOnline && queueLength === 0) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${
      isOnline ? "bg-yellow-500 text-yellow-950" : "bg-red-500 text-white"
    }`}>
      {!isOnline && (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline Mode</span>
        </>
      )}
      {queueLength > 0 && (
        <>
          <span>{queueLength} pending</span>
          {isOnline && (
            <button onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
