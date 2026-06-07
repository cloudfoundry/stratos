import { describe, it, expect, beforeEach } from 'vitest';
import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
