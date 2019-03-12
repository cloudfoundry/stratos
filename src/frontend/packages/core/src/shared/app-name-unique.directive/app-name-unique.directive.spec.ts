import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, TestBed } from '@angular/core/testing';
import { ConnectionBackend, HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { MatDialogModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { Store } from '@ngrx/store';

import { AppNameUniqueDirective } from './app-name-unique.directive';
import { AppStoreModule } from '../../../../store/src/store.module';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../shared.module';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { ExtensionService } from '../../core/extension/extension-service';
import { GITHUB_API_URL, getGitHubAPIURL } from '../../core/github.helpers';
import { AppState } from '../../../../store/src/app-state';

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
