import { useEffect, useMemo, useState } from "react";
import {
  listCommunityProjects,
  CommunityProjectListItem
} from "../services/communityApi";

type UseCommunityProjectsOptions = {
  sort?: "latest" | "hot";
  q?: string;
  genre?: string;
  author?: string;
};

type CommunityProjectsState = {
  projects: CommunityProjectListItem[];
  loading: boolean;
  error: string | null;
};

export function useCommunityProjects(options: UseCommunityProjectsOptions = {}) {
  const [state, setState] = useState<CommunityProjectsState>({
    projects: [],
    loading: false,
    error: null
  });

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        sort: options.sort || "latest",
        q: options.q || "",
        genre: options.genre || "",
        author: options.author || ""
      }),
    [options.sort, options.q, options.genre, options.author]
  );

  useEffect(() => {
    let alive = true;
    async function run() {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await listCommunityProjects({
          sort: options.sort || "latest",
          q: options.q,
          genre: options.genre,
          author: options.author
        });
        if (!alive) return;
        setState({
          projects: result.projects || [],
          loading: false,
          error: null
        });
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
  }, [queryKey, options.sort, options.q, options.genre, options.author]);

  return state;
}
