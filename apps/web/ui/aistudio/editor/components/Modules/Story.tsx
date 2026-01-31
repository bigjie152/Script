import { BookOpenText } from "lucide-react";
import { DocumentEditor } from "@/editors/DocumentEditor";
import type { EditorDocument } from "@/types/editorDocument";
import type { MentionItem } from "@/editors/tiptap/mentionSuggestion";

interface StoryProps {
  document: EditorDocument;
  setDocument: (next: EditorDocument) => void;
  readOnly?: boolean;
  mentionItems?: MentionItem[];
  onMentionClick?: (item: MentionItem) => void;
  onOpenTruth?: () => void;
}

const Story: React.FC<StoryProps> = ({
  document,
  setDocument,
  readOnly = false,
  mentionItems = [],
  onMentionClick,
  onOpenTruth
}) => {
  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col gap-5 p-1">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpenText size={18} className="text-indigo-600" />
            复盘剧情（Story）
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            面向复盘与叙事呈现，关键叙事点请关联 Truth。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenTruth ? (
            <button
              type="button"
              onClick={onOpenTruth}
              className="px-3 py-1 rounded-full text-xs font-medium border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              查看 Truth
            </button>
          ) : null}
          {readOnly ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-rose-200 bg-rose-50 text-rose-700">
              只读模式
            </span>
          ) : null}
        </div>
      </section>

      <section className="flex-1 min-h-0">
        <div className="flex-1 rounded-xl border border-slate-100 bg-white overflow-hidden">
          <DocumentEditor
            value={document}
            onChange={setDocument}
            readonly={readOnly}
            mentionItems={mentionItems}
            onMentionClick={onMentionClick}
          />
        </div>
      </section>
    </div>
  );
};

export default Story;
