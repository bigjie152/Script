import { useEffect, useMemo, useState } from "react";
import { listProjects, ProjectListItem } from "../services/projectApi";
import { useAuth } from "./useAuth";

type UseProjectsOptions = {
  limit?: number;
  sort?: "updatedAt" | "status" | "truthStatus" | "progress";
  q?: string;
  status?: string;
  truthStatus?: string;
  scope?: "mine";
  refreshKey?: number;
};

type ProjectsState = {
  projects: ProjectListItem[];
  loading: boolean;
  error: string | null;
};

export function useProjects(options: UseProjectsOptions = {}) {
  const { user } = useAuth();
  const [state, setState] = useState<ProjectsState>({
    projects: [],
    loading: false,
    error: null
  });

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        scope: options.scope || "mine",
        sort: options.sort || "updatedAt",
        q: options.q || "",
        status: options.status || "",
        truthStatus: options.truthStatus || "",
        refreshKey: options.refreshKey || 0
      }),
    [
      options.scope,
      options.sort,
      options.q,
      options.status,
      options.truthStatus,
      options.refreshKey
    ]
  );

  useEffect(() => {
    if (!user) {
      setState({ projects: [], loading: false, error: null });
      return;
    }

    let alive = true;
    async function run() {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await listProjects({
          scope: options.scope || "mine",
          sort: options.sort || "updatedAt",
          q: options.q,
          status: options.status,
          truthStatus: options.truthStatus
        });
        if (!alive) return;
        const projects = result.projects || [];
        const sliced = options.limit ? projects.slice(0, options.limit) : projects;
        setState({ projects: sliced, loading: false, error: null });
      } catch (err) {
        if (!alive) return;
        setState({
          projects: [],
          loading: false,
          error: err instanceof Error ? err.message : "加载失败，请重试"
        });
      }
    }
    run();

    return () => {
      alive = false;
    };
  }, [user, queryKey, options.limit, options.q, options.sort, options.scope, options.status, options.truthStatus]);

  return state;
}
