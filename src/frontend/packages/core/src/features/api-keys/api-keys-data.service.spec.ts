import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpTestingController } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { BASE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { ApiKeysDataService } from './api-keys-data.service';

describe('ApiKeysDataService.create', () => {
  let http: HttpTestingController;
  let service: ApiKeysDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...BASE_TEST_PROVIDERS, provideZonelessChangeDetection()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ApiKeysDataService);
  });

  it('sends expires_at only when there is one', async () => {
    const withExpiry = service.create('CI', '2027-01-26T12:00:00.000Z');
    const req = http.expectOne('/pp/v1/api_keys');
    expect(req.request.body.get('comment')).toBe('CI');
    expect(req.request.body.get('expires_at')).toBe('2027-01-26T12:00:00.000Z');
    req.flush({ guid: 'a' });
    await withExpiry;

    const never = service.create('CI', null);
    const req2 = http.expectOne('/pp/v1/api_keys');
    expect(req2.request.body.has('expires_at')).toBe(false);
    req2.flush({ guid: 'b' });
    await never;
  });

  it('fails with the backend\'s error message', async () => {
    const result = service.create('CI', '2020-01-01T00:00:00.000Z');
    http.expectOne('/pp/v1/api_keys')
      .flush({ error: 'Expiry must be in the future' }, { status: 400, statusText: 'Bad Request' });
    await expect(result).rejects.toThrow('Expiry must be in the future');
  });
});
