import { DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../../../../core/src/core/github.helpers';
import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import { ApplicationServiceMock } from '../../../../../../../../core/test-framework/application-service-helper';
import { getInitialTestStoreState } from '../../../../../../../../core/test-framework/store-test-helper';
import { appReducers } from '../../../../../../../../store/src/reducers.module';
import { ApplicationService } from '../../../../application.service';
import { GitSCMTabComponent } from './gitscm-tab.component';

describe('GitSCMTabComponent', () => {
  let component: GitSCMTabComponent;
  let fixture: ComponentFixture<GitSCMTabComponent>;
  const initialState = getInitialTestStoreState();
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GitSCMTabComponent],
      imports: [
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        DatePipe,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GitSCMTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
