import { ProjectListItem } from "../../services/projectApi";

export function formatTruthStatus(status?: string) {
  if (status === "Locked") return "已锁定";
  return "草稿";
}

export function formatRelativeTime(value?: string) {
  if (!value) return "-";
  const normalized = value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
  return `${Math.floor(diff / day)} 天前`;
}

export function getProgress(item: ProjectListItem) {
  if (item.status === "Completed") return 100;
  if (item.status === "In Progress") return 45;
  if (item.truthStatus === "Locked") return 60;
  return 12;
}
