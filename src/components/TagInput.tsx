import { useState, useRef } from "react";

interface TagInputProps {
  value: string;         // Comma-separated tag string
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = value
    ? value.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
    : [];

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/[,，]/g, "");
    if (!tag) return;
    if (tags.includes(tag)) return; // Deduplicate
    onChange([...tags, tag].join(", "));
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag).join(", "));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
      setInput("");
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 bg-rts-bg border border-rts-border rounded-md px-2 py-1.5 min-h-[30px] cursor-text focus-within:border-rts-accent transition-colors"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-rts-accent/15 text-rts-accent text-[11px] px-2 py-0.5 rounded-full"
        >
          {tag}
          <button
            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
            className="hover:text-white transition-colors leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? (placeholder || "输入后按回车添加") : ""}
        className="flex-1 min-w-[80px] bg-transparent text-xs text-rts-text outline-none placeholder-rts-mute"
      />
    </div>
  );
}
