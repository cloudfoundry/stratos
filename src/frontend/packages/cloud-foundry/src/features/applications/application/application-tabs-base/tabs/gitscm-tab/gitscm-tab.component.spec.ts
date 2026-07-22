import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { CommonModule } from '@angular/common';
import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { TailwindSnackBarService } from '@stratosui/core';
import { EMPTY } from 'rxjs';

import { AppDetailDataService } from '../../../../../../features/applications/app-detail-data.service';
import { CfDeployAppDataService } from '../../../../../../services/domain-data/cf-deploy-app-data.service';
import { ApplicationService } from '../../../../application.service';
import { GitSCMTabComponent } from './gitscm-tab.component';

/**
 * Minimal AppDetailDataService stub. Used only for `data.stratosProject()`
 * reads from the template; ngOnInit branches on ApplicationService instead.
 */
const makeDataStub = () => ({
  stratosProject: signal<any>(null).asReadonly(),
});

/**
 * Minimal ApplicationService stub. EMPTY suppresses the inner subscribe
 * body so ngOnInit doesn't reach into the git entity catalog — same intent
 * as the AppDetailDataService stub above for the legacy code path.
 */
const makeAppServiceStub = () => ({
  applicationStratProject$: EMPTY,
  waitForAppEntity$: EMPTY,
  appSpace$: EMPTY,
});

describe('GitSCMTabComponent', () => {
  let component: GitSCMTabComponent;
  let fixture: ComponentFixture<GitSCMTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GitSCMTabComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        TailwindSnackBarService,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        DatePipe,
        GitSCMService,
        { provide: AppDetailDataService, useFactory: makeDataStub },
        { provide: ApplicationService, useFactory: makeAppServiceStub },
        { provide: CfDeployAppDataService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    // Keep CommonModule (async pipe) but strip deep child components that pull
    // in the full ngrx entity store. Logic under test is injection + ngOnInit.
    .overrideComponent(GitSCMTabComponent, {
      set: { imports: [CommonModule] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(GitSCMTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
