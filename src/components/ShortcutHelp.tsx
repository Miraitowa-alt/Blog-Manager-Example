interface ShortcutHelpProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: "Ctrl + S", desc: "保存草稿" },
  { keys: "Ctrl + Shift + P", desc: "切换编辑 / 预览" },
  { keys: "Ctrl + Shift + I", desc: "上传封面图" },
  { keys: "Ctrl + V", desc: "粘贴图片" },
  { keys: "Ctrl + /", desc: "打开此面板" },
];

export default function ShortcutHelp({ onClose }: ShortcutHelpProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-rts-panel border border-rts-border rounded-xl shadow-2xl w-80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-rts-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-rts-text">快捷键</h2>
          <button onClick={onClose} className="text-rts-mute hover:text-rts-text text-sm leading-none">×</button>
        </div>
        <div className="px-5 py-3 space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-rts-mute">{s.desc}</span>
              <kbd className="text-[11px] font-mono bg-rts-bg border border-rts-border rounded px-2 py-0.5 text-rts-text">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-rts-border">
          <p className="text-[11px] text-rts-mute text-center">点击任意处关闭</p>
        </div>
      </div>
    </div>
  );
}
