import { ChangeDetectionStrategy, Component, OnInit, VERSION, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { Meta } from '@angular/platform-browser';
import { SessionData } from '@stratosui/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { BooleanIndicatorComponent } from '../../../shared/components/boolean-indicator/boolean-indicator.component';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';
import { InfoCardComponent } from '../../../shared/components/info-card/info-card.component';
import { BUILD_INFO } from '../../../environments/build-info';

@Component({
  selector: 'app-diagnostics-page',
  templateUrl: './diagnostics-page.component.html',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    BooleanIndicatorComponent,
    CustomIconComponent,
    InfoCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiagnosticsPageComponent implements OnInit {
  private meta = inject(Meta);
  private auth = inject(AuthSignalService);


  // toObservable() requires an injection context — bridge the signal here
  // (field initializer runs in DI context) rather than in ngOnInit (which is not).
  sessionData$: Observable<SessionData> = toObservable(this.auth.sessionData).pipe(
    filter((sessionData): sessionData is SessionData => !!sessionData),
    filter(sessionData => !!sessionData.diagnostics)
  );
  versionNumber$!: Observable<string>;
  userIsAdmin$!: Observable<boolean>;
  helmLastModified$!: Observable<Date>;

  public breadcrumbs = [
    {
      breadcrumbs: [{ value: 'About', routerLink: '/about' }]
    }
  ];

  angularVersion = VERSION.full;
  buildInfo = BUILD_INFO;

  public gitProject: string;
  public gitBranch: string;
  public gitCommit: string;
  public buildDate: string;
  public gitHubRepository: string;
  public gitHubRepositoryLink: string;
  public gitBranchLink: string;
  public gitCommitLink: string;

  ngOnInit() {

    const helmLastModifiedRegEx = /seconds:([0-9]*)/;

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
        if (match && match.length === 2) {
          return new Date(parseInt(match[1], 10) * 1000);
        }
        return new Date(0);
      })
    );

    this.gitProject = this.buildInfo.gitProject || this.getMeta('stratos_git_project');
    this.gitBranch = this.buildInfo.gitBranch || this.getMeta('stratos_git_branch');
    this.gitCommit = this.buildInfo.gitCommit || this.getMeta('stratos_git_commit');
    this.buildDate = this.buildInfo.buildDate || this.getMeta('stratos_build_date');

    // Don't show branch if it is recorded as HEAD
    if (this.gitBranch === 'HEAD') {
      this.gitBranch = null;
    }

    this.gitHubRepository = this.getGitHubProject(this.gitProject);
    if (this.gitHubRepository) {
      this.gitHubRepositoryLink = `https://github.com/${this.gitHubRepository}`;
      if (this.gitBranch) {
        this.gitBranchLink = `https://github.com/${this.gitHubRepository}/tree/${this.gitBranch}`;
      }
      if (this.gitCommit) {
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

  getMigrationSummary(migrations: any[]): string {
    if (!migrations || migrations.length === 0) return 'None';
    const applied = migrations.filter(m => m.is_applied).length;
    if (applied === migrations.length) return `${migrations.length} applied`;
    return `${applied}/${migrations.length} applied`;
  }

  private getMeta(name: string): string {
    const metaValue = this.meta.getTag(`name=${name}`);
    return metaValue ? metaValue.content : '';
  }
}
