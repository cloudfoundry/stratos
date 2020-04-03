import { CommonModule } from '@angular/common';
import { HttpBackend, HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { Store } from '@ngrx/store';
import { createBasicStoreModule } from '@stratos/store/testing';

import { CFAppState } from '../../../../cloud-foundry/src/cf-app-state';
import { ActiveRouteCfOrgSpace } from '../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import { CfUserService } from '../../../../cloud-foundry/src/shared/data-services/cf-user.service';
import { AppStoreModule } from '../../../../store/src/store.module';
import { CoreTestingModule } from '../../../test-framework/core-test.modules';
import { CoreModule } from '../../core/core.module';
import { ExtensionService } from '../../core/extension/extension-service';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../core/github.helpers';
import { SharedModule } from '../shared.module';
import { AppNameUniqueDirective } from './app-name-unique.directive';

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
        CoreTestingModule,
        createBasicStoreModule(),
        HttpClientModule,
      ],
      providers: [
        ExtensionService,
        {
          provide: HttpBackend,
          useClass: HttpTestingController

        },
        HttpClient,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        CfUserService,
        ActiveRouteCfOrgSpace
      ]
    });
  });
  it('should create an instance', inject([Store, HttpClient], (store: Store<CFAppState>, http: HttpClient) => {
    const directive = new AppNameUniqueDirective(store, http);
    expect(directive).toBeTruthy();
  }));
});
