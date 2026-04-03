import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ComponentRef, OnDestroy, OnInit, VERSION, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { GeneralEntityAppState, AuthState, SessionData } from '@stratosui/store';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { CustomizationService, CustomizationsMetadata } from '../../../core/customizations.types';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StratosTitleComponent } from '../../../shared/components/stratos-title/stratos-title.component';
import { BUILD_INFO } from '../../../environments/build-info';

@Component({
  selector: 'app-about-page',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PageHeaderComponent,
    StratosTitleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutPageComponent implements OnInit, OnDestroy {
  private store = inject<Store<GeneralEntityAppState>>(Store);
  private meta = inject(Meta);


  sessionData$!: Observable<SessionData>;
  versionNumber$!: Observable<string>;
  userIsAdmin$!: Observable<boolean>;
  buildInfo = BUILD_INFO;
  angularVersion = VERSION.full;

  // VCS URLs (GitHub only — derived from stratos meta tags)
  gitHubRepository: string;
  gitCommitLink: string;
  gitBranchLink: string;

  @ViewChild('aboutInfoContainer', { read: ViewContainerRef, static: true }) aboutInfoContainer!: ViewContainerRef;
  @ViewChild('supportInfoContainer', { read: ViewContainerRef, static: true }) supportInfoContainer!: ViewContainerRef;

  aboutInfoComponentRef!: ComponentRef<any>;
  componentRef!: ComponentRef<any>;

  customizations: CustomizationsMetadata;

  constructor() {
    const cs = inject(CustomizationService);

    this.customizations = cs.get();
  }

  ngOnInit() {
    this.sessionData$ = this.store.select(s => s.auth).pipe(
      filter(auth => !!(auth && auth.sessionData)),
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

    this.initVcsLinks();
    this.addAboutInfoComponent();
    this.addSupportInfo();
  }

  ngOnDestroy() {
    if (this.aboutInfoComponentRef) {
      this.aboutInfoComponentRef.destroy();
    }
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  private initVcsLinks() {
    const gitProject = BUILD_INFO.gitProject || this.getMeta('stratos_git_project');
    const gitBranch = BUILD_INFO.gitBranch === 'HEAD' ? null : BUILD_INFO.gitBranch;
    const gitCommit = BUILD_INFO.gitCommit;

    this.gitHubRepository = this.getGitHubProject(gitProject);
    if (this.gitHubRepository) {
      if (gitCommit) {
        this.gitCommitLink = `https://github.com/${this.gitHubRepository}/commit/${gitCommit}`;
      }
      if (gitBranch) {
        this.gitBranchLink = `https://github.com/${this.gitHubRepository}/tree/${gitBranch}`;
      }
    }
  }

  backendCommitLink(commit: string): string {
    if (!this.gitHubRepository || !commit) { return null; }
    return `https://github.com/${this.gitHubRepository}/commit/${commit}`;
  }

  backendBranchLink(branch: string): string {
    if (!this.gitHubRepository || !branch || branch === 'HEAD') { return null; }
    return `https://github.com/${this.gitHubRepository}/tree/${branch}`;
  }

  private getGitHubProject(prj: string): string {
    if (!prj) { return ''; }
    const projectUrl = prj.endsWith('.git') ? prj.slice(0, -4) : prj;
    if (projectUrl.toLowerCase().startsWith('git@github.com:')) {
      return projectUrl.slice(15);
    } else if (projectUrl.toLowerCase().startsWith('https://github.com/')) {
      return projectUrl.slice(19);
    }
    return '';
  }

  private getMeta(name: string): string {
    const metaValue = this.meta.getTag(`name=${name}`);
    return metaValue ? metaValue.content : '';
  }

  addAboutInfoComponent() {
    this.aboutInfoContainer.clear();
    if (this.customizations.aboutInfoComponent) {
      this.aboutInfoComponentRef = this.aboutInfoContainer.createComponent(this.customizations.aboutInfoComponent);
    }
  }

  addSupportInfo() {
    this.supportInfoContainer.clear();
    if (this.customizations.supportInfoComponent) {
      this.componentRef = this.supportInfoContainer.createComponent(this.customizations.supportInfoComponent);
    }
  }
}
