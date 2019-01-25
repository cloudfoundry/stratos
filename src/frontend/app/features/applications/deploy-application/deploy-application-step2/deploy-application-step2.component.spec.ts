import { GitSCMService } from './../../../../shared/data-services/scm/scm.service';
import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { inject, TestBed, ComponentFixture, async, fakeAsync, tick } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material';

import { DeployApplicationStep2Component } from './deploy-application-step2.component';
import { DeployApplicationFsComponent } from './deploy-application-fs/deploy-application-fs.component';
import { GITHUB_API_URL, getGitHubAPIURL } from '../../../../core/github.helpers';
import { HttpModule, Http, ConnectionBackend } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { GithubProjectExistsDirective } from '../github-project-exists.directive';

describe('DeployApplicationStep2Component', () => {
  let component: DeployApplicationStep2Component;
  let fixture: ComponentFixture<DeployApplicationStep2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DeployApplicationStep2Component,
        DeployApplicationFsComponent,
        GithubProjectExistsDirective
      ],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        createBasicStoreModule(),
        BrowserAnimationsModule,
        HttpModule
      ],
      providers: [
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        Http,
        {
          provide: ConnectionBackend,
          useClass: MockBackend
        },
        GitSCMService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
