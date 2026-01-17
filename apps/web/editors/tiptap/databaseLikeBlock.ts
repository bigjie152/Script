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
        class: "database-like-block"
      }),
      ["div", { class: "database-like-title" }, "数据库块"],
      ["div", { class: "database-like-caption" }, "用于结构化记录（无运算）"]
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos, updateAttributes }) => {
      let currentNode = node;
      const dom = document.createElement("div");
      dom.className = "database-like-block";

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

      editButton.addEventListener("click", () => {
        const attrs = currentNode.attrs as DatabaseAttrs;
        const nextColumns = window.prompt(
          "请输入列名（英文逗号分隔）",
          (attrs.columns || DEFAULT_COLUMNS).join(",")
        );
        if (!nextColumns) return;

        const columns = nextColumns
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        const rowsInput = window.prompt(
          "请输入行数据（JSON 数组，例如 [[\"角色\",\"动机\"],[\"线索\",\"证据\"]]）",
          JSON.stringify(attrs.rows || DEFAULT_ROWS)
        );
        if (!rowsInput) return;

        let rows: string[][] = DEFAULT_ROWS;
        try {
          const parsed = JSON.parse(rowsInput);
          if (Array.isArray(parsed)) {
            rows = parsed.map((row) =>
              Array.isArray(row) ? row.map((cell) => String(cell)) : []
            );
          }
        } catch {
          rows = DEFAULT_ROWS;
        }

        const metadata = window.prompt(
          "可选备注（用于说明用途）",
          attrs.metadata || ""
        );

        updateAttributes({
          columns,
          rows,
          metadata: metadata || null
        });

        if (typeof getPos === "function") {
          editor.view.dispatch(
            editor.view.state.tr.setNodeMarkup(getPos(), undefined, {
              ...currentNode.attrs,
              columns,
              rows,
              metadata: metadata || null
            })
          );
        }
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
