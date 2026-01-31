import { useCallback, useEffect, useState } from "react";
import { getProject, ProjectDetail } from "../services/projectApi";

export function useProject(projectId: string) {
  const [data, setData] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let alive = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const detail = await getProject(projectId);
        if (alive) setData(detail);
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
  }, [projectId, version]);

  return {
    project: data?.project ?? null,
    truth: data?.truth ?? null,
    latestSnapshotId: data?.latestSnapshotId ?? null,
    loading,
    error,
    refresh
  };
}
