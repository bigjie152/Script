"use client";

import { Button } from "../common/Button";
import { ModuleEntry } from "../../editors/adapters/moduleCollection";

type EntryListProps = {
  title: string;
  entries: ModuleEntry[];
  activeId?: string | null;
  canEdit?: boolean;
  onSelect: (entryId: string) => void;
  onCreate: () => void;
  onRename: (entryId: string, name: string) => void;
  onDelete: (entryId: string) => void;
};

export function EntryList({
  title,
  entries,
  activeId,
  canEdit = true,
  onSelect,
  onCreate,
  onRename,
  onDelete
}: EntryListProps) {
  return (
    <div className="mt-5 space-y-2">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{title}</span>
        <Button
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={onCreate}
          disabled={!canEdit}
        >
          新增
        </Button>
      </div>
      <div className="space-y-1">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`flex items-center justify-between rounded-lg px-2 py-1 text-sm ${
              entry.id === activeId
                ? "bg-white text-ink shadow-soft"
                : "text-muted hover:bg-white/50 hover:text-ink"
            }`}
          >
            <button
              type="button"
              className="flex-1 text-left"
              onClick={() => onSelect(entry.id)}
            >
              {entry.name}
            </button>
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                className="rounded-md px-1 text-muted hover:text-ink"
                onClick={() => {
                  const next = window.prompt("重命名条目", entry.name);
                  if (next && next.trim()) {
                    onRename(entry.id, next.trim());
                  }
                }}
                disabled={!canEdit}
              >
                重命名
              </button>
              <button
                type="button"
                className="rounded-md px-1 text-muted hover:text-ink"
                onClick={() => {
                  const ok = window.confirm("确定删除该条目吗？");
                  if (ok) onDelete(entry.id);
                }}
                disabled={!canEdit || entries.length <= 1}
              >
                删除
              </button>
            </div>
          </div>
        ))}
        {!entries.length ? (
          <div className="rounded-lg border border-dashed border-white/70 px-3 py-2 text-xs text-muted">
            暂无条目，点击“新增”创建。
          </div>
        ) : null}
      </div>
    </div>
  );
}
