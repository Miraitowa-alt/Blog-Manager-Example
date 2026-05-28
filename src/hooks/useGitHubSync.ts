import { useState, useEffect, useRef, useCallback } from "react";
import type {
  GitRefResponse,
  GitCommitResponse,
  GitBlobResponse,
  GitTreeResponse,
  GitCreateCommitResponse,
  GitTreeNode,
  SyncStatus,
  PublishRecord,
} from "../types/github";

// ── Constants ──
const DRAFT_KEY = "rts_draft";
const HISTORY_KEY = "rts_history";
const MAX_HISTORY = 20;

const SYNC_STEPS = [
  "获取分支引用",
  "解析 Commit",
  "构建 Markdown",
  "上传图片",
  "创建 Git 树",
  "创建 Commit",
  "推送分支",
] as const;

export interface SyncProgress {
  stepIndex: number;
  totalSteps: number;
  label: string;
}

export interface SyncPreviewData {
  title: string;
  author: string;
  category: string;
  tags: string;
  description: string;
  publishDate: string;
  repo: string;
  branch: string;
  filename: string;
  hasImage: boolean;
}

interface DraftData {
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string;
  description: string;
  publishDate: string;
  savedAt: number;
}

// ── Helpers ──
function todayStr() { return new Date().toISOString().split("T")[0]; }

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraftToLS(data: Partial<DraftData>) {
  const existing = loadDraft() ?? {
    title: "", content: "", author: "Admin",
    category: "", tags: "", description: "", publishDate: todayStr(),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...existing, ...data, savedAt: Date.now() }));
}

function clearDraftFromLS() { localStorage.removeItem(DRAFT_KEY); }

function loadHistory(): PublishRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(records: PublishRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, MAX_HISTORY)));
}

function computeFilename(title: string, publishDate: string): string {
  const dateStr = publishDate.replace(/-/g, "");
  const timestamp = Date.now().toString().slice(-6);
  const safe = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
  return safe ? `${dateStr}-${safe}.md` : `${dateStr}-${timestamp}.md`;
}

// ── Hook ──
export function useGitHubSync() {
  // 编辑器
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Track last-saved snapshot for derived dirty detection
  const lastSavedRef = useRef({ title: '', content: '' });
  const isDirty = title !== lastSavedRef.current.title || content !== lastSavedRef.current.content;

  // Frontmatter
  const [author, setAuthor] = useState("Admin");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [publishDate, setPublishDate] = useState(todayStr());

  // 草稿
  const [hasDraft, setHasDraft] = useState(() => !!loadDraft());

  // GitHub 配置
  const [token, setToken] = useState(() => localStorage.getItem("rts_gh_token") || "");
  const [repo, setRepo] = useState(() => localStorage.getItem("rts_gh_repo") || "");
  const [branch, setBranch] = useState(() => localStorage.getItem("rts_gh_branch") || "main");

  // 同步
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [syncPreview, setSyncPreview] = useState<SyncPreviewData | null>(null);

  // 发布历史
  const [history, setHistory] = useState<PublishRecord[]>(() => loadHistory());

  // ── Logger ──
  const addLog = useCallback((msg: string) =>
    setLogs((prev) => {
      const next = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
      return next.length > 500 ? next.slice(-500) : next;
    }), []);

  // ── Manual save (Ctrl+S) ──
  const [saveIndicator, setSaveIndicator] = useState(false);
  const saveDraftNow = useCallback(() => {
    saveDraftToLS({ title, content, author, category, tags, description, publishDate });
    setHasDraft(true);
    lastSavedRef.current = { title, content };
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 2000);
  }, [title, content, author, category, tags, description, publishDate]);

  // ── Release image object URL ──
  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  // ── Auto-save draft (debounced) ──
  useEffect(() => {
    if (!title && !content) return;
    const timer = setTimeout(() => {
      saveDraftToLS({ title, content, author, category, tags, description, publishDate });
      setHasDraft(true);
      lastSavedRef.current = { title, content };
    }, 2000);
    return () => clearTimeout(timer);
  }, [title, content, author, category, tags, description, publishDate]);

  // ── Draft management ──
  const restoreDraft = () => {
    const d = loadDraft();
    if (!d) return;
    setTitle(d.title); setContent(d.content);
    setAuthor(d.author || "Admin"); setCategory(d.category || "");
    setTags(d.tags || ""); setDescription(d.description || "");
    setPublishDate(d.publishDate || todayStr());
    setHasDraft(false);
    addLog("📄 已恢复上次未发布的草稿");
  };

  const discardDraft = () => { clearDraftFromLS(); setHasDraft(false); };

  // ── Image handling ──
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setImageFileWithPreview(e.target.files[0]);
  };

  const setImageFileWithPreview = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      addLog("❌ 图片超过 10MB 限制，请压缩后重试");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    addLog(`已选择图片: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
  };

  // ── Frontmatter ──
  const buildFrontmatter = (): string => {
    const lines = [
      "---",
      `title: "${title}"`,
      `description: "${description || title + " 的简要描述"}"`,
      `pubDate: "${publishDate}"`,
      `author: "${author || "Admin"}"`,
    ];
    if (category) lines.push(`category: "${category}"`);
    if (tags) {
      const arr = tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
      if (arr.length) lines.push(`tags: [${arr.map(t => `"${t}"`).join(", ")}]`);
    }
    if (imageFile) lines.push(`image: "../../assets/${imageFile.name}"`);
    lines.push("---", "");
    return lines.join("\n");
  };

  // ── Confirm & publish flow ──
  const prepareSync = () => {
    if (!token || !repo || !title || !content) {
      alert("请确保文章标题、内容以及设置中的 GitHub Token、仓库名已全部填写！");
      return;
    }
    setSyncPreview({
      title, author, category, tags, description, publishDate,
      repo, branch, filename: computeFilename(title, publishDate), hasImage: !!imageFile,
    });
  };

  const cancelSync = () => setSyncPreview(null);

  const confirmSync = async () => {
    setSyncPreview(null);
    setSyncStatus("uploading");
    setLogs([]);
    setSyncProgress(null);
    addLog("🚀 开始一键同步流程...");

    try {
      // Step 1
      advanceStep(1);
      addLog("正在获取主分支最新 Commit 指针...");
      const refRes = await fetch(
        `https://api.github.com/repos/${repo}/git/ref/heads/${branch}`,
        { headers: { Authorization: `token ${token}` } },
      );
      if (!refRes.ok) throw new Error(`获取分支引用失败 (${refRes.status})`);
      const refData: GitRefResponse = await refRes.json();
      const lastCommitSha = refData.object.sha;

      // Step 2
      advanceStep(2);
      addLog("正在解析最新 Commit 树状结构...");
      const commitRes = await fetch(
        `https://api.github.com/repos/${repo}/git/commits/${lastCommitSha}`,
        { headers: { Authorization: `token ${token}` } },
      );
      if (!commitRes.ok) throw new Error(`获取 Commit 失败 (${commitRes.status})`);
      const commitData: GitCommitResponse = await commitRes.json();
      const baseTreeSha = commitData.tree.sha;

      // Build nodes
      const treeNodes: GitTreeNode[] = [];
      const cleanFileName = computeFilename(title, publishDate);
      const fullMarkdown = buildFrontmatter() + content;

      // Step 3
      advanceStep(3);
      treeNodes.push({
        path: `src/content/blog/${cleanFileName}`,
        mode: "100644", type: "blob", content: fullMarkdown,
      });
      addLog(`Markdown 节点构建成功: ${cleanFileName}`);

      // Step 4 (conditional)
      if (imageFile) {
        advanceStep(4);
        addLog("正在转换图片为 Base64 格式...");
        const base64Content = await fileToBase64(imageFile);
        addLog("正在向 GitHub 远程创建图片 Blob...");
        const blobRes = await fetch(
          `https://api.github.com/repos/${repo}/git/blobs`,
          {
            method: "POST",
            headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ content: base64Content, encoding: "base64" }),
          },
        );
        if (!blobRes.ok) throw new Error(`创建 Blob 失败 (${blobRes.status})`);
        const blobData: GitBlobResponse = await blobRes.json();
        treeNodes.push({
          path: `src/assets/${imageFile.name}`,
          mode: "100644", type: "blob", sha: blobData.sha,
        });
        addLog(`图片 Blob 已挂载: src/assets/${imageFile.name}`);
        advanceStep(5); // image step counts as step 4, so tree is 5
      } else {
        // No image → step 4 becomes tree
        advanceStep(4, 6);
      }

      // Step 5 or 4 (create tree)
      if (!imageFile) {
        addLog("正在生成远程 Git 树状结构...");
      }
      const createTreeRes = await fetch(
        `https://api.github.com/repos/${repo}/git/trees`,
        {
          method: "POST",
          headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ base_tree: baseTreeSha, tree: treeNodes }),
        },
      );
      if (!createTreeRes.ok) throw new Error(`创建 Tree 失败 (${createTreeRes.status})`);
      const createTreeData: GitTreeResponse = await createTreeRes.json();
      const newTreeSha = createTreeData.sha;

      // Step 6 or 5
      advanceStep(imageFile ? 6 : 5);
      addLog("正在封装 Commit 提交信息...");
      const createCommitRes = await fetch(
        `https://api.github.com/repos/${repo}/git/commits`,
        {
          method: "POST",
          headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `feat(cms): auto publish "${title}" via Blog Manager`,
            tree: newTreeSha, parents: [lastCommitSha],
          }),
        },
      );
      if (!createCommitRes.ok) throw new Error(`创建 Commit 失败 (${createCommitRes.status})`);
      const createCommitData: GitCreateCommitResponse = await createCommitRes.json();
      const newCommitSha = createCommitData.sha;

      // Step 7 or 6
      advanceStep(imageFile ? 7 : 6);
      addLog("正在将指针推送到 GitHub 远程分支...");
      const patchRes = await fetch(
        `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,
        {
          method: "PATCH",
          headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ sha: newCommitSha, force: false }),
        },
      );
      if (!patchRes.ok) throw new Error(`更新分支指针失败 (${patchRes.status})`);

      // Done
      clearDraftFromLS(); setHasDraft(false);
      setSyncStatus("success"); setSyncProgress(null);
      addLog("🎉 完美！数据已无缝同步至网站仓库，Astro 自动化构建已触发！");

      // Save to history
      const record: PublishRecord = {
        id: crypto.randomUUID(),
        title, filename: cleanFileName,
        publishedAt: new Date().toLocaleString("zh-CN"),
        author, category, tags, repo, branch,
      };
      setHistory((prev) => {
        const next = [record, ...prev].slice(0, MAX_HISTORY);
        saveHistory(next);
        return next;
      });

    } catch (err) {
      console.error(err);
      setSyncStatus("error"); setSyncProgress(null);
      const msg = err instanceof Error ? err.message : "未知错误";
      addLog(`❌ 同步失败: ${msg}`);
    }
  };

  const advanceStep = (step: number, totalOverride?: number) => {
    const total = totalOverride ?? (imageFile ? 7 : 6);
    const label = SYNC_STEPS[Math.min(step - 1, SYNC_STEPS.length - 1)];
    setSyncProgress({ stepIndex: step, totalSteps: total, label });
  };

  // ── Persist config ──
  const persistToken = (v: string) => { setToken(v); localStorage.setItem("rts_gh_token", v); };
  const persistRepo = (v: string) => { setRepo(v); localStorage.setItem("rts_gh_repo", v); };
  const persistBranch = (v: string) => { setBranch(v); localStorage.setItem("rts_gh_branch", v); };

  // ── Connection test ──
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionMsg, setConnectionMsg] = useState("");
  const testConnection = async () => {
    if (!token || !repo) { setConnectionStatus("error"); setConnectionMsg("请先填写 Token 和仓库路径"); return; }
    setConnectionStatus("testing"); setConnectionMsg("正在验证...");
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { Authorization: `token ${token}` },
      });
      const data = await res.json();
      if (res.ok) { setConnectionStatus("success"); setConnectionMsg(`✅ ${data.full_name} · ${data.visibility} 仓库`); }
      else if (res.status === 401) { setConnectionStatus("error"); setConnectionMsg("Token 无效或被撤销"); }
      else if (res.status === 404) { setConnectionStatus("error"); setConnectionMsg("仓库不存在或 Token 无权限"); }
      else { setConnectionStatus("error"); setConnectionMsg(`请求异常 (${res.status})`); }
    } catch { setConnectionStatus("error"); setConnectionMsg("网络请求失败"); }
  };

  // ── 清除历史 ──
  const clearHistory = () => { localStorage.removeItem(HISTORY_KEY); setHistory([]); };

  // ── Clear editor (after publish) ──
  const clearEditor = () => {
    setTitle(""); setContent(""); setImageFile(null);
    setImagePreview(null); setAuthor("Admin"); setCategory("");
    setTags(""); setDescription(""); setPublishDate(todayStr());
    clearDraftFromLS(); setHasDraft(false);
    lastSavedRef.current = { title: '', content: '' };
  };

  return {
    title, setTitle, content, setContent,
    imageFile, imagePreview, handleImageChange, setImageFileWithPreview,
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
  };
}

// ── Utilities ──
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) resolve((reader.result as string).split(",")[1]);
      else reject(new Error("文件读取结果为空"));
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}
