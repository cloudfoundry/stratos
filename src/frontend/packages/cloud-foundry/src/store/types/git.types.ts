
export interface GitRepo {
  pushed_at?: string;
  last_activity_at?: string;
  created_at: string;
  owner: GitUser;
  id: number;
  full_name: string;
  default_branch: string;
  description: string;
}

export interface GitUser {
  avatar_url: string;
  html_url: string;
  id: number;
  login: string;
}

export interface GitBranch {
  name: string;
  commit?: GitCommit;
  projectId?: string;
  entityId?: string;
}

export interface GitCommit {
  sha: string;
  author?: GitUser;
  committer?: GitUser;
  html_url?: string;
  commit?: {
    author: {
      date: string;
      email: string;
      name: string;
    };
    message: string;
  };
  guid?: string;
}

