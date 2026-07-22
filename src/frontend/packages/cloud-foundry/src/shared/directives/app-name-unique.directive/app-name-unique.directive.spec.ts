import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { createBasicStoreModule } from '@stratosui/store/testing';
import { CreateAppStateService } from '../../data-services/create-app-state.service';
import { AppNameUniqueDirective } from './app-name-unique.directive';

describe('AppNameUniqueDirective', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
  });
  it('should create an instance', () => {
    const directive = TestBed.runInInjectionContext(() => new AppNameUniqueDirective());
    expect(directive).toBeTruthy();
  });

  function setupValidation(name: string) {
    TestBed.inject(CreateAppStateService).setCFDetails({ cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' });
    const directive = TestBed.runInInjectionContext(() => new AppNameUniqueDirective());
    directive.ngOnInit();
    const control = new FormControl(name);
    control.markAsDirty();
    return firstValueFrom(directive.validate(control));
  }

  // Real 500ms debounce timer — zoneless build has no fakeAsync/tick.
  const debounce = () => new Promise(resolve => setTimeout(resolve, 550));

  it('counts apps by name via the native v3 route and flags taken names', async () => {
    const http = TestBed.inject(HttpTestingController);
    const result = setupValidation('my-app');

    await debounce();
    const req = http.expectOne(r =>
      r.url === '/pp/v1/cf/apps/cf-1' &&
      r.params.get('return') === 'counts' &&
      r.params.get('names') === 'my-app' &&
      r.params.get('space_guids') === 'space-1');
    req.flush({ resources: [], totalResults: 1 });

    expect(await result).toEqual({ appNameTaken: true });
    http.verify();
  });

  it('fails open when the check request errors', async () => {
    const http = TestBed.inject(HttpTestingController);
    const result = setupValidation('my-app');

    await debounce();
    http.expectOne(r => r.url === '/pp/v1/cf/apps/cf-1')
      .flush({ error: 'nope' }, { status: 500, statusText: 'Server Error' });

    expect(await result).toBeNull();
    http.verify();
  });
});
