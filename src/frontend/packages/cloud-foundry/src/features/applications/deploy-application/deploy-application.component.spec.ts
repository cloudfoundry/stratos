import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
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

  // Regression guard for the FWT-959 Part 2 file-upload deploy fix
  // (GH #5045). step2's onNext returns the FileScannerInfo as
  // result.data; the signal-handle submit() contract has no data
  // channel, so the parent captures into pendingFsFileInfo and
  // forwards via `step2_2Handle.onEnter` — which the stepper fires
  // on activation, after step 2's submit has already run.
  //
  // Earlier versions of this test forwarded via the @ViewChild setter
  // and asserted `step2_2Ref = mock` *after* submit. That order never
  // occurs in real Angular: @ViewChild for projected content fires at
  // parent view-init, before any submit. The old test silently passed
  // against broken production code because it mocked an order the
  // framework never produces. See KS doc
  // 2026-05-26-deploy-application-ngrx-removal for the postmortem.
  it('forwards FileScannerInfo from step2 submit to step2_2.onEnter via step2_2Handle.onEnter', async () => {
    const fakeFileInfo = { root: 'mock-root', total: 100 };
    const mockStep2 = { onNext: vi.fn().mockReturnValue(of({ success: true, data: fakeFileInfo })) };
    const mockStep2_2 = { onEnter: vi.fn(), valid$: of(true) };

    // ViewChild fires at parent view-init before any step submit. The
    // setter must NOT forward at this point — pendingFsFileInfo is
    // still undefined, so a forward here would prime the deployer
    // with garbage and the file-upload path's readyFilter would never
    // open the deploy WebSocket.
    (component as any).step2_2Ref = mockStep2_2;
    expect(mockStep2_2.onEnter).not.toHaveBeenCalled();

    // Step 2 submits — handle.submit captures result.data into
    // pendingFsFileInfo, mirroring the legacy `enterData` channel
    // the framework no longer provides for signal-handle steps.
    (component as any)._step2 = mockStep2;
    await component.step2Handle.submit!();
    expect((component as any).pendingFsFileInfo).toBe(fakeFileInfo);

    // Stepper activates step 2_2 → fires handle.onEnter → the parent
    // forwards pendingFsFileInfo to the child component and clears
    // the holding field.
    component.step2_2Handle.onEnter!();
    expect(mockStep2_2.onEnter).toHaveBeenCalledWith(fakeFileInfo);
    expect((component as any).pendingFsFileInfo).toBeUndefined();
  });
});
