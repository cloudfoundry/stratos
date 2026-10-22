import { provideZonelessChangeDetection, signal, Signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';

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

// A delete or unbind that ends with an unknown result must not act as if it
// worked: the page stays, says so, and re-reads what it shows.
describe('ServiceInstanceSummaryComponent — unknown results', () => {
  let catalog: {
    serviceInstance: ReturnType<typeof vi.fn>;
    serviceBindingsForInstance: ReturnType<typeof vi.fn>;
  };
  let router: Router;
  let snackBar: { error: ReturnType<typeof vi.fn> };
  let confirmed: (() => Promise<void>) | undefined;

  function build(opts: { deleteOutcome?: string; unbindState?: string }) {
    catalog = {
      serviceInstance: vi.fn(() => source<StServiceInstance | null>(managed)),
      serviceBindingsForInstance: vi.fn(() => source([])),
    };
    snackBar = { error: vi.fn() };
    confirmed = undefined;
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
        {
          provide: EntityDeleteController,
          useValue: { delete: vi.fn(() => ({ events$: of(), done: Promise.resolve({ state: opts.unbindState ?? 'success' }) })) },
        },
        {
          provide: CfServiceInstancesSignalConfigService,
          useValue: { deleteServiceInstance: vi.fn().mockResolvedValue(opts.deleteOutcome ?? 'deleted') },
        },
        { provide: ConfirmationDialogService, useValue: { open: vi.fn((_c: unknown, cb: () => Promise<void>) => { confirmed = cb; }) } },
        { provide: TailwindSnackBarService, useValue: snackBar },
        { provide: TailwindDialogService, useValue: { open: vi.fn() } },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    return TestBed.createComponent(ServiceInstanceSummaryComponent).componentInstance;
  }

  const runDelete = async (c: ServiceInstanceSummaryComponent): Promise<void> => {
    c.runAction(c.actions().find(a => a.label === 'Delete')!);
    await confirmed!();
  };

  beforeEach(() => TestBed.resetTestingModule());

  it('navigates back to the services list after a delete', async () => {
    const c = build({ deleteOutcome: 'deleted' });
    await runDelete(c);
    expect(router.navigate).toHaveBeenCalledWith(['/services']);
    expect(snackBar.error).not.toHaveBeenCalled();
  });

  it('stays on the page, says the result is unknown and re-reads the instance', async () => {
    const c = build({ deleteOutcome: 'unknown' });
    await runDelete(c);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(snackBar.error).toHaveBeenCalledWith(
      'Delete "db": the operation ended, but its result could not be determined. This page shows the current state.',
    );
    expect(catalog.serviceInstance).toHaveBeenCalledTimes(2);
  });

  it('says an unbind result is unknown and re-reads the bindings', async () => {
    const c = build({ unbindState: 'unknown' });
    c.unbind({ guid: 'b-1', appName: 'my-app' });
    await confirmed!();
    expect(snackBar.error).toHaveBeenCalledWith(
      'Unbind "my-app": the operation ended, but its result could not be determined. This page shows the current state.',
    );
    expect(catalog.serviceBindingsForInstance).toHaveBeenCalledTimes(2);
  });
});

describe('ServiceInstanceSummaryComponent — operation in progress (#6002)', () => {
  // A read the test settles by hand: loading until resolve() is called.
  function pendingRead() {
    const value = signal<StServiceInstance | null>(null);
    const isLoading = signal(true);
    return {
      source: { value: value.asReadonly(), isLoading: isLoading.asReadonly(), error: signal(null).asReadonly() } as SignalSource<StServiceInstance | null>,
      resolve: (si: StServiceInstance) => { value.set(si); isLoading.set(false); },
    };
  }
  const withState = (state: string) =>
    ({ ...managed, lastOperation: { type: 'update', state, description: '' } }) as unknown as StServiceInstance;

  let reads: Array<ReturnType<typeof pendingRead>>;

  function build(first: StServiceInstance) {
    reads = [];
    const catalog = {
      serviceInstance: vi.fn(() => {
        const read = pendingRead();
        reads.push(read);
        if (reads.length === 1) read.resolve(first);
        return read.source;
      }),
      serviceBindingsForInstance: vi.fn(() => source([])),
    };
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
        { provide: TailwindDialogService, useValue: { open: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ServiceInstanceSummaryComponent);
    TestBed.tick();
    return fixture;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('re-reads the instance every 10 s while its operation is in progress', async () => {
    build(withState('in progress'));
    await vi.advanceTimersByTimeAsync(10000);
    expect(reads.length).toBe(2);

    reads[1].resolve(withState('in progress'));
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(10000);
    expect(reads.length).toBe(3);
  });

  it('stops re-reading once the operation ends', async () => {
    build(withState('in progress'));
    await vi.advanceTimersByTimeAsync(10000);
    reads[1].resolve(withState('succeeded'));
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(60000);
    expect(reads.length).toBe(2);
  });

  it('keeps showing the instance while a re-read is loading', async () => {
    const fixture = build(withState('in progress'));
    const page = fixture.componentInstance;
    await vi.advanceTimersByTimeAsync(10000);
    TestBed.tick();
    expect(reads[1].source.isLoading()).toBe(true);
    expect(page.loading()).toBe(false);
    expect(page.view()?.lastOperation).toBe('Update in progress');
  });

  // CF reports a queued operation as "initial" before "in progress".
  it('re-reads the instance while its operation is queued', async () => {
    build(withState('initial'));
    await vi.advanceTimersByTimeAsync(10000);
    expect(reads.length).toBe(2);
  });

  it('does not re-read an instance with no operation in progress', async () => {
    build(withState('succeeded'));
    await vi.advanceTimersByTimeAsync(60000);
    expect(reads.length).toBe(1);
  });

  it('stops re-reading when the page closes', async () => {
    const fixture = build(withState('in progress'));
    fixture.destroy();
    await vi.advanceTimersByTimeAsync(60000);
    expect(reads.length).toBe(1);
  });
});

describe('ServiceInstanceSummaryComponent — last operation (#6002)', () => {
  async function renderElement(si: StServiceInstance): Promise<HTMLElement> {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ServiceInstanceSummaryComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: ServiceCatalogDataService,
          useValue: { serviceInstance: vi.fn(() => source<StServiceInstance | null>(si)), serviceBindingsForInstance: vi.fn(() => source([])) },
        },
        { provide: EndpointDataRegistry, useValue: { acquire: vi.fn(), release: vi.fn() } },
        { provide: EntityDeleteController, useValue: {} },
        { provide: CfServiceInstancesSignalConfigService, useValue: {} },
        { provide: ConfirmationDialogService, useValue: {} },
        { provide: TailwindSnackBarService, useValue: {} },
        { provide: TailwindDialogService, useValue: { open: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ServiceInstanceSummaryComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }
  const render = async (si: StServiceInstance): Promise<string> =>
    (await renderElement(si)).textContent!.replace(/\s+/g, ' ');
  const withOp = (type: string, state: string, description: string) =>
    ({ ...managed, lastOperation: { type, state, description } }) as unknown as StServiceInstance;

  it('names the operation and shows a failure\'s reason as text, markup stripped', async () => {
    const text = await render(withOp('update', 'failed', '<p>Plan <b>large</b> is not available</p>'));
    expect(text).toContain('Last operation: Update failed Plan large is not available');
    expect(text).not.toContain('<b>');
  });

  it('does not show the description of an operation that did not fail', async () => {
    const text = await render(withOp('create', 'succeeded', 'Provisioned in 3 s'));
    expect(text).toContain('Last operation: Create succeeded');
    expect(text).not.toContain('Provisioned in 3 s');
  });

  it('hides the line when there is no last operation', async () => {
    expect(await render(managed)).not.toContain('Last operation');
  });

  it('shows an HTML error page in the reason as its heading and message', async () => {
    const page = '<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center>'
      + '<hr><center>nginx</center></body></html>';
    const el = await renderElement(withOp('create', 'failed', page));
    expect(el.textContent!.replace(/\s+/g, ' ')).toContain('Last operation: Create failed 502 Bad Gateway nginx');
    const heading = el.querySelector('app-error-text .font-semibold');
    expect(heading?.textContent).toBe('502 Bad Gateway');
    expect(el.querySelector('app-error-text')?.textContent).toBe('502 Bad Gateway\nnginx');
  });

  // The value column is right-aligned by meta-card-item's own CSS, which is
  // unlayered and so beats any utility on the column itself. The reason is
  // its own block under the state, with the utilities on it: the column's
  // rule reaches it only by inheritance, which a value set on the element
  // always beats, layered or not. Specs load no component styles or
  // Tailwind, and happy-dom has no @layer, so the rule and the two
  // utilities are added here as plain rules.
  it('puts a failure\'s reason on its own line, left-aligned', async () => {
    const page = '<html><body><center><h1>502 Bad Gateway</h1></center><hr><center>nginx</center></body></html>';
    const el = await renderElement(withOp('create', 'failed', page));
    const reason = el.querySelector<HTMLElement>('app-error-text')!;
    const css = document.createElement('style');
    css.textContent = '.meta-card-item__value { text-align: end; } .block { display: block; } .text-left { text-align: left; }';
    document.head.append(css);
    try {
      expect(getComputedStyle(reason.closest('.meta-card-item__value')!).textAlign).toBe('end');
      expect(getComputedStyle(reason).display).toBe('block');
      expect(getComputedStyle(reason).textAlign).toBe('left');
    } finally {
      css.remove();
    }
  });
});
