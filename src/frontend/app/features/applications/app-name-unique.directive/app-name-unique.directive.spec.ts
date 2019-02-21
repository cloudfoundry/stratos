import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { inject, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

import { AppState } from '../../../store/app-state';
import { AppStoreModule } from '../../../store/store.module';
import { AppNameUniqueDirective } from './app-name-unique.directive';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material';
import { MockBackend } from '@angular/http/testing';
import { HttpModule, ConnectionBackend } from '@angular/http';
import { GITHUB_API_URL, getGitHubAPIURL } from '../../../core/github.helpers';
import { ExtensionService } from '../../../core/extension/extension-service';
import { HttpClient } from '@angular/common/http';

describe('AppNameUniqueDirective', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AppStoreModule,
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        MatDialogModule,
        createBasicStoreModule(),
        HttpModule,
      ],
      providers: [
        ExtensionService,
        {
          provide: ConnectionBackend,
          useClass: MockBackend
        },
        HttpClient,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL }
      ]
    });
  });
  it('should create an instance', inject([Store, HttpClient], (store: Store<AppState>, http: HttpClient) => {
    const directive = new AppNameUniqueDirective(store, http);
    expect(directive).toBeTruthy();
  }));
});
