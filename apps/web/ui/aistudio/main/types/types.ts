import type { ElementType } from "react";

export enum ProjectStatus {
  DRAFT = "草稿",
  LOCKED = "已锁定",
  PUBLISHED = "已发布",
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  lastEdited: string;
  progress: number;
  coverImage?: string;
}

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  role: string;
}

export interface NavItem {
  label: string;
  icon: ElementType;
  path: string;
}
