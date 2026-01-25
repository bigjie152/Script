export enum ProjectStatus {
  InProgress = "进行中",
  Completed = "已完成",
  Archived = "已归档",
}

export enum TruthStatus {
  Locked = "已锁定",
  Draft = "草稿",
  Review = "审核中",
}

export enum ModuleType {
  Overview = "概览",
  Truth = "真相",
  Characters = "角色",
  Clues = "线索",
  Timeline = "时间线",
  Manual = "DM 手册",
}

export enum ScriptGenre {
  Suspense = "悬疑",
  Emotion = "情感",
  Horror = "恐怖",
  Mechanism = "机制",
  Hardcore = "硬核",
}

export interface ScriptMetadata {
  title: string;
  genre: ScriptGenre;
  playerCount: number;
  version: string;
  lastUpdated: string;
}

export interface ImageEditRequest {
  image: string;
  prompt: string;
}

export interface Role {
  id: string;
  name: string;
  avatar?: string;
  motivation: string;
  knownTruth: string;
  secret: string;
  content: string;
  sourceVersion: string;
}

export interface Clue {
  id: string;
  name: string;
  type: string;
  acquisition: string;
  pointsTo: string;
  reliability: string;
  content: string;
  sourceVersion: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  description: string;
  characters: string[];
}
