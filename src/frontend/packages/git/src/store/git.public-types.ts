export interface GitEntity {
  guid: string;
  endpointGuid: string;
  scmType: string;
}

export interface GitRepo extends GitEntity {
  pushed_at?: string;
  last_activity_at?: string;
  created_at: string;
  owner: GitUser;
  id: number;
  full_name: string;
  default_branch: string;
  description: string;
  projectName: string;
  private: boolean;
  clone_url: string;
  html_url: string;
}

export interface GitSuggestedRepo {
  name: string;
  private: boolean;
}

export interface GitUser {
  avatar_url: string;
  html_url: string;
  id: number;
  login: string;
}

export interface GitBranch extends GitEntity {
  name: string;
  commit?: GitCommit;
  projectName: string;
}

export interface GitCommit extends GitEntity {
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
  projectName: string;
}
