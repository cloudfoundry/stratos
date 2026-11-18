import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { UaaSetupDataService } from './uaa-setup-data.service';

const CHECK_URL = '/pp/v1/setup/check';

describe('UaaSetupDataService', () => {
  let http: HttpTestingController;
  let service: UaaSetupDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(UaaSetupDataService);
  });

  afterEach(() => http.verify());

  const check = () => service.checkScopes({ local_admin_password: 'not-a-real-one' });

  it('gives Jetstream\'s reason when the check fails', async () => {
    const done = check();
    http.expectOne(CHECK_URL).flush({ error: 'Bad credentials' }, { status: 403, statusText: 'Forbidden' });
    await done;

    expect(service.state()).toMatchObject({
      error: true, setup: false, settingUp: false,
      message: 'Failed to check the UAA credentials. Bad credentials',
    });
  });

  it('gives the message of an upstream error page, not its markup', async () => {
    const done = check();
    // nginx's default 502 page.
    http.expectOne(CHECK_URL).flush(
      '<html>\r\n<head><title>502 Bad Gateway</title></head>\r\n<body>\r\n'
      + '<center><h1>502 Bad Gateway</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n',
      { status: 502, statusText: 'Bad Gateway' },
    );
    await done;

    expect(service.state().message).toBe('Failed to check the UAA credentials. 502 Bad Gateway\nnginx');
  });
});
