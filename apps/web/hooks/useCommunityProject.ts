import { useCallback, useEffect, useState } from "react";
import {
  getCommunityProject,
  CommunityProjectDetail
} from "../services/communityApi";

export function useCommunityProject(projectId: string) {
  const [data, setData] = useState<CommunityProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    let alive = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const detail = await getCommunityProject(projectId);
        if (!alive) return;
        setData(detail);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "加载失败，请重试");
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [projectId, version]);

  return {
    data,
    loading,
    error,
    refresh
  };
}
