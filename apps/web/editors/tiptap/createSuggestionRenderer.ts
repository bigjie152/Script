"use client";

type SuggestionItem = {
  title?: string;
  label?: string;
  description?: string;
};

export function createSuggestionRenderer(className: string, emptyText = "无匹配结果") {
  return () => {
    let container: HTMLDivElement | null = null;
    let items: SuggestionItem[] = [];
    let command: ((item: SuggestionItem) => void) | null = null;
    let selectedIndex = 0;
    const debugEnabled = process.env.NEXT_PUBLIC_EDITOR_DEBUG === "true";

    const renderItems = () => {
      if (!container) return;
      container.innerHTML = "";

      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "px-3 py-2 text-xs text-slate-400";
        empty.textContent = emptyText;
        container.appendChild(empty);
        return;
      }

      items.forEach((item, index) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className =
          "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors " +
          (index === selectedIndex
            ? "bg-slate-100 text-slate-900"
            : "text-slate-600 hover:bg-slate-100");
        const title = item.title || item.label || "";
        const desc = item.description || "";

        const titleEl = document.createElement("div");
        titleEl.className = "text-sm";
        titleEl.textContent = title;
        row.appendChild(titleEl);

        if (desc) {
          const descEl = document.createElement("div");
          descEl.className = "text-xs text-slate-400";
          descEl.textContent = desc;
          row.appendChild(descEl);
        }

        row.addEventListener("click", () => {
          command?.(item);
        });

        container?.appendChild(row);
      });
    };

    const setPosition = (clientRect?: DOMRect | null) => {
      if (!container || !clientRect) return;
      container.style.left = `${clientRect.left}px`;
      container.style.top = `${clientRect.bottom + 8}px`;
    };

    return {
      onStart: (props: any) => {
        items = props.items || [];
        command = props.command;
        selectedIndex = 0;
        container = document.createElement("div");
        container.className =
          className +
          " z-50 w-60 rounded-lg border border-slate-200 bg-white p-1 shadow-lg";
        renderItems();
        setPosition(props.clientRect?.());
        document.body.appendChild(container);
        if (debugEnabled) {
          console.info("[editor] suggestion start", className);
        }
      },
      onUpdate: (props: any) => {
        items = props.items || [];
        command = props.command;
        selectedIndex = 0;
        renderItems();
        setPosition(props.clientRect?.());
      },
      onKeyDown: (props: any) => {
        if (!items.length) return false;
        if (props.event.key === "ArrowDown") {
          selectedIndex = (selectedIndex + 1) % items.length;
          renderItems();
          return true;
        }
        if (props.event.key === "ArrowUp") {
          selectedIndex = (selectedIndex - 1 + items.length) % items.length;
          renderItems();
          return true;
        }
        if (props.event.key === "Enter") {
          command?.(items[selectedIndex]);
          return true;
        }
        if (props.event.key === "Escape") {
          container?.remove();
          container = null;
          return true;
        }
        return false;
      },
      onExit: () => {
        container?.remove();
        container = null;
        if (debugEnabled) {
          console.info("[editor] suggestion exit", className);
        }
      }
    };
  };
}
