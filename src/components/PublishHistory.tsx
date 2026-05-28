import type { PublishRecord } from "../types/github";

interface PublishHistoryProps {
  records: PublishRecord[];
}

export default function PublishHistory({ records }: PublishHistoryProps) {
  if (records.length === 0) return null;

  return (
    <div className="bg-rts-panel border border-rts-border rounded-lg p-4 flex flex-col gap-2 max-h-48 overflow-y-auto">
      <span className="text-xs font-semibold text-rts-mute uppercase tracking-wider">
        发布历史
      </span>
      <div className="space-y-1.5">
        {records.slice(0, 6).map((r) => (
          <div key={r.id} className="flex items-start gap-2 text-[11px]">
            <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
            <div className="min-w-0">
              <div className="text-rts-text truncate">{r.title}</div>
              <div className="text-rts-mute truncate">
                {r.filename}
                <span className="mx-1">·</span>
                {r.publishedAt}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
