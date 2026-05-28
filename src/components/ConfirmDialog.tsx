import { useState } from "react";
import type { SyncPreviewData } from "../hooks/useGitHubSync";

interface ConfirmDialogProps {
  data: SyncPreviewData;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ data, onConfirm, onCancel }: ConfirmDialogProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-rts-panel border border-rts-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-rts-border">
          <h2 className="text-sm font-semibold text-rts-text">确认发布</h2>
          <p className="text-[11px] text-rts-mute mt-0.5">请仔细核对以下内容</p>
        </div>

        {/* Content summary */}
        <div className="px-5 py-4 space-y-2.5 text-xs max-h-64 overflow-y-auto">
          <Row label="标题" value={data.title} />
          <Row label="作者" value={data.author || "Admin"} />
          {data.category && <Row label="分类" value={data.category} />}
          {data.tags && <Row label="标签" value={data.tags} />}
          {data.description && <Row label="描述" value={data.description} />}
          <Row label="发布日期" value={data.publishDate} />
          <div className="border-t border-rts-border my-2" />
          <Row label="目标仓库" value={data.repo} />
          <Row label="目标分支" value={data.branch} />
          <Row label="文件名" value={data.filename} mono />
          <Row label="含封面图" value={data.hasImage ? "是" : "否"} />
        </div>

        {/* Double confirmation checkbox */}
        <div className="px-5 py-3 border-t border-rts-border bg-rts-bg/50">
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded border-rts-border bg-rts-bg accent-rts-accent cursor-pointer"
            />
            <span className="text-[11px] text-rts-mute leading-relaxed group-hover:text-rts-text transition-colors">
              我已确认内容无误，将提交至 <code className="text-rts-accent">{data.repo}</code> 的 <code className="text-rts-accent">{data.branch}</code> 分支
            </span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="px-5 py-3 border-t border-rts-border flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium rounded-md bg-rts-border hover:bg-rts-border/80 text-rts-mute transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={!checked}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
              checked
                ? "bg-rts-accent hover:bg-rts-accent/90 text-white shadow-sm"
                : "bg-rts-border text-rts-mute/50 cursor-not-allowed"
            }`}
          >
            确认发布
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-rts-mute w-16 shrink-0">{label}</span>
      <span className={`text-rts-text ${mono ? "font-mono text-[11px]" : ""} break-all`}>
        {value}
      </span>
    </div>
  );
}
