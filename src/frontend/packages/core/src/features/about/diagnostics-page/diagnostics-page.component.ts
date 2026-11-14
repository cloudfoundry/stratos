import { ChangeDetectionStrategy, Component, OnInit, VERSION, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { Diagnostics, SessionData } from '@stratosui/store';

import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { BooleanIndicatorComponent } from '../../../shared/components/boolean-indicator/boolean-indicator.component';
import { CardWrapperComponent } from '../../../shared/components/cards/card/card.component';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';
import { InfoCardComponent } from '../../../shared/components/info-card/info-card.component';
import { BUILD_INFO } from '../../../environments/build-info';

@Component({
  selector: 'app-diagnostics-page',
  templateUrl: './diagnostics-page.component.html',
  standalone: true,
  imports: [
    CommonModule,
    BooleanIndicatorComponent,
    CardWrapperComponent,
    CustomIconComponent,
    InfoCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiagnosticsPageComponent implements OnInit {
  private meta = inject(Meta);
  private auth = inject(AuthSignalService);


  // The page renders once the session carries diagnostics.
  readonly sessionData = computed(() => {
    const sessionData = this.auth.sessionData();
    return sessionData?.diagnostics ? sessionData as SessionData & { diagnostics: Diagnostics } : null;
  });
  readonly userIsAdmin = computed(() => !!this.sessionData()?.user?.admin);
  readonly helmLastModified = computed(() => {
    const match = /seconds:([0-9]*)/.exec(this.sessionData()?.diagnostics.helmLastModified ?? '');
    return new Date(match?.length === 2 ? parseInt(match[1], 10) * 1000 : 0);
  });

  angularVersion = VERSION.full;
  buildInfo = BUILD_INFO;

  // These are populated by ngOnInit before the template reads them.
  public gitProject!: string; // strict: assigned in ngOnInit
  public gitBranch: string | null = null; // may be cleared when branch is 'HEAD'
  public gitCommit!: string; // strict: assigned in ngOnInit
  public buildDate!: string; // strict: assigned in ngOnInit
  public gitHubRepository!: string; // strict: assigned in ngOnInit
  // Links are only built when the corresponding info is present.
  public gitHubRepositoryLink?: string;
  public gitBranchLink?: string;
  public gitCommitLink?: string;

  ngOnInit() {

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
