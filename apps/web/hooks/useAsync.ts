import { useCallback, useState } from "react";

export function useAsync<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (task: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await task();
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败，请重试");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, run, setData };
}
