import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OrgDataService } from './org-data.service';

describe('OrgDataService', () => {
  let httpMock: HttpTestingController;
  let service: OrgDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = new OrgDataService(TestBed.inject(HttpClient), 'cnsi-1', 'org-1');
  });

  afterEach(() => httpMock.verify());

  it('starts with null org, empty spaces, isLoading false', () => {
    expect(service.org()).toBeNull();
    expect(service.spaces()).toEqual([]);
    expect(service.isLoading()).toBeFalsy();
    expect(service.errors()).toEqual([]);
  });

  it('fetches org detail and spaces in parallel', async () => {
    const mockOrg = { guid: 'org-1', name: 'My Org', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] };
    const mockSpaces = [{ guid: 'sp-1', name: 'Space One', orgGuid: 'org-1', createdAt: '', updatedAt: '' }];

    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(mockOrg);
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1/spaces').flush({ resources: mockSpaces, totalResults: 1 });
    await Promise.resolve();

    expect(service.org()?.name).toBe('My Org');
    expect(service.spaces().length).toBe(1);
    expect(service.spaceCount()).toBe(1);
    expect(service.isLoading()).toBeFalsy();
  });

  it('retains org when spaces fetch fails', async () => {
    const mockOrg = { guid: 'org-1', name: 'My Org', status: 'active', labels: {}, annotations: {}, createdAt: '', updatedAt: '', spaces: [] };

    service.load().subscribe({ error: () => {} });
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1').flush(mockOrg);
    httpMock.expectOne('/pp/v1/cf/org/cnsi-1/org-1/spaces').error(new ErrorEvent('Network error'));
    await Promise.resolve();

    expect(service.org()?.name).toBe('My Org');
    expect(service.errors().length).toBe(1);
    expect(service.errors()[0].resource).toBe('spaces');
    expect(service.isLoading()).toBeFalsy();
  });
});
