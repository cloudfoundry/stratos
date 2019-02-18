import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectionBackend, Http, HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../../../core/core.module';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../core/github.helpers';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommitListWrapperComponent } from './commit-list-wrapper.component';

describe('CommitListWrapperComponent', () => {
  let component: CommitListWrapperComponent;
  let fixture: ComponentFixture<CommitListWrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CommitListWrapperComponent],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CommitListWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
