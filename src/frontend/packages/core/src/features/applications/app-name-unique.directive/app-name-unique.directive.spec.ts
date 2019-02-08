import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { inject, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

import { AppNameUniqueDirective } from './app-name-unique.directive';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material';
import { MockBackend } from '@angular/http/testing';
import { HttpModule, Http, ConnectionBackend } from '@angular/http';
import { GITHUB_API_URL, getGitHubAPIURL } from '../../../core/github.helpers';
import { AppStoreModule } from '../../../../../store/src/store.module';
import { AppState } from '../../../../../store/src/app-state';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { ExtensionService } from '../../../core/extension/extension-service';

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
        Http,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL }
      ]
    });
  });
  it('should create an instance', inject([Store, Http], (store: Store<AppState>, http: Http) => {
    const directive = new AppNameUniqueDirective(store, http);
    expect(directive).toBeTruthy();
  }));
});
