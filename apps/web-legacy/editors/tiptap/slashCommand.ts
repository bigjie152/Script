"use client";

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { createSuggestionRenderer } from "./createSuggestionRenderer";

type SlashItem = {
  title: string;
  description: string;
  command: (props: { editor: any; range: { from: number; to: number } }) => void;
};

const SLASH_ITEMS: SlashItem[] = [
  {
    title: "标题 1",
    description: "插入一级标题",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    }
  },
  {
    title: "标题 2",
    description: "插入二级标题",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    }
  },
  {
    title: "引用块",
    description: "插入引用说明",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    }
  },
  {
    title: "无序列表",
    description: "插入项目列表",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    }
  },
  {
    title: "有序列表",
    description: "插入步骤列表",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    }
  },
  {
    title: "代码块",
    description: "插入代码片段",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    }
  },
  {
    title: "分割线",
    description: "插入段落分割",
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    }
  },
  {
    title: "数据库块",
    description: "插入结构化信息表",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "databaseLike",
          attrs: {
            columns: ["字段", "内容"],
            rows: [["示例", "这里填写结构化内容"]],
            metadata: "结构化记录"
          }
        })
        .run();
    }
  },
  {
    title: "模板：三段结构",
    description: "快速插入三段式叙事模板",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent([
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "背景" }] },
          { type: "paragraph", content: [{ type: "text", text: "描述故事背景与设定。" }] },
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "冲突" }] },
          { type: "paragraph", content: [{ type: "text", text: "描述核心矛盾与事件。" }] },
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "结局" }] },
          { type: "paragraph", content: [{ type: "text", text: "描述结果与余波。" }] }
        ])
        .run();
    }
  }
];

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        items: ({ query }: { query: string }) => {
          if (!query) return SLASH_ITEMS;
          return SLASH_ITEMS.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          );
        },
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
        render: createSuggestionRenderer("slash-command-menu", "无可用命令")
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion
      })
    ];
  }
});
