import { useCallback, useEffect, useState } from "react";
import { getUserProfile, UserProfileResponse } from "../services/userApi";
import { useAuth } from "./useAuth";

export function useUserProfile() {
  const { user } = useAuth();
  const [data, setData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }
    let alive = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const result = await getUserProfile();
        if (alive) setData(result);
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "加载失败，请重试");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [user, version]);

  return { data, loading, error, refresh };
}
