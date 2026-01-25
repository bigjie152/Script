"use client";

import { useEffect, useState } from "react";
import Sidebar, { NavStructure } from "./components/Sidebar";
import Header from "./components/Header";
import RightPanel from "./components/RightPanel";
import Overview from "./components/Modules/Overview";
import Truth from "./components/Modules/Truth";
import Roles from "./components/Modules/Roles";
import Clues from "./components/Modules/Clues";
import Timeline from "./components/Modules/Timeline";
import Manual from "./components/Modules/Manual";

import { ModuleType, ProjectStatus, TruthStatus, ScriptGenre, ScriptMetadata, Role, Clue } from "./types/types";

const mockRoles: Role[] = [
  { id: "1", name: "陈医生", motivation: "复仇", knownTruth: "High", secret: "3", content: "", sourceVersion: "v1" },
  { id: "2", name: "林管家", motivation: "守护", knownTruth: "Medium", secret: "1", content: "", sourceVersion: "v1" },
  { id: "3", name: "苏小姐", motivation: "贪婪", knownTruth: "Low", secret: "2", content: "", sourceVersion: "v1" },
];

const mockClues: Clue[] = [
  { id: "101", name: "烧焦的日记", type: "物品", acquisition: "书房", pointsTo: "陈医生", reliability: "真实", content: "", sourceVersion: "v1" },
  { id: "102", name: "录音笔", type: "音频", acquisition: "卧室", pointsTo: "林管家", reliability: "真实", content: "", sourceVersion: "v1" },
];

const projectStructure: NavStructure = {
  [ModuleType.Characters]: mockRoles.map((role) => ({ id: role.id, label: role.name })),
  [ModuleType.Clues]: mockClues.map((clue) => ({ id: clue.id, label: clue.name })),
  [ModuleType.Timeline]: [
    { id: "act-1", label: "第一幕：集结" },
    { id: "act-2", label: "第二幕：晚宴" },
    { id: "act-3", label: "第三幕：搜证" },
  ],
  [ModuleType.Manual]: [
    { id: "manual-1", label: "开场致辞" },
    { id: "manual-2", label: "破冰环节" },
    { id: "manual-3", label: "搜证引导" },
    { id: "manual-4", label: "复盘逻辑" },
  ],
};

interface EditorAppProps {
  initialModule?: ModuleType;
  initialSubId?: string;
}

const EditorApp: React.FC<EditorAppProps> = ({ initialModule, initialSubId }) => {
  const [activeModule, setActiveModule] = useState<ModuleType>(initialModule ?? ModuleType.Overview);
  const [activeSubId, setActiveSubId] = useState<string | undefined>(initialSubId);

  const [scriptMetadata] = useState<ScriptMetadata>({
    title: "未命名剧本",
    genre: ScriptGenre.Suspense,
    playerCount: 5,
    version: "v0.1",
    lastUpdated: "2026-01-19T10:01:59",
  });

  const [truthStatus, setTruthStatus] = useState<TruthStatus>(TruthStatus.Locked);

  useEffect(() => {
    if (initialModule) {
      setActiveModule(initialModule);
    }
    if (initialSubId) {
      setActiveSubId(initialSubId);
    }
  }, [initialModule, initialSubId]);

  const handleNavigate = (module: ModuleType, subId?: string) => {
    setActiveModule(module);
    setActiveSubId(subId);
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case ModuleType.Overview:
        return <Overview metadata={scriptMetadata} />;
      case ModuleType.Truth:
        return <Truth status={truthStatus} onStatusChange={setTruthStatus} />;
      case ModuleType.Characters:
        return <Roles roles={mockRoles} activeSubId={activeSubId} />;
      case ModuleType.Clues:
        return <Clues clues={mockClues} activeSubId={activeSubId} />;
      case ModuleType.Timeline:
        return <Timeline activeSubId={activeSubId} />;
      case ModuleType.Manual:
        return <Manual activeSubId={activeSubId} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-lg font-medium">{activeModule} 模块开发中</div>
            <p className="text-sm">功能即将上线</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FB] overflow-hidden text-gray-800 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      <Sidebar activeModule={activeModule} activeSubId={activeSubId} onNavigate={handleNavigate} structure={projectStructure} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header module={activeModule} projectStatus={ProjectStatus.InProgress} truthStatus={truthStatus} scriptTitle={scriptMetadata.title} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">{renderModuleContent()}</main>
      </div>

      <RightPanel />
    </div>
  );
};

export default EditorApp;
