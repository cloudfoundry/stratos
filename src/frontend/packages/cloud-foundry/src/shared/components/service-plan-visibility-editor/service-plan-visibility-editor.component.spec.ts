import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ServiceCatalogDataService, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServicePlan, StServicePlanVisibility } from '../../../services/endpoint-data/stratos-types';
import { ServicePlanVisibilityEditorComponent, VisibilityOrgOption } from './service-plan-visibility-editor.component';

// Captures applyPlanVisibility calls so the guard tests can assert the
// exact (type, orgGuids, mode) forwarded from the multi-org selection.
class ServiceCatalogDataServiceStub {
  applyCalls: Array<{ cnsiGuid: string; planGuid: string; type: string; orgGuids: string[]; mode: string }> = [];
  lastResult: StServicePlanVisibility = { type: 'organization', organizations: [] };

  applyPlanVisibility(
    cnsiGuid: string,
    planGuid: string,
    type: string,
    orgGuids: string[] = [],
    mode: 'replace' | 'merge' = 'replace',
  ): SignalSource<StServicePlanVisibility | null> {
    this.applyCalls.push({ cnsiGuid, planGuid, type, orgGuids, mode });
    return {
      value: signal<StServicePlanVisibility | null>(this.lastResult).asReadonly(),
      isLoading: signal(false).asReadonly(),
      error: signal<HttpErrorResponse | null>(null).asReadonly(),
    };
  }
}

const buildPlan = (overrides: Partial<StServicePlan> = {}): StServicePlan => ({
  guid: 'plan-1',
  cnsiGuid: 'cnsi-1',
  name: 'small',
  visibilityType: 'admin',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const orgs: VisibilityOrgOption[] = [
  { guid: 'org-1', name: 'alpha' },
  { guid: 'org-2', name: 'beta' },
  { guid: 'org-3', name: 'gamma' },
];

describe('ServicePlanVisibilityEditorComponent', () => {
  let component: ServicePlanVisibilityEditorComponent;
  let fixture: ComponentFixture<ServicePlanVisibilityEditorComponent>;
  let element: HTMLElement;
  let catalogStub: ServiceCatalogDataServiceStub;

  beforeEach(async () => {
    catalogStub = new ServiceCatalogDataServiceStub();
    await TestBed.configureTestingModule({
      imports: [ServicePlanVisibilityEditorComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ServiceCatalogDataService, useValue: catalogStub },
        { provide: ComponentFixtureAutoDetect, useValue: true },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicePlanVisibilityEditorComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    component.servicePlan = buildPlan();
    component.organizations = orgs;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  // Guard: the multi-org selection affordance must render one checkbox
  // per candidate org. If the org multiselect is removed, this fails.
  it('renders a checkbox per organization when type=organization', () => {
    expect(component.type()).toBe('organization');
    const boxes = element.querySelectorAll('[data-test="org-multiselect"] input[type="checkbox"]');
    expect(boxes.length).toBe(orgs.length);
  });

  // Guard: selecting N orgs and applying must forward ALL N guids in a
  // single applyPlanVisibility call. This is the core bulk affordance —
  // it fails if apply regresses to single-org or drops the selection.
  it('applies organizations-scoped visibility for every selected org in one call', () => {
    component.toggleOrg('org-1');
    component.toggleOrg('org-3');
    expect(component.selectedCount()).toBe(2);

    component.apply();

    expect(catalogStub.applyCalls).toHaveLength(1);
    const call = catalogStub.applyCalls[0];
    expect(call.cnsiGuid).toBe('cnsi-1');
    expect(call.planGuid).toBe('plan-1');
    expect(call.type).toBe('organization');
    expect(call.orgGuids.sort()).toEqual(['org-1', 'org-3']);
    expect(call.mode).toBe('replace');
  });

  it('select-all selects every org, clear resets to none', () => {
    component.selectAllOrgs();
    expect(component.selectedCount()).toBe(orgs.length);
    component.clearOrgs();
    expect(component.selectedCount()).toBe(0);
  });

  // Guard: an organization apply with no orgs selected is not well-formed
  // and must not fire a request (canApply gates the button).
  it('does not apply when type=organization and no org is selected', () => {
    expect(component.canApply()).toBe(false);
    component.apply();
    expect(catalogStub.applyCalls).toHaveLength(0);
  });

  it('emits the applied visibility once the write lands', () => {
    const spy = vi.fn();
    component.applied.subscribe(spy);
    component.toggleOrg('org-2');
    component.apply();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(catalogStub.lastResult);
  });

  it('non-organization scopes apply with an empty org list', () => {
    component.setType('public');
    fixture.detectChanges();
    expect(component.canApply()).toBe(true);
    component.apply();
    expect(catalogStub.applyCalls[0].type).toBe('public');
    expect(catalogStub.applyCalls[0].orgGuids).toEqual([]);
  });
});
