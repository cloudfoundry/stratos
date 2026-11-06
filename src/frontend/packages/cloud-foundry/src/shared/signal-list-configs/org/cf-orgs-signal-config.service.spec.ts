import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { CfOrgsSignalConfigService } from './cf-orgs-signal-config.service';
import { EndpointDataRegistry } from '../../../services/endpoint-data/endpoint-data.registry';
import { EntityDeleteController } from '../../../services/deletes/entity-delete.controller';
import type { DeleteEvent, DeleteRequest } from '../../../services/deletes/delete-event.types';

// Construct the service via TestBed so inject() in its field initializers has a
// valid injection context. We stub the heavy collaborators — this spec only
// covers deleteOrg's routing through the EntityDeleteController chokepoint.
function makeSvc(opts: {
  http?: HttpClient;
  controller?: Partial<EntityDeleteController>;
} = {}): { svc: CfOrgsSignalConfigService; controller: { delete: ReturnType<typeof vi.fn>; registerCleanup: ReturnType<typeof vi.fn> }; http: HttpClient } {
  const http = opts.http ?? ({ delete: vi.fn(() => of(new HttpResponse({ status: 200 }))) } as unknown as HttpClient);
  const controller = {
    delete: vi.fn((req: DeleteRequest) => ({
      events$: of(),
      done: Promise.resolve({ ...req, state: 'success' } as DeleteEvent),
    })),
    registerCleanup: vi.fn(),
    ...opts.controller,
  };
  const registry = { acquire: vi.fn(), peek: vi.fn(), release: vi.fn() } as unknown as EndpointDataRegistry;

  TestBed.configureTestingModule({
    providers: [
      { provide: HttpClient, useValue: http },
      { provide: EndpointDataRegistry, useValue: registry },
      { provide: EntityDeleteController, useValue: controller },
      CfOrgsSignalConfigService,
    ],
  });
  return { svc: TestBed.inject(CfOrgsSignalConfigService), controller: controller as never, http };
}

beforeEach(() => TestBed.resetTestingModule());

describe('CfOrgsSignalConfigService.deleteOrg', () => {
  it('routes the delete through EntityDeleteController with org identity', async () => {
    const { svc, controller } = makeSvc();
    await svc.deleteOrg('cnsi-1', 'org-1', 'demo-org');

    expect(controller.delete).toHaveBeenCalledTimes(1);
    const req = controller.delete.mock.calls[0][0] as DeleteRequest;
    expect(req.entityKind).toBe('organization');
    expect(req.cnsiGuid).toBe('cnsi-1');
    expect(req.deleteGuid).toBe('org-1');
    expect(req.deleteName).toBe('demo-org');
  });

  it('issues the org DELETE against the CF v3 path when the call thunk runs', async () => {
    const { svc, controller, http } = makeSvc();
    await svc.deleteOrg('cnsi-1', 'org-1');

    const req = controller.delete.mock.calls[0][0] as DeleteRequest;
    await firstValueFrom(req.call());
    expect(http.delete).toHaveBeenCalledWith('/pp/v1/cf/orgs/cnsi-1/org-1', { observe: 'response' });
  });

  it('works on the cold path — no initialize() call required', async () => {
    // The org summary page deep-links here without the org-list tab ever
    // mounting (so initialize() never ran). The delete must still go through.
    const { svc, controller } = makeSvc();
    await expect(svc.deleteOrg('cnsi-1', 'org-1')).resolves.toBeUndefined();
    expect(controller.delete).toHaveBeenCalledTimes(1);
  });

  it('throws when the controller reports a failure terminal', async () => {
    const boom = new Error('forbidden');
    const { svc } = makeSvc({
      controller: {
        delete: vi.fn((req: DeleteRequest) => ({
          events$: of(),
          done: Promise.resolve({ ...req, state: 'failure', error: boom } as DeleteEvent),
        })),
      } as never,
    });
    await expect(svc.deleteOrg('cnsi-1', 'org-1')).rejects.toBe(boom);
  });
});
