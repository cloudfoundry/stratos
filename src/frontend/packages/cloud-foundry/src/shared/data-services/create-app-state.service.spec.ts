import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { CreateAppStateService, NewAppCFDetails } from './create-app-state.service';

describe('CreateAppStateService', () => {
  let service: CreateAppStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(CreateAppStateService);
  });

  it('defaults to a null CF selection and an empty name', () => {
    expect(service.cloudFoundryDetails()).toBeNull();
    expect(service.name()).toBe('');
  });

  it('setCFDetails stores the selected cf/org/space', () => {
    const details: NewAppCFDetails = { cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' };
    service.setCFDetails(details);
    expect(service.cloudFoundryDetails()).toEqual(details);
  });

  it('setName stores the application name', () => {
    service.setName('my-app');
    expect(service.name()).toBe('my-app');
  });

  it('reset clears the CF selection and the name back to defaults', () => {
    service.setCFDetails({ cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' });
    service.setName('my-app');

    service.reset();

    expect(service.cloudFoundryDetails()).toBeNull();
    expect(service.name()).toBe('');
  });

  it('mirrors the CF selection as an observable for rxjs consumers', async () => {
    const details: NewAppCFDetails = { cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' };
    service.setCFDetails(details);
    expect(await firstValueFrom(service.cloudFoundryDetails$)).toEqual(details);
  });

  it('exposes a combined details+name state observable', async () => {
    const details: NewAppCFDetails = { cloudFoundry: 'cf-1', org: 'org-1', space: 'space-1' };
    service.setCFDetails(details);
    service.setName('my-app');
    expect(await firstValueFrom(service.state$)).toEqual({ cloudFoundryDetails: details, name: 'my-app' });
  });
});
