import { CommonModule } from '@angular/common';
import { HttpBackend, HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { Store } from '@ngrx/store';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { ExtensionService } from '../../../../../core/src/core/extension/extension-service';
import { getGitHubAPIURL, GITHUB_API_URL } from '../../../../../core/src/core/github.helpers';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { CoreTestingModule } from '../../../../../core/test-framework/core-test.modules';
import { AppStoreModule } from '../../../../../store/src/store.module';
import { CFAppState } from '../../../cf-app-state';
import { ActiveRouteCfOrgSpace } from '../../../features/cloud-foundry/cf-page.types';
import { CfUserService } from '../../data-services/cf-user.service';
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
