import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CfInfoDataService } from './cf-info-data.service';

describe('CfInfoDataService', () => {
  let httpMock: HttpTestingController;
  let service: CfInfoDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = new CfInfoDataService(TestBed.inject(HttpClient), 'cnsi-1');
  });

  afterEach(() => httpMock.verify());

  it('starts empty', () => {
    expect(service.info()).toBeNull();
    expect(service.isLoading()).toBeFalsy();
    expect(service.errors()).toEqual([]);
    expect(service.lastFetched()).toBeNull();
  });

  it('fetches info from the native endpoint', async () => {
    const mockInfo = {
      name: 'Cloud Foundry (adept-dev)',
      api_version: '3.180.0',
      app_ssh_endpoint: 'ssh.adept.dev:2222',
      app_ssh_host_key_fingerprint: 'aa:bb:cc',
      app_ssh_oauth_client: 'ssh-proxy',
    };

    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/info/cnsi-1').flush(mockInfo);
    await Promise.resolve();

    expect(service.info()?.name).toBe('Cloud Foundry (adept-dev)');
    expect(service.info()?.api_version).toBe('3.180.0');
    expect(service.isLoading()).toBeFalsy();
    expect(service.lastFetched()).not.toBeNull();
  });

  it('records error on fetch failure', async () => {
    service.load().subscribe({ error: () => {} });
    httpMock.expectOne('/pp/v1/cf/info/cnsi-1').error(new ErrorEvent('Network error'));
    await Promise.resolve();

    expect(service.info()).toBeNull();
    expect(service.errors().length).toBe(1);
    expect(service.errors()[0].resource).toBe('info');
  });

  it('dedupes concurrent load() calls into one HTTP fan-out', async () => {
    const mockInfo = { name: 'X', api_version: '3.0.0' };

    service.load().subscribe();
    service.load().subscribe();
    service.load().subscribe();

    httpMock.expectOne('/pp/v1/cf/info/cnsi-1').flush(mockInfo);
    await Promise.resolve();

    expect(service.info()?.name).toBe('X');
  });

  it('short-circuits load() once warm', async () => {
    const mockInfo = { name: 'X', api_version: '3.0.0' };
    service.load().subscribe();
    httpMock.expectOne('/pp/v1/cf/info/cnsi-1').flush(mockInfo);
    await Promise.resolve();

    service.load().subscribe();
    httpMock.expectNone('/pp/v1/cf/info/cnsi-1');
  });
});
