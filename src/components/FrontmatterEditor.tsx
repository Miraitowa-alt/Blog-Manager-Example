import { useState } from "react";
import TagInput from "./TagInput";

interface FrontmatterEditorProps {
  author: string;
  category: string;
  tags: string;
  description: string;
  publishDate: string;
  onChange: (field: string, value: string) => void;
}

export default function FrontmatterEditor({
  author, category, tags, description, publishDate, onChange,
}: FrontmatterEditorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-rts-panel border border-rts-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-rts-mute uppercase tracking-wider hover:text-rts-text transition-colors"
      >
        <span>高级设置</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-rts-border pt-3">
          {/* Author */}
          <Field label="作者">
            <input
              type="text"
              placeholder="Admin"
              value={author}
              onChange={(e) => onChange("author", e.target.value)}
              className="w-full bg-rts-bg border border-rts-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-rts-accent"
            />
          </Field>

          {/* Category */}
          <Field label="分类">
            <input
              type="text"
              placeholder="例如: 技术、生活"
              value={category}
              onChange={(e) => onChange("category", e.target.value)}
              className="w-full bg-rts-bg border border-rts-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-rts-accent"
            />
          </Field>

          {/* Tags */}
          <Field label="标签">
            <TagInput
              value={tags}
              onChange={(v) => onChange("tags", v)}
              placeholder="输入标签后按回车添加"
            />
          </Field>

          {/* Description */}
          <Field label="描述">
            <input
              type="text"
              placeholder="文章摘要，为空则自动使用标题"
              value={description}
              onChange={(e) => onChange("description", e.target.value)}
              className="w-full bg-rts-bg border border-rts-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-rts-accent"
            />
          </Field>

          {/* Publish date */}
          <Field label="发布日期">
            <input
              type="date"
              value={publishDate}
              onChange={(e) => onChange("publishDate", e.target.value)}
              className="w-full bg-rts-bg border border-rts-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-rts-accent text-rts-text"
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-rts-mute">{label}</label>
      {children}
    </div>
  );
}
