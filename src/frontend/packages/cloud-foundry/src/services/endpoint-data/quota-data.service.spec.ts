import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';

import { QuotaDataService } from './quota-data.service';

describe('QuotaDataService', () => {
  let service: QuotaDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        QuotaDataService,
      ],
    });
    service = TestBed.inject(QuotaDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('orgQuotas hits /cf/organization_quotas/:cnsi and unwraps resources', () => {
    const source = service.orgQuotas('cnsi-1');
    expect(source.isLoading()).toBe(true);

    const req = httpMock.expectOne('/pp/v1/cf/organization_quotas/cnsi-1');
    expect(req.request.method).toBe('GET');
    req.flush({ resources: [{ guid: 'q-1', name: 'small' }], pagination: { totalResults: 1 } });

    expect(source.isLoading()).toBe(false);
    expect(source.value().length).toBe(1);
    expect(source.value()[0].name).toBe('small');
  });

  it('orgQuota hits /cf/organization_quotas/:cnsi/:guid', () => {
    const source = service.orgQuota('cnsi-1', 'q-1');
    const req = httpMock.expectOne('/pp/v1/cf/organization_quotas/cnsi-1/q-1');
    expect(req.request.method).toBe('GET');
    req.flush({ guid: 'q-1', name: 'small' });

    expect(source.value()?.name).toBe('small');
  });

  it('orgQuota 404 resolves to null', () => {
    const source = service.orgQuota('cnsi-1', 'missing');
    const req = httpMock.expectOne('/pp/v1/cf/organization_quotas/cnsi-1/missing');
    req.flush('', { status: 404, statusText: 'Not Found' });

    expect(source.value()).toBeNull();
    expect(source.error()).toBeNull();
  });

  it('spaceQuotasInOrg filters by organizationGuid', () => {
    const source = service.spaceQuotasInOrg('cnsi-1', 'org-A');
    const req = httpMock.expectOne('/pp/v1/cf/space_quotas/cnsi-1');
    req.flush({
      resources: [
        { guid: 'sq-1', organizationGuid: 'org-A' },
        { guid: 'sq-2', organizationGuid: 'org-B' },
        { guid: 'sq-3', organizationGuid: 'org-A' },
      ],
    });
    expect(source.value().map(q => q.guid)).toEqual(['sq-1', 'sq-3']);
  });

  it('spaceQuota hits /cf/space_quotas/:cnsi/:guid', () => {
    const source = service.spaceQuota('cnsi-1', 'sq-1');
    const req = httpMock.expectOne('/pp/v1/cf/space_quotas/cnsi-1/sq-1');
    req.flush({ guid: 'sq-1', name: 'small' });

    expect(source.value()?.name).toBe('small');
  });

  it('createOrgQuota POSTs body to /cf/organization_quotas/:cnsi', () => {
    const body = { name: 'big', apps: { total_memory_in_mb: 4096 } };
    service.createOrgQuota('cnsi-1', body).subscribe();

    const req = httpMock.expectOne('/pp/v1/cf/organization_quotas/cnsi-1');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ guid: 'q-new', name: 'big' });
  });

  it('updateOrgQuota PATCHes body to /cf/organization_quotas/:cnsi/:guid', () => {
    service.updateOrgQuota('cnsi-1', 'q-1', { name: 'renamed' }).subscribe();
    const req = httpMock.expectOne('/pp/v1/cf/organization_quotas/cnsi-1/q-1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'renamed' });
    req.flush({ guid: 'q-1', name: 'renamed' });
  });

  it('createSpaceQuota POSTs body to /cf/space_quotas/:cnsi', () => {
    const body = {
      name: 'sq',
      relationships: { organization: { data: { guid: 'org-1' } } },
    };
    service.createSpaceQuota('cnsi-1', body).subscribe();
    const req = httpMock.expectOne('/pp/v1/cf/space_quotas/cnsi-1');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ guid: 'sq-new', name: 'sq' });
  });

  it('updateSpaceQuota PATCHes to /cf/space_quotas/:cnsi/:guid', () => {
    service.updateSpaceQuota('cnsi-1', 'sq-1', { name: 'renamed' }).subscribe();
    const req = httpMock.expectOne('/pp/v1/cf/space_quotas/cnsi-1/sq-1');
    expect(req.request.method).toBe('PATCH');
    req.flush({ guid: 'sq-1', name: 'renamed' });
  });
});
