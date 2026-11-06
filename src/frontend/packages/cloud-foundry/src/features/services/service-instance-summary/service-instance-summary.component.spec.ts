import { provideZonelessChangeDetection, signal, Signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ServiceInstanceSummaryComponent } from './service-instance-summary.component';
import { ServiceCatalogDataService, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EntityDeleteController } from '../../../services/deletes/entity-delete.controller';
import {
  CfServiceInstancesSignalConfigService,
} from '../../../shared/signal-list-configs/service-instance/cf-service-instances-signal-config.service';
import { StServiceInstance } from '../../../services/endpoint-data/stratos-types';
import { ConfirmationDialogService, TailwindDialogService, TailwindSnackBarService } from '@stratosui/core';
import { ShareServiceInstanceDialogComponent } from './share-service-instance-dialog.component';

function source<T>(value: T, error: unknown = null): SignalSource<T> {
  return {
    value: signal(value).asReadonly(),
    isLoading: signal(false).asReadonly(),
    error: signal(error).asReadonly() as Signal<never>,
  };
}

const managed = { guid: 'si-1', name: 'db', type: 'managed' } as unknown as StServiceInstance;

describe('ServiceInstanceSummaryComponent — Parameters / Credentials sections', () => {
  let catalog: {
    serviceInstance: ReturnType<typeof vi.fn>;
    serviceBindingsForInstance: ReturnType<typeof vi.fn>;
    serviceInstanceParameters: ReturnType<typeof vi.fn>;
    userProvidedCredentials: ReturnType<typeof vi.fn>;
    shareServiceInstanceWithSpaces: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };

  function build(instance: StServiceInstance = managed) {
    catalog = {
      serviceInstance: vi.fn(() => source<StServiceInstance | null>(instance)),
      serviceBindingsForInstance: vi.fn(() => source([])),
      serviceInstanceParameters: vi.fn(() => source<Record<string, unknown> | null>({ a: 1 })),
      userProvidedCredentials: vi.fn(() => source<Record<string, unknown> | null>({ password: 's3cr3t' })),
      shareServiceInstanceWithSpaces: vi.fn(),
    };
    dialog = { open: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ServiceInstanceSummaryComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ServiceCatalogDataService, useValue: catalog },
        { provide: EndpointDataRegistry, useValue: { acquire: vi.fn(), release: vi.fn() } },
        { provide: EntityDeleteController, useValue: {} },
        { provide: CfServiceInstancesSignalConfigService, useValue: {} },
        { provide: ConfirmationDialogService, useValue: {} },
        { provide: TailwindSnackBarService, useValue: {} },
        { provide: TailwindDialogService, useValue: dialog },
      ],
    });
    return TestBed.createComponent(ServiceInstanceSummaryComponent).componentInstance;
  }

  const ups = { guid: 'si-2', name: 'ups', type: 'user-provided' } as unknown as StServiceInstance;

  beforeEach(() => TestBed.resetTestingModule());

  it('does not fetch parameters until the section is expanded', () => {
    const c = build();
    expect(catalog.serviceInstanceParameters).not.toHaveBeenCalled();

    c.toggleParams();
    expect(catalog.serviceInstanceParameters).toHaveBeenCalledTimes(1);
    expect(c.isParamsOpen()).toBe(true);

    // Collapsing then re-expanding must not refetch.
    c.toggleParams();
    c.toggleParams();
    expect(catalog.serviceInstanceParameters).toHaveBeenCalledTimes(1);
  });

  it('does not fetch credentials until the section is expanded', () => {
    const c = build();
    expect(catalog.userProvidedCredentials).not.toHaveBeenCalled();

    c.toggleCreds();
    expect(catalog.userProvidedCredentials).toHaveBeenCalledTimes(1);
  });

  it('distinguishes an empty params object from a broker error', () => {
    const c = build();
    // Empty object → "no parameters", not "unavailable".
    catalog.serviceInstanceParameters.mockReturnValueOnce(source<Record<string, unknown> | null>({}));
    c.toggleParams();
    expect(c.paramsEmpty()).toBe(true);
    expect(c.paramsUnavailable()).toBe(false);
  });

  it('flags a broker error as unavailable', () => {
    const c = build();
    catalog.serviceInstanceParameters.mockReturnValueOnce(
      source<Record<string, unknown> | null>(null, { status: 502 }),
    );
    c.toggleParams();
    expect(c.paramsUnavailable()).toBe(true);
    expect(c.paramsEmpty()).toBe(false);
  });

  it('derives masked credential fields from the fetched credentials', () => {
    const c = build();
    c.toggleCreds();
    const fields = c.credentialFields();
    const pw = fields.find(f => f.key === 'password')!;
    expect(pw.sensitive).toBe(true);
    expect(pw.displayMasked).toBe('••••••••');
  });

  // Guard: the "Share to spaces" affordance must exist and be wired to the
  // share dialog for managed instances. If openShareToSpaces or its dialog
  // wiring is removed, this fails.
  it('opens the share-to-spaces dialog for a managed instance', () => {
    const c = build(managed);
    expect(c.canShare()).toBe(true);

    c.openShareToSpaces();
    expect(dialog.open).toHaveBeenCalledTimes(1);
    const [component, config] = dialog.open.mock.calls[0];
    expect(component).toBe(ShareServiceInstanceDialogComponent);
    // siName is derived from the loaded instance (route-param guids aren't
    // populated in this harness, so assert on the instance-sourced field).
    expect(config.data.siName).toBe('db');
    expect('siGuid' in config.data).toBe(true);
    expect('cfGuid' in config.data).toBe(true);
  });

  // Guard: share is managed-only — CF rejects sharing a user-provided
  // instance, so the affordance must be gated off for UPS.
  it('does not offer share for a user-provided instance', () => {
    const c = build(ups);
    expect(c.canShare()).toBe(false);
  });
});
