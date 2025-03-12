import { Component, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { GeneralEntityAppState, AuthState, SessionData } from '@stratosui/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-diagnostics-page',
  templateUrl: './diagnostics-page.component.html',
  styleUrls: ['./diagnostics-page.component.scss']
})
export class DiagnosticsPageComponent implements OnInit {

  sessionData$: Observable<SessionData>;
  versionNumber$: Observable<string>;
  userIsAdmin$: Observable<boolean>;
  helmLastModified$: Observable<Date>;

  public breadcrumbs = [
    {
      breadcrumbs: [{ value: 'About', routerLink: '/about' }]
    }
  ];

  public gitProject: string;
  public gitBranch: string;
  public gitCommit: string;
  public buildDate: string;
  public gitHubRepository: string;
  public gitHubRepositoryLink: string;
  public gitBranchLink: string;
  public gitCommitLink: string;

  constructor(
    private meta: Meta,
    private store: Store<GeneralEntityAppState>,
  ) { }

  ngOnInit() {

    const helmLastModifiedRegEx = /seconds:([0-9]*)/;

    this.sessionData$ = this.store.select(s => s.auth).pipe(
      filter(auth => !!(auth && auth.sessionData)),
      filter(auth => !!(auth.sessionData.diagnostics)),
      map((auth: AuthState) => auth.sessionData)
    );

    this.userIsAdmin$ = this.sessionData$.pipe(
      map(session => session.user && session.user.admin)
    );

    this.versionNumber$ = this.sessionData$.pipe(
      map((sessionData: SessionData) => {
        const versionNumber = sessionData.version.proxy_version;
        return versionNumber.split('-')[0];
      })
    );

    this.helmLastModified$ = this.sessionData$.pipe(
      map((sessionData: SessionData) => {
        const lastModified = sessionData.diagnostics.helmLastModified;
        const match = helmLastModifiedRegEx.exec(lastModified);
        if (match.length === 2) {
          return new Date(parseInt(match[1], 10) * 1000);
        }
        return new Date(0);
      })
    );

    this.gitProject = this.getMeta('stratos_git_project');
    this.gitBranch = this.getMeta('stratos_git_branch');
    this.gitCommit = this.getMeta('stratos_git_commit');
    this.buildDate = this.getMeta('stratos_build_date');

    // Don't show branch if it is recorded as HEAD
    if (this.gitBranch === 'HEAD') {
      this.gitBranch = null;
    }

    this.gitHubRepository = this.getGitHubProject(this.gitProject);
    if (!!this.gitHubRepository) {
      this.gitHubRepositoryLink = `https://github.com/${this.gitHubRepository}`;
      if (!!this.gitBranch) {
        this.gitBranchLink = `https://github.com/${this.gitHubRepository}/tree/${this.gitBranch}`;
      }
      if (!!this.gitCommit) {
        this.gitCommitLink = `https://github.com/${this.gitHubRepository}/commit/${this.gitCommit}`;
      }
    }
  }

  private getGitHubProject(prj: string): string {
    let projectUrl = prj;
    // Remove trailing .git if it is there
    if (projectUrl.endsWith('.git')) {
      projectUrl = projectUrl.substr(0, projectUrl.length - 4);
    }

    // Handle either SSH or HTTPS GitHub URLs
    if (projectUrl.toLowerCase().startsWith('git@github.com:')) {
      return projectUrl.substr(15);
    } else if (projectUrl.toLowerCase().startsWith('https://github.com/')) {
      return projectUrl.substr(19);
    }
    return '';
  }

  private getMeta(name: string): string {
    const metaValue = this.meta.getTag(`name=${name}`);
    return metaValue ? metaValue.content : '';
  }
}
