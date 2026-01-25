import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  markNotificationsRead,
  NotificationItem
} from "../services/userApi";
import { useAuth } from "./useAuth";

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getNotifications();
      setItems(result.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败，请重试");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markRead = useCallback(
    async (ids?: string[]) => {
      await markNotificationsRead(ids);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh, markRead };
}
