import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectionBackend, Http, HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { Store } from '@ngrx/store';

import { CoreModule } from '../../../../../../../core/src/core/core.module';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../../../core/src/core/github.helpers';
import { SharedModule } from '../../../../../../../core/src/shared/shared.module';
import { generateCfStoreModules } from '../../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { SetAppSourceDetails } from '../../../../../actions/deploy-applications.actions';
import { CommitListWrapperComponent } from './commit-list-wrapper.component';

describe('CommitListWrapperComponent', () => {
  let component: CommitListWrapperComponent;
  let fixture: ComponentFixture<CommitListWrapperComponent>;

  beforeEach(() => {
    // const store = generateCfTopLevelStoreEntities() as CFAppState;
    TestBed.configureTestingModule({
      declarations: [CommitListWrapperComponent],
      imports: [
        ...generateCfStoreModules(),
        CommonModule,
        CoreModule,
        SharedModule,
        HttpModule,
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        DatePipe,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        Http,
        {
          provide: ConnectionBackend,
          useClass: MockBackend
        }
      ]
    })
      .compileComponents();
    const store = TestBed.get(Store);
    store.dispatch(new SetAppSourceDetails({
      id: 'id',
      name: 'name'
    }));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommitListWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
