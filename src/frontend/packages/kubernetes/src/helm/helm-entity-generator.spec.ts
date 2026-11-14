import { Injector, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthDataService } from '@stratosui/store';
import { describe, expect, it } from 'vitest';

import { generateHelmEntities } from './helm-entity-generator';
import { HELM_HUB_ENDPOINT_TYPE } from './helm-entity-factory';

describe('Artifact Hub registered limit', () => {
  const sessionData = signal<unknown>(null);
  const limit = () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthDataService, useValue: { sessionData } },
      ],
    });
    const helm = generateHelmEntities()[0] as any;
    const hub = helm.definition.subTypes.find((t: any) => t.type === HELM_HUB_ENDPOINT_TYPE);
    return hub.registeredLimit(TestBed.inject(Injector));
  };

  it('is not known until the session carries the plugin config', () => {
    sessionData.set(null);
    const hubLimit = limit();
    expect(hubLimit()).toBeNull();

    sessionData.set({ 'plugin-config': {} });
    expect(hubLimit()).toBe(1);
  });

  it('is none when the hub is disabled', () => {
    sessionData.set({ 'plugin-config': { artifactHubDisabled: 'true' } });
    expect(limit()()).toBe(0);
  });
});
