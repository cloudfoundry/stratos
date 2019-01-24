import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommitListWrapperComponent } from './commit-list-wrapper.component';
import { CommonModule, DatePipe } from '@angular/common';
import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { HttpModule, Http, ConnectionBackend } from '@angular/http';
import { GITHUB_API_URL, getGitHubAPIURL } from '../../../../../core/github.helpers';
import { MockBackend } from '@angular/http/testing';

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
        HttpModule
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
