import { describe, it, expect, beforeEach } from 'vitest';
import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Store } from '@ngrx/store';

import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../../../git/src/shared/github.helpers';
import { generateCfStoreModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { SetAppSourceDetails } from '../../../../../actions/deploy-applications.actions';
import { CommitListWrapperComponent } from './commit-list-wrapper.component';

describe('CommitListWrapperComponent', () => {
  let component: CommitListWrapperComponent;
  let fixture: ComponentFixture<CommitListWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommitListWrapperComponent],
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...generateCfStoreModules(),
        DatePipe,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL }
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
