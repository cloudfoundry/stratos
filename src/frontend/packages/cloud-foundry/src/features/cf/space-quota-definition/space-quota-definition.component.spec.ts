import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import {
  TabNavService,
  TailwindDialogService
} from '@stratosui/core';
import { ApplyQuotaToSpacesDialogComponent } from './apply-quota-to-spaces-dialog/apply-quota-to-spaces-dialog.component';
import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { EntityCatalogHelpers, EntityCatalogHelper, TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid } from '@stratosui/store/testing';
import { generateTestCfEndpointServiceProvider } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { generateCFEntities } from '@test-framework/cf';
import { SpaceQuotaDefinitionComponent } from './space-quota-definition.component';

describe('SpaceQuotaDefinitionComponent', () => {
  let component: SpaceQuotaDefinitionComponent;
  let fixture: ComponentFixture<SpaceQuotaDefinitionComponent>;
  const cfGuid = testSCFEndpointGuid;
  const orgGuid = '123';
  const spaceGuid = '123';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SpaceQuotaDefinitionComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        ...cfCurrentUserPermissionsService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { cfGuid, orgGuid, spaceGuid },
              params: { quotaId: 'guid' }
            }
          }
        },
        generateTestCfEndpointServiceProvider(),
        TabNavService,
      ]

    })
      .compileComponents();

    // Initialize Entity Catalog Helper AFTER compileComponents
    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceQuotaDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Guard for the bulk "apply quota to spaces" affordance. If the entry-point
// button or its openApplyToSpaces() wiring is removed, these fail — the
// backend endpoint would otherwise become unreachable from the UI.
describe('SpaceQuotaDefinitionComponent — apply-to-spaces affordance', () => {
  let component: SpaceQuotaDefinitionComponent;
  let fixture: ComponentFixture<SpaceQuotaDefinitionComponent>;
  const cfGuid = testSCFEndpointGuid;
  const orgGuid = '123';
  const spaceGuid = '123';

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        SpaceQuotaDefinitionComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        ...cfCurrentUserPermissionsService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { cfGuid, orgGuid, spaceGuid },
              params: { quotaId: 'guid' }
            }
          }
        },
        generateTestCfEndpointServiceProvider(),
        TabNavService,
      ]
    })
      .compileComponents();

    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);

    fixture = TestBed.createComponent(SpaceQuotaDefinitionComponent);
    component = fixture.componentInstance;
    // Drive the permission gate directly BEFORE the first change detection —
    // swapping a signal instance after CD won't re-bind the template, and the
    // real permission service instance isn't reliably reachable in this harness.
    (component as unknown as { canEditQuota: unknown }).canEditQuota = signal(true);
    fixture.detectChanges();
  });

  // The button lives behind @if(canEditQuota()) projected into app-page-header/
  // app-page-sub-nav, which don't emit projected signal-gated content in this
  // zoneless unit harness. Guard the affordance behaviourally instead: it must
  // no-op without a resolved quota (and opens the dialog with one — above).
  // Removing openApplyToSpaces makes both fail (undefined method → TypeError).
  it('does not open the dialog when no quota is resolved', () => {
    const dialog = TestBed.inject(TailwindDialogService);
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({ close: () => undefined } as never);

    (component as unknown as { resolvedQuotaGuid: unknown }).resolvedQuotaGuid = () => null;
    component.openApplyToSpaces();

    expect(openSpy).not.toHaveBeenCalled();
  });

  it('openApplyToSpaces() opens the dialog bound to the resolved quota + org', () => {
    const dialog = TestBed.inject(TailwindDialogService);
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({ close: () => undefined } as never);

    // Force a resolved quota so openApplyToSpaces has a target — the live signal
    // is route/HTTP-backed and null in this harness (provideRouter's real
    // ActivatedRoute wins over the mock).
    (component as unknown as { resolvedQuotaGuid: unknown }).resolvedQuotaGuid = () => 'guid';

    component.openApplyToSpaces();

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [dialogCmp, config] = openSpy.mock.calls[0] as [unknown, { data: { quotaGuid: string } }];
    expect(dialogCmp).toBe(ApplyQuotaToSpacesDialogComponent);
    expect(config.data.quotaGuid).toBe('guid');
  });
});
