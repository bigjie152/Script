"use client";

type SuggestionItem = {
  title?: string;
  label?: string;
  description?: string;
};

export function createSuggestionRenderer(className: string) {
  return () => {
    let container: HTMLDivElement | null = null;
    let items: SuggestionItem[] = [];
    let command: ((item: SuggestionItem) => void) | null = null;
    let selectedIndex = 0;

    const renderItems = () => {
      if (!container) return;
      container.innerHTML = "";

      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "suggestion-item is-empty";
        empty.textContent = "无匹配结果";
        container.appendChild(empty);
        return;
      }

      items.forEach((item, index) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className =
          "suggestion-item" + (index === selectedIndex ? " is-selected" : "");
        const title = item.title || item.label || "";
        const desc = item.description || "";

        const titleEl = document.createElement("div");
        titleEl.className = "suggestion-title";
        titleEl.textContent = title;
        row.appendChild(titleEl);

        if (desc) {
          const descEl = document.createElement("div");
          descEl.className = "suggestion-desc";
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
        container.className = className;
        renderItems();
        setPosition(props.clientRect?.());
        document.body.appendChild(container);
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
      }
    };
  };
}
