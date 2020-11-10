import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { combineLatest, Observable, of as observableOf, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Md5 } from 'ts-md5/dist/md5';

import { GitBranch, GitCommit, GitRepo } from '../../store/git.public-types';
import { GitSCM, SCMIcon } from './scm';
import { BaseSCM } from './scm-base';
import { GitSCMType } from './scm.service';

const gitLabAPIUrl = 'https://gitlab.com/api/v4';
const GITLAB_PER_PAGE_PARAM = 'per_page';
const GITLAB_PER_PAGE_PARAM_VALUE = 100;

export class GitLabSCM extends BaseSCM implements GitSCM {

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

  getPublicApiUrl(): string {
    return gitLabAPIUrl;
  }

  getAPIUrl(endpointGuid: string): Observable<string> {
    return super.getAPIUrl(endpointGuid) || of(this.getPublicApiUrl());
  }

  getRepository(httpClient: HttpClient, endpointGuid: string, projectName: string): Observable<GitRepo> {
    const parts = projectName.split('/');

    const obs$ = parts.length !== 2 ?
      observableOf(null) :
      this.getAPIUrl(endpointGuid).pipe(map(apiUrl => httpClient.get(`${apiUrl}/projects/${parts.join('%2F')}`)));

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

  getBranch(httpClient: HttpClient, endpointGuid: string, projectName: string, branchName: string): Observable<GitBranch> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return this.getAPIUrl(endpointGuid).pipe(
      switchMap(apiUrl => httpClient.get(`${apiUrl}/projects/${prjNameEncoded}/repository/branches/${branchName}`)),
      map((data: any) => {
        const nb = { ...data };
        nb.commit.sha = nb.commit.id;
        return nb;
      })
    );
  }

  getBranches(httpClient: HttpClient, endpointGuid: string, projectName: string): Observable<GitBranch[]> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return this.getAPIUrl(endpointGuid).pipe(
      switchMap(apiUrl => httpClient.get(
        `${apiUrl}/projects/${prjNameEncoded}/repository/branches`, {
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

  getCommit(httpClient: HttpClient, endpointGuid: string, projectName: string, commitSha: string): Observable<GitCommit> {
    return this.getCommitApiUrl(endpointGuid, projectName, commitSha).pipe(
      switchMap(commitUrl => httpClient.get(commitUrl)),
      map(data => {
        return this.convertCommit(endpointGuid, projectName, data);
      })
    );
  }

  getCommitApiUrl(projectName: string, endpointGuid: string, commitSha: string): Observable<string> {
    return this.getAPIUrl(endpointGuid).pipe(
      map(apiUrl => {
        const prjNameEncoded = encodeURIComponent(projectName);
        return `${apiUrl}/projects/${prjNameEncoded}/repository/commits/${commitSha}`;
      })
    );
  }

  getCommits(httpClient: HttpClient, endpointGuid: string, projectName: string, commitSha: string): Observable<GitCommit[]> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return this.getAPIUrl(endpointGuid).pipe(
      switchMap(apiUrl => httpClient.get(
        `${apiUrl}/projects/${prjNameEncoded}/repository/commits?ref_name=${commitSha}`, {
        params: {
          [GITLAB_PER_PAGE_PARAM]: GITLAB_PER_PAGE_PARAM_VALUE.toString()
        }
      }
      )),
      map((data: any) => {
        const commits = [];
        data.forEach(c => commits.push(this.convertCommit(endpointGuid, projectName, c)));
        return commits;
      })
    );
  }

  // TODO: RC these are links to sites... shouldn't use api urls
  getCloneURL(endpointGuid: string, projectName: string): Observable<string> {
    const prjNameEncoded = encodeURIComponent(projectName);// TODO: RC this should be used??
    return this.getAPIUrl(endpointGuid).pipe(
      map(apiUrl => `https://gitlab.com/${projectName}.git`)
    );
  }

  getCommitURL(endpointGuid: string, projectName: string, commitSha: string): Observable<string> {
    const prjNameEncoded = encodeURIComponent(projectName);// TODO: RC this should be used??
    return this.getAPIUrl(endpointGuid).pipe(
      map(apiUrl => `https://gitlab.com/${projectName}/commit/${commitSha}`)
    );
  }

  getCompareCommitURL(endpointGuid: string, projectName: string, commitSha1: string, commitSha2: string): Observable<string> {
    const prjNameEncoded = encodeURIComponent(projectName);// TODO: RC this should be used??
    return this.getAPIUrl(endpointGuid).pipe(
      map(apiUrl => `https://gitlab.com/${projectName}/compare/${commitSha1}...${commitSha2}`)
    );
  }

  getMatchingRepositories(httpClient: HttpClient, endpointGuid: string, projectName: string): Observable<string[]> {
    const prjParts = projectName.split('/');

    const obs$ = prjParts.length > 1 ?
      this.getMatchingUserGroupRepositories(httpClient, endpointGuid, prjParts) :
      this.getAPIUrl(endpointGuid).pipe(
        switchMap(apiUrl => httpClient.get(`${apiUrl}/projects?search=${projectName}`, {
          params: {
            [GITLAB_PER_PAGE_PARAM]: GITLAB_PER_PAGE_PARAM_VALUE.toString()
          }
        }))
      );

    return obs$.pipe(
      map((repos: any[]) => repos.map(item => item.path_with_namespace)),
    );
  }

  private getMatchingUserGroupRepositories(httpClient: HttpClient, endpointGuid: string, prjParts: string[]): Observable<any[]> {
    return this.getAPIUrl(endpointGuid).pipe(
      switchMap(apiUrl => combineLatest([
        httpClient.get<[]>(`${apiUrl}/users/${prjParts[0]}/projects/?search=${prjParts[1]}`).pipe(catchError(() => of([]))),
        httpClient.get<[]>(`${apiUrl}/groups/${prjParts[0]}/projects?search=${prjParts[1]}`).pipe(catchError(() => of([]))),
      ])),
      map(([a, b]: [any[], any[]]) => a.concat(b)),
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
      }
    };
  }

  public convertCommit(apiUrl: string, projectName: string, commit: any): GitCommit {
    const emailMD5 = Md5.hashStr(commit.author_email);
    const avatarURL = `https://secure.gravatar.com/avatar/${emailMD5}?s=120&d=identicon`;

    return {
      // html_url: this.getCommitURL(endpointGuid, projectName, commit.id), // TODO: RC add back & fix
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
      sha: commit.id
    };
  }

  parseErrorString(error: any, message: string): string {
    return 'Git request failed';
  }

}
