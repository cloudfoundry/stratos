import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommitListWrapperComponent } from './commit-list-wrapper.component';
import { CommonModule, DatePipe } from '@angular/common';
import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { GITHUB_API_URL, getGitHubAPIURL } from '../../../../../core/github.helpers';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

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
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        DatePipe,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
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
