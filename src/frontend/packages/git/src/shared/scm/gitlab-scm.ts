import { type HttpClient, HttpErrorResponse } from '@angular/common/http';
import { combineLatest, type Observable, of as observableOf, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Md5 } from 'ts-md5';

import type { GitBranch, GitCommit, GitRepo, GitSuggestedRepo } from '../../store/git.public-types';
import type { GitSCM, SCMIcon } from './scm';
import { BaseSCM, type GitApiRequest } from './scm-base';
import type { GitSCMType } from './scm.service';

const gitLabAPIUrl = 'https://gitlab.com/api/v4';
const GITLAB_PER_PAGE_PARAM = 'per_page';
const GITLAB_PER_PAGE_PARAM_VALUE = 100;

export class GitLabSCM extends BaseSCM implements GitSCM {

  constructor(endpointGuid: string) {
    super(gitLabAPIUrl);
    this.endpointGuid = endpointGuid;
  }

  getType(): GitSCMType {
    return 'gitlab';
  }

  getLabel(): string {
    return 'GitLab';
  }

  getIcon(): SCMIcon {
    return {
      iconName: 'gitlab',
      fontName: 'stratos-icons'
    };
  }

  getRepository(httpClient: HttpClient, projectName: string): Observable<GitRepo> {
    const parts = projectName.split('/');

    const obs$ = parts.length !== 2 ?
      observableOf(null) :
      this.getAPI().pipe(switchMap(api => httpClient.get(`${api.url}/projects/${parts.join('%2F')}`, api.requestArgs)));

    return obs$.pipe(
      map((data: unknown) => {
        if (!data) {
          throw new HttpErrorResponse({
            status: 404
          });
        }
        return this.convertProject(data);
      })
    );
  }

  getBranch(httpClient: HttpClient, projectName: string, branchName: string): Observable<GitBranch> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return this.getAPI().pipe(
      switchMap(api => httpClient.get(`${api.url}/projects/${prjNameEncoded}/repository/branches/${branchName}`, api.requestArgs)),
      map((data: unknown) => {
        const branch = data as { commit: { id: string; sha?: string } };
        const nb = { ...branch };
        nb.commit.sha = nb.commit.id;
        return nb as unknown as GitBranch;
      })
    );
  }

  getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return this.getAPI().pipe(
      switchMap(api => httpClient.get(
        `${api.url}/projects/${prjNameEncoded}/repository/branches`, {
        ...api.requestArgs,
        params: {
          ...api.requestArgs.params,
          [GITLAB_PER_PAGE_PARAM]: GITLAB_PER_PAGE_PARAM_VALUE.toString()
        }
      })),
      map((data: unknown) => {
        const branches: GitBranch[] = [];
        const branchData = data as Array<{ commit: { id: string; sha?: string } }>;
        branchData.forEach((b: { commit: { id: string; sha?: string } }) => {
          const nb = { ...b };
          nb.commit.sha = b.commit.id;
          branches.push(nb as unknown as GitBranch);
        });
        return branches;
      })
    );
  }

  getCommit(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit> {
    return this.getCommitApi(projectName, commitSha).pipe(
      switchMap(commit => httpClient.get(commit.url, commit.requestArgs)),
      map(data => this.convertCommit(data)),
    );
  }

  getCommitApi(projectName: string, commitSha: string): Observable<GitApiRequest> {
    return this.getAPI().pipe(
      map(api => {
        const prjNameEncoded = encodeURIComponent(projectName);
        return {
          ...api,
          url: `${api.url}/projects/${prjNameEncoded}/repository/commits/${commitSha}`
        };
      })
    );
  }

  getCommits(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit[]> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return this.getAPI().pipe(
      switchMap(api => httpClient.get(
        `${api.url}/projects/${prjNameEncoded}/repository/commits?ref_name=${commitSha}`, {
        ...api.requestArgs,
        params: {
          [GITLAB_PER_PAGE_PARAM]: GITLAB_PER_PAGE_PARAM_VALUE.toString()
        }
      })),
      map((data: unknown) => {
        const commitData = data as unknown[];
        return commitData.map((c: unknown) => this.convertCommit(c));
      })
    );
  }

  getCompareCommitURL(projectUrl: string, commitSha1: string, commitSha2: string): string {
    return `${projectUrl}/compare/${commitSha1}...${commitSha2}`;
  }

  getMatchingRepositories(httpClient: HttpClient, projectName: string): Observable<GitSuggestedRepo[]> {
    const prjParts = projectName.split('/');

    const obs$: Observable<GitRepo[]> = prjParts.length > 1 ?
      this.getMatchingUserGroupRepositories(httpClient, prjParts) :
      this.getMatchingProjects(httpClient, projectName);

    return obs$.pipe(
      map(repos => repos.map(item => ({ name: item.full_name, private: item.private })))
    );
  }

  private getMatchingUserGroupRepositories(httpClient: HttpClient, prjParts: string[]): Observable<GitRepo[]> {
    return this.getAPI().pipe(
      switchMap(api => combineLatest([
        httpClient.get<[]>(`${api.url}/users/${prjParts[0]}/projects/?search=${prjParts[1]}`, api.requestArgs).pipe(
          catchError(() => of([]))
        ),
        httpClient.get<[]>(`${api.url}/groups/${prjParts[0]}/projects?search=${prjParts[1]}`, api.requestArgs).pipe(
          catchError(() => of([]))
        ),
      ])),
      map(([a, b]: [unknown[], unknown[]]) => a.concat(b).map((prj: unknown) => this.convertProject(prj))),
    );
  }

  private getMatchingProjects(httpClient: HttpClient, exactProjectName: string): Observable<GitRepo[]> {
    return this.getAPI().pipe(
      switchMap(api => httpClient.get(`${api.url}/projects?search=${exactProjectName}`, {
        ...api.requestArgs,
        params: {
          [GITLAB_PER_PAGE_PARAM]: GITLAB_PER_PAGE_PARAM_VALUE.toString()
        }
      })),
      map((projects: unknown) => (projects as unknown[]).map((prj: unknown) => this.convertProject(prj)))
    );
  }

  private convertProject(prj: unknown): GitRepo {
    const project = prj as {
      path_with_namespace: string;
      description?: string;
      name_with_namespace: string;
      web_url: string;
      namespace: { name: string };
      avatar_url?: string;
      http_url_to_repo: string;
      visibility?: string;
    };
    return {
      ...project,
      full_name: project.path_with_namespace,
      description: project.description || project.name_with_namespace,
      html_url: project.web_url,
      owner: {
        name: project.namespace.name,
        avatar_url: project.avatar_url || '/core/assets/gitlab-logo.svg'
      },
      clone_url: project.http_url_to_repo,
      // visibility is undefined if not using PAT (everything is public). if PAT is used then values include public, private and internal
      private: project.visibility !== undefined && project.visibility !== 'public'
    } as unknown as GitRepo;
  }

  public convertCommit(commit: unknown): GitCommit {
    const commitData = commit as {
      author_email: string;
      web_url: string;
      created_at: string;
      author_name: string;
      message: string;
      id: string;
      guid?: string;
      projectName?: string;
      scmType?: string;
    };
    const emailMD5 = Md5.hashStr(commitData.author_email);
    const avatarURL = `https://secure.gravatar.com/avatar/${emailMD5}?s=120&d=identicon`;

    return {
      html_url: commitData.web_url,
      author: {
        id: null,
        login: null,
        avatar_url: avatarURL,
        html_url: null
      },
      commit: {
        author: {
          date: commitData.created_at,
          name: commitData.author_name,
          email: commitData.author_email
        },
        message: commitData.message,
      },
      sha: commitData.id,
      guid: commitData.guid,
      projectName: commitData.projectName,
      scmType: commitData.scmType,
      endpointGuid: null,
    };
  }

  parseErrorAsString(error: unknown): string {
    const errorResponse = error as { status?: number };
    return `Git request failed${errorResponse.status ? `(${errorResponse.status})` : ''}`;
  }

}
