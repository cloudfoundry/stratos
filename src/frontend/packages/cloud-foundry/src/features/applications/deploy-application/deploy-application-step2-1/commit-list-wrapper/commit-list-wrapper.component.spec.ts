import { describe, it, expect, beforeEach } from 'vitest';
import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CfDeployAppDataService } from '../../../../../services/domain-data/cf-deploy-app-data.service';
import { CommitListWrapperComponent } from "./commit-list-wrapper.component";

describe('CommitListWrapperComponent', () => {
  let component: CommitListWrapperComponent;
  let fixture: ComponentFixture<CommitListWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommitListWrapperComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        DatePipe,
        GitSCMService,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
      ]
    }).compileComponents();

    TestBed.inject(CfDeployAppDataService).setSourceType({
      id: 'id',
      name: 'name',
    });

    fixture = TestBed.createComponent(CommitListWrapperComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The wrapper is built when the step is entered, from the source the
  // previous step saved; later changes to the source do not move it.
  it('lists the commits of the branch saved when it appears, once', async () => {
    const deployData = TestBed.inject(CfDeployAppDataService);
    const branch = (name: string) => ({ name, guid: name, projectName: 'o/r', scmType: 'github', endpointGuid: '' });
    deployData.setSourceType({ id: 'github', name: 'GitHub' });
    expect(component.branchName()).toBe('');

    deployData.saveAppDetails({ projectName: 'o/r', branch: branch('main'), endpointGuid: '' }, null);
    await fixture.whenStable();
    expect(component.branchName()).toBe('main');
    expect(component.listConfig()).toBeDefined();

    deployData.saveAppDetails({ projectName: 'o/r', branch: branch('dev'), endpointGuid: '' }, null);
    await fixture.whenStable();
    expect(component.branchName()).toBe('main');
  });
});
