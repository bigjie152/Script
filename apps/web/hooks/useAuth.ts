import { useCallback, useEffect, useState } from "react";
import { AuthUser, getMe, loginUser, logoutUser, registerUser } from "../services/authApi";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await getMe();
      setState({ user: result.user ?? null, loading: false, error: null });
    } catch (err) {
      setState({
        user: null,
        loading: false,
        error: err instanceof Error ? err.message : "获取登录状态失败，请稍后重试"
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginUser(username, password);
    setState({ user: result.user, loading: false, error: null });
    return result.user;
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const result = await registerUser(username, password);
    setState({ user: result.user, loading: false, error: null });
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setState({ user: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    refresh,
    login,
    register,
    logout
  };
}
