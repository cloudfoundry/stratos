import { describe, it, expect, beforeEach } from 'vitest';
import { DatePipe } from '@angular/common';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideMockStore } from '@ngrx/store/testing';
import { Store } from '@ngrx/store';

import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService } from '@stratosui/git';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfTopLevelStoreEntities } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { SetAppSourceDetails } from '../../../../../actions/deploy-applications.actions';
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
        provideMockStore({
          initialState: generateCfTopLevelStoreEntities()
        }),
        ...STORE_TEST_PROVIDERS,
        provideHttpClient(),
        provideZonelessChangeDetection(),
        DatePipe,
        GitSCMService,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
      ]
    }).compileComponents();

    const store = TestBed.inject(Store);
    store.dispatch(new SetAppSourceDetails({
      id: 'id',
      name: 'name'
    }));

    fixture = TestBed.createComponent(CommitListWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
