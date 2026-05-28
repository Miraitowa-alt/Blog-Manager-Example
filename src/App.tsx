import { useState, useEffect } from "react";
import { useGitHubSync } from "./hooks/useGitHubSync";
import Editor from "./components/Editor";
import SettingsPanel from "./components/SettingsPanel";
import ArticleManager from "./components/ArticleManager";

type Tab = "edit" | "manage" | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("edit");

  const {
    title, setTitle, content, setContent,
    imagePreview, handleImageChange, setImageFileWithPreview,
    author, setAuthor, category, setCategory,
    tags, setTags, description, setDescription, publishDate, setPublishDate,
    hasDraft, restoreDraft, discardDraft,
    token, repo, branch,
    persistToken, persistRepo, persistBranch,
    syncStatus, syncProgress,
    syncPreview, prepareSync, cancelSync, confirmSync,
    logs, history, clearEditor, saveDraftNow, saveIndicator,
    isDirty,
    testConnection, connectionStatus, connectionMsg,
    clearHistory,
  } = useGitHubSync();

  // ── Unsaved content warning on close ──
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleFrontmatterChange = (field: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      author: setAuthor, category: setCategory, tags: setTags,
      description: setDescription, publishDate: setPublishDate,
    };
    setters[field]?.(value);
  };

  const tabTitle = { edit: "Content Editor / 新建文章", manage: "Article Manager / 文章管理", settings: "System Settings / 凭证配置" } as const;

  return (
    <div className="flex h-screen w-screen bg-rts-bg text-rts-text font-sans antialiased overflow-hidden">
      {/* Left sidebar */}
      <div className="flex flex-col items-center justify-between w-16 bg-rts-panel border-r border-rts-border py-4 shrink-0">
        <div className="flex flex-col items-center gap-5 w-full">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rts-accent/10 border border-rts-accent/30 text-rts-accent font-bold text-sm">
            CMS
          </div>
          <NavBtn tab="edit" active={activeTab} icon="✍️" label="编辑器" onSelect={setActiveTab} />
          <NavBtn tab="manage" active={activeTab} icon="📋" label="管理" onSelect={setActiveTab} />
          <NavBtn tab="settings" active={activeTab} icon="⚙️" label="设置" onSelect={setActiveTab} />
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
      </div>

      {/* Right main workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-rts-bg">
        {/* Top bar */}
        <div className="h-14 border-b border-rts-border flex items-center justify-between px-6 shrink-0 bg-rts-panel/50 backdrop-blur-md">
          <h1 className="text-sm font-semibold tracking-wider text-rts-text uppercase">{tabTitle[activeTab]}</h1>
          <div className="flex items-center gap-3">
            {activeTab === "edit" && syncStatus === "success" && (
              <button onClick={clearEditor}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-rts-border text-rts-mute hover:text-rts-text transition-colors">
                新建文章
              </button>
            )}
            {activeTab === "edit" && (
              <button onClick={prepareSync} disabled={syncStatus === "uploading"}
                className={`px-4 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  syncStatus === "uploading" ? "bg-rts-border border-rts-border text-rts-mute cursor-not-allowed animate-pulse"
                  : syncStatus === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : syncStatus === "error" ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-rts-accent hover:bg-rts-accent/90 border-rts-accent text-white shadow-md shadow-rts-accent/10"
                }`}>
                {syncStatus === "uploading" ? "⚡ 正在同步..." : syncStatus === "success" ? "✅ 已发布" : syncStatus === "error" ? "❌ 重试" : "🚀 一键同步"}
              </button>
            )}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "edit" ? (
            <Editor
              title={title} setTitle={setTitle} content={content} setContent={setContent}
              imagePreview={imagePreview} handleImageChange={handleImageChange} setImageFileWithPreview={setImageFileWithPreview}
              syncStatus={syncStatus} syncProgress={syncProgress} syncPreview={syncPreview}
              prepareSync={prepareSync} cancelSync={cancelSync} confirmSync={confirmSync}
              logs={logs} history={history}
              author={author} category={category} tags={tags}
              description={description} publishDate={publishDate}
              onFrontmatterChange={handleFrontmatterChange}
              hasDraft={hasDraft} onRestoreDraft={restoreDraft} onDiscardDraft={discardDraft}
              saveDraftNow={saveDraftNow} saveIndicator={saveIndicator}
            />
          ) : activeTab === "manage" ? (
            <ArticleManager history={history} onClear={clearHistory} />
          ) : (
            <SettingsPanel
              token={token} repo={repo} branch={branch}
              onTokenChange={persistToken} onRepoChange={persistRepo} onBranchChange={persistBranch}
              testConnection={testConnection} connectionStatus={connectionStatus} connectionMsg={connectionMsg}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Sidebar navigation button */
function NavBtn({ tab, active, icon, label, onSelect }: {
  tab: Tab; active: Tab; icon: string; label: string; onSelect: (t: Tab) => void;
}) {
  return (
    <button
      onClick={() => onSelect(tab)}
      className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
        active === tab
          ? "bg-rts-accent text-white shadow-lg shadow-rts-accent/20"
          : "text-rts-mute hover:bg-rts-border hover:text-rts-text"
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}
