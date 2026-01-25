"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings,
  User as UserIcon,
  LogOut,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "工作台", icon: LayoutDashboard, path: "/" },
  { label: "我的项目", icon: FolderOpen, path: "/projects" },
  { label: "社区", icon: Users, path: "/community" },
  { label: "AI拓展功能", icon: Sparkles, path: "/ai-features" },
  { label: "系统设置", icon: Settings, path: "/settings" }
];

const userItems = [{ label: "个人中心", icon: UserIcon, path: "/user/profile" }];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const displayUser = {
    username: user?.username || "未登录",
    avatarUrl: "https://picsum.photos/200",
    role: user ? "专业作者" : "访客"
  };

  return (
    <aside className="w-64 h-screen bg-white shadow-xl flex flex-col fixed left-0 top-0 z-20 transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <span className="font-bold text-xl">S</span>
        </div>
        <div>
          <h1 className="font-bold text-gray-800 text-lg leading-tight">
            AI 剧本助手
          </h1>
          <p className="text-xs text-gray-500">剧本工作室</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
          菜单
        </div>
        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                active
                  ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <ActiveIcon
                className={`w-5 h-5 ${
                  active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              <span className="font-medium">{item.label}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              )}
            </Link>
          );
        })}

        <div className="mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
          账户
        </div>
        {userItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                active
                  ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <ActiveIcon
                className={`w-5 h-5 ${
                  active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-md transition-all cursor-pointer group">
          <div className="relative">
            <img
              src={displayUser.avatarUrl}
              alt={displayUser.username}
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {displayUser.username}
            </p>
            <p className="text-xs text-gray-500 truncate">{displayUser.role}</p>
          </div>
          <button
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            type="button"
            onClick={async () => {
              if (!user) {
                router.push("/login");
                return;
              }
              await logout();
            }}
          >
            <LogOut size={16} />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between px-2">
          <span className="text-[10px] text-gray-400 font-mono">v0.1（演示版）</span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Sparkles size={10} /> 专业版
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
