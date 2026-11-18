import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TabNavService } from '@stratosui/core';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../data-services/cloud-foundry.service';
import { CsiStateService } from '../csi-state.service';
import { AddServiceInstanceComponent } from './add-service-instance.component';

// A space-scoped broker's Add Service Instance link carries the space but
// not its org; the wizard has to resolve the org from the space or the plan
// step never gets a target.
describe('AddServiceInstanceComponent from a space-scoped marketplace link', () => {
  const route = (queryParams: Record<string, string>) => ({
    snapshot: {
      params: { endpointId: 'cf-1', serviceId: 'svc-1' },
      queryParams,
      queryParamMap: { get: vi.fn().mockReturnValue(null) },
    },
  });

  const create = (queryParams: Record<string, string>) => {
    TestBed.configureTestingModule({
      imports: [AddServiceInstanceComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        CfOrgSpaceDataService,
        CloudFoundryService,
        TabNavService,
        { provide: ActivatedRoute, useValue: route(queryParams) },
        { provide: Router, useValue: { getCurrentNavigation: vi.fn().mockReturnValue(null) } },
      ],
    });
    return TestBed.createComponent(AddServiceInstanceComponent);
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('resolves the org of the space when the link has none', async () => {
    const fixture = create({ isSpaceScoped: 'true', spaceGuid: 'space-1' });
    const http = TestBed.inject(HttpTestingController);
    const state = fixture.debugElement.injector.get(CsiStateService);
    await fixture.whenStable();
    const request = http.expectOne('/pp/v1/cf/spaces/cf-1/space-1');
    request.flush({ guid: 'space-1', name: 'sp', orgGuid: 'org-1', cnsiGuid: 'cf-1' });
    await vi.waitFor(() => expect(state.state().orgGuid).toBe('org-1'));
    expect(state.state().spaceGuid).toBe('space-1');
  });

  it('does not fetch the space when the link carries the org', async () => {
    const fixture = create({ isSpaceScoped: 'true', spaceGuid: 'space-1', orgGuid: 'org-9' });
    const http = TestBed.inject(HttpTestingController);
    const state = fixture.debugElement.injector.get(CsiStateService);
    await fixture.whenStable();
    http.expectNone('/pp/v1/cf/spaces/cf-1/space-1');
    await vi.waitFor(() => expect(state.state().orgGuid).toBe('org-9'));
  });
});
