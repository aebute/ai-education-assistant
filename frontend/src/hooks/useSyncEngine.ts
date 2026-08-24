"use client";

import { useEffect, useState } from "react";
import { initDB } from "@/lib/db";

export function useSyncEngine() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function syncOfflineData() {
    setIsSyncing(true);
    try {
      const db = await initDB();
      const unsyncedResults = await db.getAll("quizResults");
      const pending = unsyncedResults.filter((r) => !r.synced);

      if (pending.length > 0) {
        console.log("Syncing offline items to remote backend:", pending);
        const tx = db.transaction("quizResults", "readwrite");
        for (const item of pending) {
          if (item.id) {
            await tx.store.put({ ...item, synced: true });
          }
        }
        await tx.done;
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }

  return { isOnline, isSyncing, syncOfflineData };
}
