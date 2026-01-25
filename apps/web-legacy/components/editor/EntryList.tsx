"use client";

import { useEffect, useRef, useState } from "react";
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
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editingEntryId) return;
    const raf = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [editingEntryId]);

  const cancelRename = () => {
    setEditingEntryId(null);
    setEditingValue("");
  };

  const commitRename = () => {
    if (!editingEntryId) return;
    const nextName = editingValue.trim();
    if (!nextName) {
      cancelRename();
      return;
    }
    onRename(editingEntryId, nextName);
    cancelRename();
  };

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
            {editingEntryId === entry.id ? (
              <input
                ref={inputRef}
                className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-ink outline-none focus:border-ink/40"
                value={editingValue}
                onChange={(event) => setEditingValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitRename();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    cancelRename();
                  }
                }}
                onBlur={commitRename}
              />
            ) : (
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => onSelect(entry.id)}
              >
                {entry.name}
              </button>
            )}
            {canEdit ? (
              <div className="flex items-center gap-1 text-xs">
                {pendingDeleteId === entry.id ? (
                  <>
                    <button
                      type="button"
                      className="rounded-md px-1 text-rose-500 hover:text-rose-600"
                      onClick={() => {
                        onDelete(entry.id);
                        setPendingDeleteId(null);
                      }}
                    >
                      确认
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-1 text-muted hover:text-ink"
                      onClick={() => setPendingDeleteId(null)}
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="rounded-md px-1 text-muted hover:text-ink"
                      onClick={() => {
                        setEditingEntryId(entry.id);
                        setEditingValue(entry.name);
                      }}
                      disabled={!canEdit}
                    >
                      重命名
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-1 text-muted hover:text-ink"
                      onClick={() => setPendingDeleteId(entry.id)}
                      disabled={!canEdit || entries.length <= 1}
                    >
                      删除
                    </button>
                  </>
                )}
              </div>
            ) : null}
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
