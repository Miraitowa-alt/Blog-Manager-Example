/** Type definitions for GitHub Git Data API */

// Response from getting a branch reference
export interface GitRefResponse {
  ref: string;
  node_id: string;
  url: string;
  object: {
    sha: string;
    type: string;
    url: string;
  };
}

// Response from getting a commit
export interface GitCommitResponse {
  sha: string;
  node_id: string;
  url: string;
  tree: {
    sha: string;
    url: string;
  };
}

// Request / response for creating a blob
export interface GitBlobResponse {
  sha: string;
  url: string;
}

// Tree node
export interface GitTreeNode {
  path: string;
  mode: "100644" | "100755" | "040000" | "160000" | "120000";
  type: "blob" | "tree" | "commit";
  /** Pass ``content`` for new files, ``sha`` for existing files */
  content?: string;
  sha?: string;
}

// Response from creating a tree
export interface GitTreeResponse {
  sha: string;
  url: string;
  tree: Array<{
    path: string;
    mode: string;
    type: string;
    sha: string;
    size?: number;
    url: string;
  }>;
}

// Response from creating a commit
export interface GitCreateCommitResponse {
  sha: string;
  node_id: string;
  url: string;
}

// Sync status
export type SyncStatus = "idle" | "uploading" | "success" | "error";

// Publish history record
export interface PublishRecord {
  id: string;
  title: string;
  filename: string;
  publishedAt: string;
  author: string;
  category: string;
  tags: string;
  repo: string;
  branch: string;
}
