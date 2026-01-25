"use client";

import { useState, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface RichEditorProps {
  initialContent?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: string;
  placeholder?: string;
}

const ToolbarButton: React.FC<{ icon: React.ElementType; active?: boolean; disabled?: boolean }> = ({
  icon: Icon,
  active,
  disabled,
}) => (
  <button
    disabled={disabled}
    className={`p-1.5 rounded transition-colors ${
      disabled ? "text-gray-300 cursor-not-allowed" : active ? "bg-gray-100 text-indigo-600" : "text-gray-600 hover:bg-gray-100"
    }`}
    type="button"
  >
    <Icon size={18} />
  </button>
);

const RichEditor: React.FC<RichEditorProps> = ({
  initialContent,
  readOnly = false,
  className = "",
  minHeight = "min-h-[300px]",
  placeholder = "开始编辑...",
}) => {
  const [content, setContent] = useState<string>(initialContent || "");

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  return (
    <div className={`flex flex-col h-full border border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner transition-colors duration-300 ${className}`}>
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-1 pr-3 border-r border-gray-200">
            <button className="px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded" type="button">
              H1
            </button>
            <button className="px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded" type="button">
              H2
            </button>
            <button className="px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded" type="button">
              Body
            </button>
          </div>
          <ToolbarButton icon={Bold} />
          <ToolbarButton icon={Italic} />
          <ToolbarButton icon={Underline} />
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <ToolbarButton icon={AlignLeft} active />
          <ToolbarButton icon={AlignCenter} />
          <ToolbarButton icon={AlignRight} />
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <ToolbarButton icon={List} />
          <ToolbarButton icon={ListOrdered} />
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <ToolbarButton icon={Link} />
          <ToolbarButton icon={ImageIcon} />
          <div className="flex-1"></div>
          <ToolbarButton icon={Undo} />
          <ToolbarButton icon={Redo} />
        </div>
      )}

      <div className={`flex-1 p-6 overflow-y-auto ${readOnly ? "bg-transparent" : ""} relative`}>
        <div
          className={`prose prose-sm md:prose-base max-w-none focus:outline-none ${minHeight} ${readOnly ? "cursor-default" : "cursor-text"}`}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: content }}
          onBlur={(event) => setContent(event.currentTarget.innerHTML)}
        />
        {!content && !readOnly && <div className="text-gray-300 pointer-events-none absolute top-6 left-6">{placeholder}</div>}
      </div>
    </div>
  );
};

export default RichEditor;
