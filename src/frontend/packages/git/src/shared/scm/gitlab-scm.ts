import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injector } from '@angular/core';
import { EndpointsDataService } from '@stratosui/store';
import { combineLatest, Observable, of as observableOf, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Md5 } from 'ts-md5';

import { HttpOptions } from '../../../../core/src/core/core.types';
import { GitBranch, GitCommit, GitRepo, GitSuggestedRepo } from '../../store/git.public-types';
import { GitSCM, SCMIcon } from './scm';
import { BaseSCM, GitApiRequest } from './scm-base';
import { GitSCMType } from './scm.service';

const gitLabAPIUrl = 'https://gitlab.com/api/v4';
const GITLAB_PER_PAGE_PARAM = 'per_page';
const GITLAB_PER_PAGE_PARAM_VALUE = 100;

export class GitLabSCM extends BaseSCM implements GitSCM {

  // Optional per-request options carrying an Authorization header when a PAT
  // has been supplied (Private/Enterprise mode). Mirrors GitHubSCM so the
  // token reaches every GitLab API call — without this GitLab lookups were
  // always unauthenticated and private/self-hosted projects 404'd.
  private options?: HttpOptions;

  constructor(
    endpointGuid: string,
    accessToken?: string,
    endpointsData?: EndpointsDataService,
    injector?: Injector,
  ) {
    super(gitLabAPIUrl);
    this.endpointGuid = endpointGuid;
    this.endpointsData = endpointsData;
    this.injector = injector;
    if (accessToken && accessToken.trim() !== '') {
      this.setAccessToken(accessToken);
    }
  }

  // GitLab's REST API accepts a PAT via the Authorization: Bearer header
  // (equivalent to the PRIVATE-TOKEN header). Match GitHubSCM's shape.
  setAccessToken(token: string) {
    this.options = new HttpOptions();
    this.options.headers = { Authorization: `Bearer ${token}` };
  }

  clearAccessToken() {
    if (this.options) {
      this.options.headers = {};
    }
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

    // GitLab projects can live in nested subgroups
    // (group/subgroup/.../project), so any path with at least a namespace and
    // a project (>= 2 segments) is valid. The full path is URL-encoded whole
    // (cloud-gov/platform/rag-demo -> cloud-gov%2Fplatform%2Frag-demo) as
    // GitLab's "project ID or URL-encoded path" API expects.
    const obs$: Observable<unknown> = parts.length < 2 ?
      observableOf(null) :
      this.getAPI(this.options).pipe(
        switchMap(api => httpClient.get(`${api.url}/projects/${encodeURIComponent(projectName)}`, api.requestArgs)));

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
    return this.getAPI(this.options).pipe(
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
    return this.getAPI(this.options).pipe(
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
    return this.getAPI(this.options).pipe(
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
    return this.getAPI(this.options).pipe(
      switchMap(api => httpClient.get(
        `${api.url}/projects/${prjNameEncoded}/repository/commits?ref_name=${commitSha}`, {
        ...api.requestArgs,
        params: {
          [GITLAB_PER_PAGE_PARAM]: GITLAB_PER_PAGE_PARAM_VALUE.toString()
        }
      })),
      map((data: unknown) => {
        const commits: GitCommit[] = [];
        const commitData = data as unknown[];
        commitData.forEach((c: unknown) => commits.push(this.convertCommit(c)));
        return commits;
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
    // The last segment is the (partial) project name being searched; every
    // segment before it forms the namespace, which for nested subgroups is
    // itself a slash-joined path (e.g. cloud-gov/platform). URL-encode the
    // whole namespace so the subgroup separator survives as %2F. A user
    // namespace is always a single segment, so only attempt the /users lookup
    // when there's exactly one namespace segment — otherwise it 404s with
    // "User Not Found" (a group path is not a user).
    // The search term is user input going into a query string, so it is
    // encoded too — an unescaped & or # would truncate the parameter and a
    // space would produce an invalid URL.
    const search = encodeURIComponent(prjParts[prjParts.length - 1]);
    const namespaceParts = prjParts.slice(0, -1);
    const namespace = encodeURIComponent(namespaceParts.join('/'));
    const isUserNamespace = namespaceParts.length === 1;

    return this.getAPI(this.options).pipe(
      switchMap(api => combineLatest([
        isUserNamespace ?
          httpClient.get<[]>(`${api.url}/users/${namespace}/projects/?search=${search}`, api.requestArgs).pipe(
            catchError(() => of([]))
          ) :
          of([] as []),
        httpClient.get<[]>(`${api.url}/groups/${namespace}/projects?search=${search}&include_subgroups=true`, api.requestArgs).pipe(
          catchError(() => of([]))
        ),
      ])),
      map(([a, b]: [unknown[], unknown[]]) => a.concat(b).map((prj: unknown) => this.convertProject(prj))),
    );
  }

  private getMatchingProjects(httpClient: HttpClient, exactProjectName: string): Observable<GitRepo[]> {
    return this.getAPI(this.options).pipe(
      switchMap(api => httpClient.get(`${api.url}/projects?search=${encodeURIComponent(exactProjectName)}`, {
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
      // strict: GitLab commits carry no GitHub-style user identity (id/login/
      // html_url are null) and the endpointGuid is backfilled later by the
      // caller. GitUser/GitEntity in the store package model these as
      // non-nullable, so an external-API boundary conversion is required here —
      // matching convertProject() above which converts the same way.
    } as unknown as GitCommit;
  }

  parseErrorAsString(error: unknown): string {
    const errorResponse = error as { status?: number };
    return 'Git request failed' + (errorResponse.status ? `(${errorResponse.status})` : '');
  }

}
