import { schema } from 'normalizr';

import { GITHUB_BRANCHES_ENTITY_KEY, GITHUB_COMMIT_ENTITY_KEY } from './deploy-application.types';

export const GITHUB_REPO_ENTITY_KEY = 'githubRepo';

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

export interface GitBranch {
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

export const GithubRepoSchema = new schema.Entity(GITHUB_REPO_ENTITY_KEY);
export const GithubCommitSchema = new schema.Entity(GITHUB_COMMIT_ENTITY_KEY);
export const GithubBranchSchema = new schema.Entity(GITHUB_BRANCHES_ENTITY_KEY);
export const GithubBranchesSchema = new schema.Array(GithubBranchSchema);
