import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { combineLatest, Observable, of as observableOf, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Md5 } from 'ts-md5/dist/md5';

import { GitBranch, GitCommit, GitRepo, GitSuggestedRepo } from '../../store/git.public-types';
import { GitSCM, SCMIcon } from './scm';
import { BaseSCM, GitApiRequest } from './scm-base';
import { GitSCMType } from './scm.service';

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
      map((data: any) => {
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
      map((data: any) => {
        const nb = { ...data };
        nb.commit.sha = nb.commit.id;
        return nb;
      })
    );
  }

  getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return this.getAPI().pipe(
      switchMap(api => httpClient.get(
        `${api.url}/projects/${prjNameEncoded}/repository/branches`, {
        params: {
          [GITLAB_PER_PAGE_PARAM]: GITLAB_PER_PAGE_PARAM_VALUE.toString()
        }
      })),
      map((data: any) => {
        const branches = [];
        data.forEach(b => {
          const nb = { ...b };
          nb.commit.sha = b.commit.id;
          branches.push(nb);
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
      map((data: any) => {
        const commits = [];
        data.forEach(c => commits.push(this.convertCommit(c)));
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
    return this.getAPI().pipe(
      switchMap(api => combineLatest([
        httpClient.get<[]>(`${api.url}/users/${prjParts[0]}/projects/?search=${prjParts[1]}`, api.requestArgs).pipe(
          catchError(() => of([]))
        ),
        httpClient.get<[]>(`${api.url}/groups/${prjParts[0]}/projects?search=${prjParts[1]}`, api.requestArgs).pipe(
          catchError(() => of([]))
        ),
      ])),
      map(([a, b]: [any[], any[]]) => a.concat(b).map(this.convertProject)),
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
      map((projects: any[]) => projects.map(this.convertProject))
    );
  }

  private convertProject(prj: any): GitRepo {
    return {
      ...prj,
      full_name: prj.path_with_namespace,
      description: prj.description || prj.name_with_namespace,
      html_url: prj.web_url,
      owner: {
        name: prj.namespace.name,
        avatar_url: prj.avatar_url || '/core/assets/gitlab-logo.svg'
      },
      clone_url: prj.http_url_to_repo,
      // visibility is undefined if not using PAT (everything is public). if PAT is used then values include public, private and internal
      private: prj.visibility !== undefined && prj.visibility !== 'public'
    };
  }

  public convertCommit(commit: any): GitCommit {
    const emailMD5 = Md5.hashStr(commit.author_email);
    const avatarURL = `https://secure.gravatar.com/avatar/${emailMD5}?s=120&d=identicon`;

    return {
      html_url: commit.web_url,
      author: {
        id: null,
        login: null,
        avatar_url: avatarURL,
        html_url: null
      },
      commit: {
        author: {
          date: commit.created_at,
          name: commit.author_name,
          email: commit.author_email
        },
        message: commit.message,
      },
      sha: commit.id,
      guid: commit.guid,
      projectName: commit.projectName,
      scmType: commit.scmType
    };
  }

  parseErrorAsString(error: any): string {
    return 'Git request failed';
  }

}
