import type { PublishRecord } from "../types/github";

interface ArticleManagerProps {
  history: PublishRecord[];
  onClear: () => void;
}

export default function ArticleManager({ history, onClear }: ArticleManagerProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-rts-mute gap-3">
        <span className="text-3xl">📭</span>
        <p className="text-sm">还没有发布过文章</p>
        <p className="text-xs">在编辑器中写好内容，点击「一键同步」发布</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-rts-text">已发布文章（共 {history.length} 篇）</h2>
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-[11px] font-medium rounded-md border border-red-500/30 text-red-400/80 hover:bg-red-500/10 transition-colors"
        >
          清空记录
        </button>
      </div>

      <div className="space-y-2">
        {history.map((r) => (
          <div
            key={r.id}
            className="bg-rts-panel border border-rts-border rounded-lg px-4 py-3 hover:border-rts-accent/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-rts-text truncate">{r.title}</h3>
                <p className="text-[11px] font-mono text-rts-mute mt-1 truncate">{r.filename}</p>
              </div>
              <span className="shrink-0 text-[11px] text-rts-mute">{r.publishedAt}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-rts-mute">
              {r.author && <span>作者: {r.author}</span>}
              {r.category && <span>分类: {r.category}</span>}
              {r.tags && <span>标签: {r.tags}</span>}
              <span className="ml-auto">{r.repo}:{r.branch}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
