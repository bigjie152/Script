"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createProject } from "@/services/projectApi";

const Header: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCreate = async () => {
    if (!user || creating) return;
    setCreating(true);
    try {
      const result = await createProject({
        name: "未命名剧本",
        description: "新建项目"
      });
      const projectId = result.projectId || result.project?.id;
      if (projectId) {
        router.push(`/projects/${projectId}/editor/overview`);
      }
    } catch (error) {
      console.error("[header] create project failed", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="w-1/4" />

      <div className="flex-1 max-w-md relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          id="global-search"
          type="text"
          className="block w-full pl-10 pr-12 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          placeholder="搜索项目或社区..."
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-400 text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white">
            Ctrl K
          </span>
        </div>
      </div>

      <div className="w-1/4 flex items-center justify-end gap-4">
        <button
          className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          type="button"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <button
          onClick={handleCreate}
          disabled={!user || creating}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg ${
            !user || creating
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0"
          }`}
          type="button"
        >
          <Plus className="w-4 h-4" />
          <span>{creating ? "创建中..." : "新建项目"}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
