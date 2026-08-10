import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ShapeMeasureService, TOTALS_PROBES } from './shape-measure.service';

describe('ShapeMeasureService', () => {
  let service: ShapeMeasureService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideZonelessChangeDetection()],
    });
    service = TestBed.inject(ShapeMeasureService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('states the totals cost as one request per probe', () => {
    expect(service.totalsCost()).toBe(`${TOTALS_PROBES.length} requests`);
  });

  describe('measureTotals', () => {
    it('probes every ecosystem resource with return=counts and records the counts', () => {
      service.measureTotals('cf-1');
      expect(service.inFlight().has('cf-1:totals')).toBe(true);

      for (const probe of TOTALS_PROBES) {
        const req = httpMock.expectOne(`/pp/v1/cf/${probe.path}/cf-1?return=counts`);
        req.flush({ totalResults: 7 });
      }
      httpMock.verify();

      const measured = service.totals().get('cf-1');
      expect(measured?.counts['buildpacks']).toBe(7);
      expect(measured?.counts['users']).toBe(7);
      expect(Object.keys(measured?.counts ?? {})).toHaveLength(TOTALS_PROBES.length);
      expect(measured?.fetchedAt).toBeInstanceOf(Date);
      expect(service.inFlight().has('cf-1:totals')).toBe(false);
    });

    it('records a failed probe as null without losing the others', () => {
      service.measureTotals('cf-1');
      for (const probe of TOTALS_PROBES) {
        const req = httpMock.expectOne(`/pp/v1/cf/${probe.path}/cf-1?return=counts`);
        if (probe.key === 'security_groups') {
          req.flush('nope', { status: 502, statusText: 'Bad Gateway' });
        } else {
          req.flush({ totalResults: 3 });
        }
      }
      const measured = service.totals().get('cf-1');
      expect(measured?.counts['security_groups']).toBeNull();
      expect(measured?.counts['stacks']).toBe(3);
    });

    it('ignores a re-measure while one is in flight', () => {
      service.measureTotals('cf-1');
      service.measureTotals('cf-1');
      for (const probe of TOTALS_PROBES) {
        const req = httpMock.expectOne(`/pp/v1/cf/${probe.path}/cf-1?return=counts`);
        req.flush({ totalResults: 1 });
      }
      httpMock.verify(); // a second round of probes would fail expectOne above
    });
  });

  describe('measureEcosystem', () => {
    it('drains stack and buildpack definitions into name lists', () => {
      service.measureEcosystem('cf-1');
      httpMock.expectOne('/pp/v1/cf/stacks/cf-1').flush({
        resources: [{ name: 'cflinuxfs4' }, { name: 'cflinuxfs3' }],
        totalResults: 2,
      });
      httpMock.expectOne('/pp/v1/cf/buildpacks/cf-1').flush({
        resources: [{ name: 'ruby_buildpack' }, { name: 'go_buildpack' }, { name: 'ruby_buildpack' }],
        totalResults: 3,
      });

      const measured = service.ecosystem().get('cf-1');
      expect(measured?.stacksDefined).toEqual(['cflinuxfs4', 'cflinuxfs3']);
      // Duplicate names are real (same buildpack on multiple stacks) — keep them.
      expect(measured?.buildpacksDefined).toEqual(['ruby_buildpack', 'go_buildpack', 'ruby_buildpack']);
      expect(service.inFlight().has('cf-1:ecosystem')).toBe(false);
    });

    it('drops the result entirely when a drain fails', () => {
      service.measureEcosystem('cf-1');
      httpMock.expectOne('/pp/v1/cf/stacks/cf-1').flush('nope', { status: 502, statusText: 'Bad Gateway' });
      httpMock.expectOne('/pp/v1/cf/buildpacks/cf-1').flush({ resources: [], totalResults: 0 });
      expect(service.ecosystem().get('cf-1')).toBeUndefined();
      expect(service.inFlight().has('cf-1:ecosystem')).toBe(false);
    });
  });

  describe('measureRoles', () => {
    it('takes the whole users-and-roles join in one request', () => {
      expect(service.rolesCost()).toBe('1 request');
      service.measureRoles('cf-1');
      expect(service.inFlight().has('cf-1:roles')).toBe(true);

      httpMock.expectOne('/pp/v1/cf/users/cf-1').flush({
        resources: [{ guid: 'u1', username: 'alice', cnsiGuid: 'cf-1', orgRoles: [{ orgGuid: 'o1', roles: ['org_manager'] }], spaceRoles: [] }],
        totalResults: 1,
      });
      httpMock.verify();

      const measured = service.roles().get('cf-1');
      expect(measured?.users.map(u => u.username)).toEqual(['alice']);
      expect(measured?.fetchedAt).toBeInstanceOf(Date);
      expect(service.inFlight().has('cf-1:roles')).toBe(false);
    });

    it('records nothing when the fetch fails, so failure never reads as "no grants"', () => {
      service.measureRoles('cf-1');
      httpMock.expectOne('/pp/v1/cf/users/cf-1').flush('nope', { status: 403, statusText: 'Forbidden' });
      expect(service.roles().get('cf-1')).toBeUndefined();
      expect(service.inFlight().has('cf-1:roles')).toBe(false);
    });

    it('distinguishes a foundation with no users from a failure', () => {
      service.measureRoles('cf-1');
      httpMock.expectOne('/pp/v1/cf/users/cf-1').flush({ resources: [], totalResults: 0 });
      expect(service.roles().get('cf-1')?.users).toEqual([]);
    });
  });
});
