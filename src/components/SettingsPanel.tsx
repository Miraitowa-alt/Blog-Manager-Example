import { useState } from "react";

interface SettingsPanelProps {
  token: string;
  repo: string;
  branch: string;
  onTokenChange: (v: string) => void;
  onRepoChange: (v: string) => void;
  onBranchChange: (v: string) => void;
  testConnection: () => void;
  connectionStatus: "idle" | "testing" | "success" | "error";
  connectionMsg: string;
}

const TOKEN_PATTERNS = [/^ghp_/, /^github_pat_/, /^gho_/, /^ghu_/, /^ghs_/, /^ghr_/];

function validateToken(v: string): string | null {
  if (!v) return null;
  if (v.length < 10) return "Token 长度异常，请检查是否完整复制";
  if (!TOKEN_PATTERNS.some((p) => p.test(v))) return "Token 格式异常，应以 ghp_ 或 github_pat_ 开头";
  return null;
}

function validateRepo(v: string): string | null {
  if (!v) return null;
  if (!/^[\w.-]+\/[\w.-]+$/.test(v)) return "格式应为 owner/repo-name";
  if (v.split("/").length !== 2) return "格式应为 owner/repo-name（不含多余斜杠）";
  return null;
}

function validateBranch(v: string): string | null {
  if (!v) return "分支名不能为空";
  if (v.includes(" ")) return "分支名不能包含空格";
  if (v.length > 100) return "分支名过长";
  return null;
}

export default function SettingsPanel({
  token, repo, branch,
  onTokenChange, onRepoChange, onBranchChange,
  testConnection, connectionStatus, connectionMsg,
}: SettingsPanelProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const tokenErr = touched.token ? validateToken(token) : null;
  const repoErr = touched.repo ? validateRepo(repo) : null;
  const branchErr = touched.branch ? validateBranch(branch) : null;

  const mark = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  return (
    <div className="max-w-xl mx-auto bg-rts-panel border border-rts-border rounded-xl p-6 space-y-5 shadow-xl">
      <div>
        <h2 className="text-base font-semibold">GitHub API 对接凭证</h2>
        <p className="text-xs text-rts-mute mt-1">
          桌面端直连 GitHub 核心树状接口，无需本地 Git 环境。
        </p>
      </div>
      <hr className="border-rts-border" />

      <div className="space-y-4">
        {/* Token */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-rts-text">
            Personal Access Token (PAT)
          </label>
          <input
            type="password"
            placeholder="ghp_************************************"
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            onBlur={() => mark("token")}
            className={`w-full bg-rts-bg border rounded-lg px-3 py-2 text-sm text-mono focus:outline-none transition-colors ${
              tokenErr
                ? "border-red-500/60 focus:border-red-500"
                : "border-rts-border focus:border-rts-accent"
            }`}
          />
          {tokenErr && <span className="text-[11px] text-red-400/80">{tokenErr}</span>}
        </div>

        {/* Repo + Branch */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-rts-text">GitHub 仓库路径</label>
            <input
              type="text"
              placeholder="例如: username/repo-name"
              value={repo}
              onChange={(e) => onRepoChange(e.target.value)}
              onBlur={() => mark("repo")}
              className={`w-full bg-rts-bg border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${
                repoErr
                  ? "border-red-500/60 focus:border-red-500"
                  : "border-rts-border focus:border-rts-accent"
              }`}
            />
            {repoErr && <span className="text-[11px] text-red-400/80">{repoErr}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-rts-text">目标分支</label>
            <input
              type="text"
              placeholder="main"
              value={branch}
              onChange={(e) => onBranchChange(e.target.value)}
              onBlur={() => mark("branch")}
              className={`w-full bg-rts-bg border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${
                branchErr
                  ? "border-red-500/60 focus:border-red-500"
                  : "border-rts-border focus:border-rts-accent"
              }`}
            />
            {branchErr && <span className="text-[11px] text-red-400/80">{branchErr}</span>}
          </div>
        </div>

        {/* 连接测试 */}
        <div className="flex items-center gap-3">
          <button
            onClick={testConnection}
            disabled={connectionStatus === "testing"}
            className={`px-4 py-2 text-xs font-medium rounded-md border transition-all ${
              connectionStatus === "testing"
                ? "bg-rts-border border-rts-border text-rts-mute cursor-not-allowed"
                : connectionStatus === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : connectionStatus === "error"
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-rts-accent/10 border-rts-accent/30 text-rts-accent hover:bg-rts-accent/20"
            }`}
          >
            {connectionStatus === "testing" ? "⏳ 测试中..." : "🔌 测试连接"}
          </button>
          {connectionMsg && (
            <span className={`text-[11px] ${connectionStatus === "success" ? "text-emerald-400/80" : "text-red-400/80"}`}>
              {connectionMsg}
            </span>
          )}
        </div>
      </div>

      <div className="bg-rts-bg/50 border border-rts-border rounded-lg p-3 text-[11px] text-rts-mute leading-relaxed">
        💡 <strong>提示：</strong> 请确保你的 Token 至少拥有对目标仓库的{" "}
        <code>repo</code> 或 <code>contents</code> 的写入权限。
        本软件数据均保存在本地内存中，绝不会向第三方泄露。
      </div>
    </div>
  );
}
