import { useState, useEffect, useRef } from "react";
import type { SyncStatus } from "../types/github";
import type { PublishRecord } from "../types/github";
import type { ChangeEvent } from "react";
import type { SyncProgress, SyncPreviewData } from "../hooks/useGitHubSync";
import MarkdownPreview from "./MarkdownPreview";
import FrontmatterEditor from "./FrontmatterEditor";
import ConfirmDialog from "./ConfirmDialog";
import ShortcutHelp from "./ShortcutHelp";
import PublishHistory from "./PublishHistory";

interface EditorProps {
  title: string; setTitle: (v: string) => void;
  content: string; setContent: (v: string) => void;
  imagePreview: string | null;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setImageFileWithPreview: (file: File) => void;
  syncStatus: SyncStatus;
  syncProgress: SyncProgress | null;
  syncPreview: SyncPreviewData | null;
  cancelSync: () => void;
  confirmSync: () => void;
  logs: string[];
  history: PublishRecord[];
  // Frontmatter
  author: string; category: string; tags: string;
  description: string; publishDate: string;
  onFrontmatterChange: (field: string, value: string) => void;
  // Draft
  hasDraft: boolean;
  onRestoreDraft: () => void;
  onDiscardDraft: () => void;
  // Save
  saveDraftNow: () => void;
  saveIndicator: boolean;
}

export default function Editor({
  title, setTitle, content, setContent,
  imagePreview, handleImageChange, setImageFileWithPreview,
  syncStatus, syncProgress, syncPreview,
  cancelSync, confirmSync,
  logs, history,
  author, category, tags, description, publishDate,
  onFrontmatterChange,
  hasDraft, onRestoreDraft, onDiscardDraft,
  saveDraftNow, saveIndicator,
}: EditorProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+S → Save draft
      if (ctrl && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        saveDraftNow();
        return;
      }

      // Ctrl+Shift+P → Toggle preview
      if (ctrl && e.shiftKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        setPreviewMode((prev) => !prev);
        return;
      }

      // Ctrl+Shift+I → Trigger image upload
      if (ctrl && e.shiftKey && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        fileInputRef.current?.click();
        return;
      }

      // ? or Ctrl+/ → Shortcut help
      if (e.key === "?" || (ctrl && e.key === "/")) {
        e.preventDefault();
        setShowShortcutHelp((prev) => !prev);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveDraftNow]);

  // ── Paste image from clipboard ──
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) setImageFileWithPreview(file);
          return;
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [setImageFileWithPreview]);

  // ── Auto-scroll log to bottom ──
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // ── Drag & drop image upload ──
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; setDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setDragOver(false); } };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false); dragCounter.current = 0;
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) setImageFileWithPreview(file);
  };

  const showConfirm = syncPreview !== null;

  // ── Progress bar ──
  const isUploading = syncStatus === "uploading";

  return (
    <>
      {showConfirm && (
        <ConfirmDialog data={syncPreview!} onConfirm={confirmSync} onCancel={cancelSync} />
      )}
      {showShortcutHelp && <ShortcutHelp onClose={() => setShowShortcutHelp(false)} />}

      <div className="grid grid-cols-3 gap-6 h-full max-w-7xl mx-auto">
        {/* ─── Left: Editor / Preview ─── */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Progress indicator */}
          {isUploading && syncProgress && (
            <div className="bg-rts-panel border border-rts-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-rts-mute">{syncProgress.label}</span>
                <span className="text-[11px] text-rts-mute font-mono">
                  {syncProgress.stepIndex}/{syncProgress.totalSteps}
                </span>
              </div>
              <div className="w-full h-1.5 bg-rts-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-rts-accent rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(syncProgress.stepIndex / syncProgress.totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Draft restore banner */}
          {hasDraft && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2.5">
              <span className="text-xs text-amber-400/90">📄 检测到未发布的草稿，是否恢复？</span>
              <div className="flex gap-2">
                <button onClick={onRestoreDraft}
                  className="px-3 py-1 text-[11px] font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-md transition-colors">
                  恢复
                </button>
                <button onClick={onDiscardDraft}
                  className="px-3 py-1 text-[11px] font-medium bg-rts-border hover:bg-rts-border/80 text-rts-mute rounded-md transition-colors">
                  丢弃
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="请输入文章标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-rts-panel border border-rts-border rounded-lg px-4 py-3 text-base placeholder-rts-mute focus:outline-none focus:border-rts-accent transition-all"
            />
            {saveIndicator && (
              <span className="shrink-0 text-[11px] text-emerald-400/80 font-medium animate-pulse">
                已保存
              </span>
            )}
          </div>

          {/* Edit/Preview toggle */}
          <div className="flex gap-1 bg-rts-panel border border-rts-border rounded-lg p-0.5 w-fit">
            <button onClick={() => setPreviewMode(false)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                !previewMode ? "bg-rts-accent text-white shadow-sm" : "text-rts-mute hover:text-rts-text"
              }`}>
              编辑
            </button>
            <button onClick={() => setPreviewMode(true)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                previewMode ? "bg-rts-accent text-white shadow-sm" : "text-rts-mute hover:text-rts-text"
              }`}>
              预览
            </button>
          </div>

          {previewMode ? (
            <MarkdownPreview content={content} />
          ) : (
            <textarea
              placeholder="使用 Markdown 语法尽情书写你的灵感与内容...（Ctrl+V 可粘贴图片）"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 min-h-[350px] bg-rts-panel border border-rts-border rounded-lg p-4 text-sm placeholder-rts-mute focus:outline-none focus:border-rts-accent resize-none font-mono leading-relaxed transition-all"
            />
          )}
        </div>

        {/* ─── Right: Cover + Settings + History + Logs ─── */}
        <div className="flex flex-col gap-4">
          {/* Cover image upload */}
          <div className="bg-rts-panel border border-rts-border rounded-lg p-4 flex flex-col gap-3">
            <span className="text-xs font-semibold text-rts-mute uppercase tracking-wider">
              文章封面图
            </span>
            <label
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-40 border border-dashed rounded-lg cursor-pointer bg-rts-bg/30 overflow-hidden transition-all ${
                dragOver
                  ? "border-rts-accent bg-rts-accent/5"
                  : "border-rts-border hover:border-rts-accent"
              }`}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-rts-mute gap-2">
                  <span className="text-2xl">🖼️</span>
                  <span className="text-xs">拖拽 / 点击 / Ctrl+V 上传</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          {/* Frontmatter advanced settings */}
          <FrontmatterEditor
            author={author} category={category} tags={tags}
            description={description} publishDate={publishDate}
            onChange={onFrontmatterChange}
          />

          {/* Publish history */}
          <PublishHistory records={history} />

          {/* Sync logs */}
          <div className="flex-1 bg-rts-panel border border-rts-border rounded-lg p-4 flex flex-col gap-2 min-h-[140px]">
            <span className="text-xs font-semibold text-rts-mute uppercase tracking-wider">
              控制台实时日志
            </span>
            <div className="flex-1 bg-rts-bg/80 border border-rts-border rounded-md p-3 font-mono text-[11px] text-emerald-400/90 overflow-y-auto leading-normal space-y-1" ref={logRef}>
              {logs.length === 0 ? (
                <span className="text-rts-mute italic">暂无同步任务...</span>
              ) : (
                logs.map((log, i) => <div key={i} className="whitespace-pre-wrap">{log}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
