import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../core/core.module';
import { SharedModule } from '../../../../../../shared/shared.module';
import { appReducers } from '../../../../../../store/reducers.module';
import { ApplicationServiceMock } from '../../../../../../test-framework/application-service-helper';
import { getInitialTestStoreState } from '../../../../../../test-framework/store-test-helper';
import { ApplicationService } from '../../../../application.service';
import { GitSCMTabComponent } from './gitscm-tab.component';
import { DatePipe } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GITHUB_API_URL, getGitHubAPIURL } from '../../../../../../core/github.helpers';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GitSCMTabComponent', () => {
  let component: GitSCMTabComponent;
  let fixture: ComponentFixture<GitSCMTabComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GitSCMTabComponent],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
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
