import { HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EndpointModel,
  EndpointsDataService,
  EntityCatalogHelper,
  EntityCatalogHelpers,
  StratosCatalogEndpointEntity,
  entityCatalog,
  generateStratosEntities,
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';

import { EndpointCertificatesService } from '../../certificates/endpoint-certificates.service';
import { EndpointPermissionsService } from '../../endpoint-permissions.service';
import { EndpointsSignalConfigService } from '../../endpoints-page/endpoints-signal-config.service';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1.component';

const BROKERS_URL = (cf: string) => `/pp/v1/cf/service_brokers/${cf}?return=base`;

function cf(guid: string, host: string): EndpointModel {
  return {
    guid, name: guid, cnsi_type: 'cf',
    api_endpoint: { Scheme: 'https', Host: host, Path: '' },
    creator: { name: 'admin', admin: true, system: true },
  } as EndpointModel;
}

// An autoscaler serves one Cloud Foundry, on that Cloud Foundry's domain:
// the Register step asks which, and which of its service brokers it is.
describe('CreateEndpointCfStep1Component: a type linked to a Cloud Foundry', () => {
  let fixture: ComponentFixture<CreateEndpointCfStep1Component>;
  let component: CreateEndpointCfStep1Component;
  let register: ReturnType<typeof vi.fn>;
  let http: HttpTestingController;

  beforeEach(async () => {
    register = vi.fn().mockResolvedValue({ busy: false, error: false, message: 'as-guid', guid: 'as-guid' });
    (entityCatalog as any).clear();
    generateStratosEntities().forEach(entity => entityCatalog.register(entity));
    entityCatalog.register(new StratosCatalogEndpointEntity({
      type: 'autoscaler', label: 'Cloud Foundry Autoscaler', labelPlural: 'Cloud Foundry Autoscalers',
      logoUrl: '', authTypes: [], unConnectable: true, linkedToCf: true, renderPriority: 2,
    }));

    await TestBed.configureTestingModule({
      imports: [createBasicStoreModule(), CreateEndpointCfStep1Component],
      providers: [
        { provide: EndpointsSignalConfigService, useValue: { register, unregister: vi.fn() } },
        { provide: EndpointPermissionsService, useValue: { canManage: vi.fn().mockReturnValue(true) } },
        {
          provide: EndpointCertificatesService,
          useValue: { decode: vi.fn().mockResolvedValue([]), checkTrust: vi.fn().mockResolvedValue([]) },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {}, params: { type: 'autoscaler' } } } },
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();
    EntityCatalogHelpers.SetEntityCatalogHelper(TestBed.inject(EntityCatalogHelper));
    http = TestBed.inject(HttpTestingController);
  });

  async function open(...cfs: EndpointModel[]) {
    (TestBed.inject(EndpointsDataService) as any)._endpoints.set(new Map(cfs.map(e => [e.guid, e])));
    fixture = TestBed.createComponent(CreateEndpointCfStep1Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  async function typeUrl(value: string) {
    const root: HTMLElement = fixture.nativeElement;
    component.registerForm.controls.nameField.setValue('lab autoscaler');
    const url = root.querySelector('#url') as HTMLInputElement;
    url.value = value;
    url.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  }

  const select = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`#${id}`) as HTMLSelectElement | null;
  const options = (id: string) => Array.from(select(id)?.options ?? []).map(o => o.textContent!.trim());
  const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
  const valid = () => firstValueFrom(component.validate);

  async function brokers(cfGuid: string, resources: { guid: string; name: string; url: string }[] | 'fail') {
    const req = http.expectOne(BROKERS_URL(cfGuid));
    if (resources === 'fail') {
      req.flush({ error: 'no token for endpoint' }, { status: 403, statusText: 'Forbidden' });
    } else {
      req.flush({ resources, totalResults: resources.length });
    }
    await fixture.whenStable();
  }

  it('lists only the Cloud Foundry endpoints on the address\'s domain, and picks the only one', async () => {
    await open(cf('lab', 'api.sys.x.com'), cf('other', 'api.sys.y.com'));
    await typeUrl('https://autoscaler.sys.x.com');
    await brokers('lab', []);

    expect(options('linked-cf')).toEqual(['lab']);
    expect(select('linked-cf')!.value).toBe('lab');
    expect(await valid()).toBe(true);
  });

  it('asks which Cloud Foundry when two are on the domain', async () => {
    await open(cf('lab', 'api.sys.x.com'), cf('lab-2', 'api.sys.x.com:443'));
    await typeUrl('autoscaler.sys.x.com');

    expect(options('linked-cf')).toEqual(['Choose a Cloud Foundry', 'lab', 'lab-2']);
    expect(await valid()).toBe(false);
    http.expectNone(r => r.url.startsWith('/pp/v1/cf/service_brokers'));

    select('linked-cf')!.value = 'lab-2';
    select('linked-cf')!.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    await brokers('lab-2', []);
    expect(await valid()).toBe(true);
  });

  it('says to register the Cloud Foundry first when none is on the domain', async () => {
    await open(cf('other', 'api.sys.y.com'));
    await typeUrl('https://autoscaler.sys.x.com');

    expect(select('linked-cf')).toBeNull();
    expect(text()).toContain(
      'Register the Cloud Foundry this autoscaler serves first: no registered Cloud Foundry is on sys.x.com');
    expect(await valid()).toBe(false);
  });

  it('picks the broker named after the address, and offers none', async () => {
    await open(cf('lab', 'api.sys.x.com'));
    await typeUrl('https://autoscaler.sys.x.com');
    await brokers('lab', [
      { guid: 'b9', name: 'mysql', url: 'https://mysql-broker.sys.x.com' },
      { guid: 'b1', name: 'autoscaler', url: 'https://autoscalerservicebroker.sys.x.com' },
    ]);

    expect(options('linked-broker')).toEqual(['Not registered in Cloud Foundry yet', 'mysql', 'autoscaler']);
    expect(select('linked-broker')!.value).toBe('b1');
  });

  it('offers only "not registered yet" when the brokers cannot be read', async () => {
    await open(cf('lab', 'api.sys.x.com'));
    await typeUrl('https://autoscaler.sys.x.com');
    await brokers('lab', 'fail');

    expect(options('linked-broker')).toEqual(['Not registered in Cloud Foundry yet']);
    expect(await valid()).toBe(true);
  });

  it('registers with the Cloud Foundry and broker chosen', async () => {
    await open(cf('lab', 'api.sys.x.com'));
    await typeUrl('https://autoscaler.sys.x.com');
    await brokers('lab', [{ guid: 'b1', name: 'autoscaler', url: 'https://autoscalerservicebroker.sys.x.com' }]);

    await component.onNext();
    expect(register).toHaveBeenCalledWith(expect.objectContaining({
      endpointType: 'autoscaler', cfGuid: 'lab', brokerGuid: 'b1', brokerName: 'autoscaler',
    }));
  });

  it('registers with no broker when "not registered yet" is chosen', async () => {
    await open(cf('lab', 'api.sys.x.com'));
    await typeUrl('https://autoscaler.sys.x.com');
    await brokers('lab', [{ guid: 'b1', name: 'autoscaler', url: 'https://autoscalerservicebroker.sys.x.com' }]);
    select('linked-broker')!.value = '';
    select('linked-broker')!.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    await component.onNext();
    const opts = register.mock.calls[0][0];
    expect(opts.cfGuid).toBe('lab');
    expect(opts.brokerGuid).toBeUndefined();
    expect(opts.brokerName).toBeUndefined();
  });
});
