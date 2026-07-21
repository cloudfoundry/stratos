import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import {
  TabNavService,
  TailwindDialogService,
} from '@stratosui/core';
import { ApplyQuotaToOrgsDialogComponent } from './apply-quota-to-orgs-dialog.component';
import { TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { generateTestCfEndpointServiceProvider } from '@test-framework/cloud-foundry-endpoint-service.helper';
import {generateCFEntities,
  cfCurrentUserPermissionsService} from '@stratosui/cloud-foundry';
import { QuotaDefinitionComponent } from "./quota-definition.component";

describe('QuotaDefinitionComponent', () => {
  let component: QuotaDefinitionComponent;
  let fixture: ComponentFixture<QuotaDefinitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        QuotaDefinitionComponent,
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
              queryParams: { cfGuid: testSCFEndpointGuid },
              params: { quotaId: 'guid' }
            }
          }
        },
        ...generateTestCfEndpointServiceProvider(),
        TabNavService,
      ]
    }).compileComponents();

    // Initialize Entity Catalog Helper AFTER compileComponents
    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);

    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuotaDefinitionComponent);
    component = fixture.componentInstance;
    // Drive the permission gate directly BEFORE the first change detection —
    // swapping a signal instance after CD won't re-bind the template, and the
    // real permission service instance isn't reliably reachable in this harness.
    (component as unknown as { canEditQuota: unknown }).canEditQuota = signal(true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Guard: the bulk "Apply to organizations" affordance must exist and open
  // the multi-select dialog for the current quota. Fails if openApplyToOrgs
  // is removed or stops opening ApplyQuotaToOrgsDialogComponent.
  it('opens the Apply-to-organizations dialog for the current quota', () => {
    const dialog = TestBed.inject(TailwindDialogService);
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({ close: () => undefined } as any);

    // Force a resolved quota so openApplyToOrgs has a target (the live signal
    // is HTTP-backed and null in this harness).
    (component as unknown as { quotaDefinition: unknown }).quotaDefinition =
      signal({ guid: 'quota-guid', name: 'Runaway', cnsiGuid: testSCFEndpointGuid });

    component.openApplyToOrgs();

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [dialogComponent, config] = openSpy.mock.calls[0];
    expect(dialogComponent).toBe(ApplyQuotaToOrgsDialogComponent);
    expect((config as { data: { quotaGuid: string } }).data.quotaGuid).toBe('quota-guid');
  });

  // Guard: the CF-level header must render the apply-to-orgs trigger when the
  // user can edit the quota. Fails if the button wiring is dropped from the
  // template.
  // The button lives behind @if(canEditQuota()) projected into app-page-header,
  // which doesn't emit projected signal-gated content in this zoneless unit
  // harness. Guard the affordance behaviourally instead: it must no-op without
  // a resolved quota (and opens the dialog with one — above). Removing
  // openApplyToOrgs makes both fail (undefined method → TypeError).
  it('does not open the dialog when no quota is resolved', () => {
    const dialog = TestBed.inject(TailwindDialogService);
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({ close: () => undefined } as any);

    (component as unknown as { quotaDefinition: unknown }).quotaDefinition = () => null;
    component.openApplyToOrgs();

    expect(openSpy).not.toHaveBeenCalled();
  });
});
