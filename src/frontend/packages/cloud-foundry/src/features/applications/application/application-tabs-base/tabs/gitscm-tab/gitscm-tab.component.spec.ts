import { DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { CoreModule, SharedModule } from '@stratosui/core';
import { GithubCommitAuthorComponent, getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { ApplicationServiceMock, generateCfStoreModules } from '@test-framework';

import { ApplicationService } from '../../../../application.service';
import { GitSCMTabComponent } from './gitscm-tab.component';
describe('GitSCMTabComponent', () => {
  let component: GitSCMTabComponent;
  let fixture: ComponentFixture<GitSCMTabComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GitSCMTabComponent,
        GithubCommitAuthorComponent,
        ...generateCfStoreModules(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientModule,
        HttpClientTestingModule,
      ],
      providers: [
        
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        DatePipe,
        GitSCMService,

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GitSCMTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
