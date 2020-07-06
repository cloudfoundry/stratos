export interface GithubRepo {
  pushed_at: string;
  created_at: string;
  owner: GithubUser;
  id: number;
  full_name: string;
  default_branch: string;
  description: string;
}

export interface GithubUser {
  avatar_url: string;
  html_url: string;
  id: number;
  login: string;
  type: string;
}

export interface GitHubBranch {
  name: string;
  commit?: GithubCommit;
}

export interface GithubCommit {
  sha: string;
  url: string;
  author?: GithubUser;
  committer?: GithubUser;
  html_url?: string;
  commit?: {
    author: {
      date: string;
      email: string;
      name: string;
    };
    message: string;
  };
}

