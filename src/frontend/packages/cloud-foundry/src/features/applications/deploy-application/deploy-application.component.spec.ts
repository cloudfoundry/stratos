import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import {
  PaginationMonitorFactory,
  EntityMonitorFactory,
  EntityServiceFactory,
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { createEmptyStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CoreModule } from '@stratosui/core';
import { getGitHubAPIURL, GITHUB_API_URL } from '@stratosui/git';

import { generateCFEntities } from '../../../cf-entity-generator';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { ApplicationDeploySourceTypes } from './deploy-application-steps.types';
import { DeployApplicationComponent } from './deploy-application.component';

describe('DeployApplicationComponent', () => {
  let component: DeployApplicationComponent;
  let fixture: ComponentFixture<DeployApplicationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createEmptyStoreModule(),
        EntityCatalogTestModule,
        CoreModule,
        NoopAnimationsModule,
        DeployApplicationComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        EntityCatalogHelper,
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              queryParams: {}
            }
          }
        },
        CfOrgSpaceDataService,
        ApplicationDeploySourceTypes,
        PaginationMonitorFactory,
        EntityMonitorFactory,
        EntityServiceFactory,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();

    // Set EntityCatalogHelper after TestBed is configured
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() to avoid rendering child components
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Regression guard for the FWT-959 Part 2 file-upload deploy fix.
  // step2's onNext returns the FileScannerInfo as result.data; the
  // signal-handle submit() contract has no data channel, so the parent
  // captures into pendingFsFileInfo and forwards via the step2_2
  // ViewChild setter. Without this, deployer.fsFileInfo stays unset
  // and the file-upload deploy throws at deployer.fsFileInfo.root.
  it('forwards FileScannerInfo from step2 submit to step2_2.onEnter', async () => {
    const fakeFileInfo = { root: 'mock-root', total: 100 };
    const mockStep2 = { onNext: vi.fn().mockReturnValue(of({ success: true, data: fakeFileInfo })) };
    const mockStep2_2 = { onEnter: vi.fn(), valid$: of(true) };

    (component as any)._step2 = mockStep2;
    await component.step2Handle.submit!();
    (component as any).step2_2Ref = mockStep2_2;

    expect(mockStep2_2.onEnter).toHaveBeenCalledWith(fakeFileInfo);
  });
});
