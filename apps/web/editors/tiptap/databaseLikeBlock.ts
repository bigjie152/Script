"use client";

import { Node, mergeAttributes } from "@tiptap/core";

type DatabaseAttrs = {
  columns: string[];
  rows: string[][];
  metadata?: string | null;
};

const DEFAULT_COLUMNS = ["字段", "内容"];
const DEFAULT_ROWS = [["示例", "这里填写结构化内容"]];

export const DatabaseLikeBlock = Node.create({
  name: "databaseLike",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      columns: {
        default: DEFAULT_COLUMNS
      },
      rows: {
        default: DEFAULT_ROWS
      },
      metadata: {
        default: null
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type=\"database-like\"]"
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "database-like",
        "data-block-node": "true",
        class: "database-like-block block-node"
      }),
      ["div", { class: "database-like-title" }, "数据库块"],
      ["div", { class: "database-like-caption" }, "用于结构化记录（不含运算）"]
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      let currentNode = node;
      const dom = document.createElement("div");
      dom.className = "database-like-block block-node";
      dom.setAttribute("data-block-node", "true");

      const handle = document.createElement("span");
      handle.className = "block-handle";
      handle.setAttribute("contenteditable", "false");
      dom.appendChild(handle);

      const header = document.createElement("div");
      header.className = "database-like-header";

      const title = document.createElement("div");
      title.className = "database-like-title";
      title.textContent = "数据库块";

      const meta = document.createElement("div");
      meta.className = "database-like-meta";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "database-like-action";
      editButton.textContent = "编辑结构";

      header.appendChild(title);
      header.appendChild(meta);
      header.appendChild(editButton);
      dom.appendChild(header);

      const table = document.createElement("table");
      table.className = "database-like-table";
      dom.appendChild(table);

      const renderTable = () => {
        table.innerHTML = "";
        const attrs = currentNode.attrs as DatabaseAttrs;
        const columns = attrs.columns?.length ? attrs.columns : DEFAULT_COLUMNS;
        const rows = attrs.rows?.length ? attrs.rows : DEFAULT_ROWS;

        meta.textContent = attrs.metadata ? `备注：${attrs.metadata}` : "结构化区块";

        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        columns.forEach((col) => {
          const th = document.createElement("th");
          th.textContent = col;
          headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        rows.forEach((row) => {
          const tr = document.createElement("tr");
          columns.forEach((_, idx) => {
            const td = document.createElement("td");
            td.textContent = row[idx] ?? "";
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
      };

      let panel: HTMLDivElement | null = null;
      const closePanel = () => {
        panel?.remove();
        panel = null;
      };

      editButton.addEventListener("click", () => {
        if (panel) {
          closePanel();
          return;
        }
        const attrs = currentNode.attrs as DatabaseAttrs;
        panel = document.createElement("div");
        panel.className = "database-like-panel";

        const columnsLabel = document.createElement("div");
        columnsLabel.className = "database-like-panel-label";
        columnsLabel.textContent = "列名（逗号分隔）";

        const columnsInput = document.createElement("input");
        columnsInput.type = "text";
        columnsInput.className = "database-like-panel-input";
        columnsInput.value = (attrs.columns || DEFAULT_COLUMNS).join(",");

        const rowsLabel = document.createElement("div");
        rowsLabel.className = "database-like-panel-label";
        rowsLabel.textContent = "行数据（JSON 数组）";

        const rowsInput = document.createElement("textarea");
        rowsInput.className = "database-like-panel-textarea";
        rowsInput.value = JSON.stringify(attrs.rows || DEFAULT_ROWS);

        const metaLabel = document.createElement("div");
        metaLabel.className = "database-like-panel-label";
        metaLabel.textContent = "备注（可选）";

        const metaInput = document.createElement("input");
        metaInput.type = "text";
        metaInput.className = "database-like-panel-input";
        metaInput.value = attrs.metadata || "";

        const actions = document.createElement("div");
        actions.className = "database-like-panel-actions";

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "database-like-panel-btn ghost";
        cancelButton.textContent = "取消";
        cancelButton.addEventListener("click", closePanel);

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.className = "database-like-panel-btn";
        saveButton.textContent = "保存";
        saveButton.addEventListener("click", () => {
          const columns = columnsInput.value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

          let rows: string[][] = DEFAULT_ROWS;
          try {
            const parsed = JSON.parse(rowsInput.value || "[]");
            if (Array.isArray(parsed)) {
              rows = parsed.map((row) =>
                Array.isArray(row) ? row.map((cell) => String(cell)) : []
              );
            }
          } catch {
            rows = DEFAULT_ROWS;
          }

          const metadata = metaInput.value.trim();

          if (typeof getPos === "function") {
            editor.view.dispatch(
              editor.view.state.tr.setNodeMarkup(getPos(), undefined, {
                ...currentNode.attrs,
                columns: columns.length ? columns : DEFAULT_COLUMNS,
                rows,
                metadata: metadata || null
              })
            );
          }
          closePanel();
        });

        actions.appendChild(cancelButton);
        actions.appendChild(saveButton);

        panel.appendChild(columnsLabel);
        panel.appendChild(columnsInput);
        panel.appendChild(rowsLabel);
        panel.appendChild(rowsInput);
        panel.appendChild(metaLabel);
        panel.appendChild(metaInput);
        panel.appendChild(actions);

        dom.appendChild(panel);
        columnsInput.focus();
        columnsInput.select();
      });

      renderTable();

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== currentNode.type.name) {
            return false;
          }
          currentNode = updatedNode;
          renderTable();
          return true;
        }
      };
    };
  }
});
