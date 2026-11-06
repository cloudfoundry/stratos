import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CfIdentityProvidersService, IdentityProvider } from './cf-identity-providers.service';

const CF_GUID = 'cf-1';
const ENDPOINT = `/pp/v1/cf/identity-providers/${CF_GUID}`;

const mkProvider = (originKey: string, type = 'ldap'): IdentityProvider => ({
  originKey,
  type,
  name: `${originKey}-name`,
  active: true,
});

describe('CfIdentityProvidersService', () => {
  let svc: CfIdentityProvidersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CfIdentityProvidersService],
    });
    svc = TestBed.inject(CfIdentityProvidersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps the proxy response to originKeys', async () => {
    const result = firstValueFrom(svc.listOrigins(CF_GUID));
    http.expectOne(ENDPOINT).flush([mkProvider('ldap'), mkProvider('uaa', 'uaa')]);
    expect(await result).toEqual(['ldap', 'uaa']);
  });

  it('emits [] when the proxy returns an error (degrade-to-text)', async () => {
    const result = firstValueFrom(svc.listOrigins(CF_GUID));
    http.expectOne(ENDPOINT).flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    expect(await result).toEqual([]);
  });
});
