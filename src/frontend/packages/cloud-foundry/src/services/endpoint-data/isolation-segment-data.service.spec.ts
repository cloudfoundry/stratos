import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';

import { IsolationSegmentDataService } from './isolation-segment-data.service';

describe('IsolationSegmentDataService', () => {
  let service: IsolationSegmentDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        IsolationSegmentDataService,
      ],
    });
    service = TestBed.inject(IsolationSegmentDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // Guard test: the bulk-entitle affordance must POST the flat
  // decodeBulkGUIDs { guids } body to the isolation-segment relationships
  // endpoint. Fails if the wiring (method, URL, or body shape) is removed or
  // regressed to the V3 { data: [{ guid }] } envelope.
  it('entitleOrgsToIsoSegment POSTs { guids } to the relationships endpoint', () => {
    let emitted = false;
    service.entitleOrgsToIsoSegment('cnsi-1', 'iso-1', ['org-a', 'org-b']).subscribe(() => {
      emitted = true;
    });

    const req = httpMock.expectOne(
      '/pp/v1/cf/isolation_segments/cnsi-1/iso-1/relationships/organizations',
    );
    expect(req.request.method).toBe('POST');
    // Flat guids array — the backend builds the V3 relationship envelope.
    expect(req.request.body).toEqual({ guids: ['org-a', 'org-b'] });

    req.flush({ data: [{ guid: 'org-a' }, { guid: 'org-b' }] });
    expect(emitted).toBe(true);
  });
});
