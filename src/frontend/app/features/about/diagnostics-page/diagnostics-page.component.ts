import { Component, Inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Customizations, CustomizationsMetadata } from '../../../core/customizations.types';
import { AppState } from '../../../store/app-state';
import { AuthState } from '../../../store/reducers/auth.reducer';
import { SessionData } from '../../../store/types/auth.types';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-diagnostics-page',
  templateUrl: './diagnostics-page.component.html',
  styleUrls: ['./diagnostics-page.component.scss']
})
export class DiagnosticsPageComponent implements OnInit {

  sessionData$: Observable<SessionData>;
  versionNumber$: Observable<string>;
  userIsAdmin$: Observable<boolean>;

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

  constructor(private meta: Meta, private store: Store<AppState>, @Inject(Customizations) public customizations: CustomizationsMetadata) { }

  ngOnInit() {
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

    this.gitProject = this.getMeta('stratos_git_project');
    this.gitBranch = this.getMeta('stratos_git_branch');
    this.gitCommit = this.getMeta('stratos_git_commit');
    this.buildDate = this.getMeta('stratos_build_date');

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
    const parts = prj.split(':');
    if (parts.length === 2 && parts[0].indexOf('@github.com') >= 0) {
      return parts[1];
    }
    return '';
  }

  private getMeta(name: string): string {
    const metaValue = this.meta.getTag(`name=${name}`);
    return metaValue ? metaValue.content : '';
  }
}
