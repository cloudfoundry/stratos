import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';

import { DomainDataService } from './domain-data.service';

describe('DomainDataService', () => {
  let service: DomainDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DomainDataService,
      ],
    });
    service = TestBed.inject(DomainDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // Guard test: the bulk-share affordance must POST the flat decodeBulkGUIDs
  // { guids } body to the domain shared_organizations relationships endpoint.
  // Fails if the wiring (method, URL, or body shape) is removed or regressed
  // to the V3 { data: [{ guid }] } envelope.
  it('shareDomainWithOrgs POSTs { guids } to the shared_organizations endpoint', () => {
    let emitted = false;
    service.shareDomainWithOrgs('cnsi-1', 'dom-1', ['org-a', 'org-b']).subscribe(() => {
      emitted = true;
    });

    const req = httpMock.expectOne(
      '/pp/v1/cf/domains/cnsi-1/dom-1/relationships/shared_organizations',
    );
    expect(req.request.method).toBe('POST');
    // Flat guids array — the backend builds the V3 relationship envelope.
    expect(req.request.body).toEqual({ guids: ['org-a', 'org-b'] });

    req.flush({ data: [{ guid: 'org-a' }, { guid: 'org-b' }] });
    expect(emitted).toBe(true);
  });
});
