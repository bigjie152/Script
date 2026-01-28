"use client";

import type { Editor } from "@tiptap/react";

type BubbleMenuBarProps = {
  editor: Editor;
};

const BUTTON_BASE =
  "rounded-md px-2 py-1 text-xs font-medium transition-colors";

const FONT_FAMILIES = [
  { label: "默认", value: "" },
  { label: "思源黑体", value: "Source Han Sans" },
  { label: "思源宋体", value: "Source Han Serif" },
  { label: "苹方", value: "PingFang SC" },
  { label: "微软雅黑", value: "Microsoft YaHei" }
];

const FONT_SIZES = [
  { label: "更小", value: "12px" },
  { label: "小", value: "14px" },
  { label: "中", value: "16px" },
  { label: "大", value: "20px" },
  { label: "特大", value: "24px" }
];

const COLOR_PRESETS = [
  "#0f172a",
  "#334155",
  "#2563eb",
  "#7c3aed",
  "#f97316",
  "#16a34a",
  "#dc2626"
];

export function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
  const buttonClass = (active: boolean) =>
    `${BUTTON_BASE} ${
      active
        ? "bg-slate-200 text-slate-900"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  const textStyle = editor.getAttributes("textStyle");
  const currentFont = textStyle.fontFamily || "";
  const currentSize = textStyle.fontSize || "";
  const currentColor = textStyle.color || "";

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white/95 px-2 py-1 shadow-sm">
      <select
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
        value={currentFont}
        onChange={(event) => {
          const next = event.target.value;
          if (!next) {
            editor.chain().focus().unsetFontFamily().run();
            return;
          }
          editor.chain().focus().setFontFamily(next).run();
        }}
      >
        {FONT_FAMILIES.map((item) => (
          <option key={item.label} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
        value={currentSize}
        onChange={(event) => {
          const next = event.target.value;
          if (!next) {
            editor.chain().focus().unsetFontSize().run();
            return;
          }
          editor.chain().focus().setFontSize(next).run();
        }}
      >
        {FONT_SIZES.map((item) => (
          <option key={item.label} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        className={buttonClass(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        加粗
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        斜体
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("underline"))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        下划线
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        删除线
      </button>

      <span className="mx-1 h-4 w-px bg-slate-200" />

      <button
        type="button"
        className={buttonClass(editor.isActive("heading", { level: 1 }))}
        onClick={() => editor.chain().focus().setNode("heading", { level: 1 }).run()}
      >
        H1
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().setNode("heading", { level: 2 }).run()}
      >
        H2
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        引用
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        无序
      </button>
      <button
        type="button"
        className={buttonClass(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        有序
      </button>

      <span className="mx-1 h-4 w-px bg-slate-200" />

      <button
        type="button"
        className={buttonClass(editor.isActive("highlight"))}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        高亮
      </button>
      <input
        type="color"
        className="h-6 w-6 cursor-pointer rounded border border-slate-200"
        value={currentColor || "#0f172a"}
        onChange={(event) =>
          editor.chain().focus().setColor(event.target.value).run()
        }
        title="文字颜色"
      />

      <button
        type="button"
        className={buttonClass(editor.isActive("link"))}
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          const url = window.prompt("请输入链接地址");
          if (!url) return;
          editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        链接
      </button>

      {COLOR_PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          className={`h-5 w-5 rounded-full border ${
            currentColor === color ? "border-slate-600" : "border-slate-200"
          }`}
          style={{ backgroundColor: color }}
          onClick={() => editor.chain().focus().setColor(color).run()}
        />
      ))}
    </div>
  );
}
