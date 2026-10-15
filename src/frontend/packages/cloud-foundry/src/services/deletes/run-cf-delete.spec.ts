import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { answerServiceWrite, RESOLVE_PATHS, serviceWriteContract } from '@test-framework/cf';
import { serviceInstancesEntityType } from '../../cf-entity-types';
import { firstValueFrom, of } from 'rxjs';
import { runCfDelete } from './run-cf-delete';
import { EntityDeleteController } from './entity-delete.controller';
import type { DeleteEvent, DeleteRequest } from './delete-event.types';

function makeHttp(): HttpClient {
  return { delete: vi.fn(() => of(new HttpResponse({ status: 200 }))) } as unknown as HttpClient;
}

function makeController(terminal: Partial<DeleteEvent>) {
  return {
    delete: vi.fn((req: DeleteRequest) => ({
      events$: of(),
      done: Promise.resolve({ ...req, state: 'success', ...terminal } as DeleteEvent),
    })),
  } as unknown as EntityDeleteController & { delete: ReturnType<typeof vi.fn> };
}

describe('runCfDelete', () => {
  it('routes through the controller with the entity identity + DELETE path', async () => {
    const http = makeHttp();
    const controller = makeController({});
    await runCfDelete(controller, http, {
      cnsiGuid: 'c1', entityKind: 'space', deleteGuid: 's1', deleteName: 'demo-space',
      path: '/pp/v1/cf/spaces/c1/s1',
    });

    const req = (controller.delete as any).mock.calls[0][0] as DeleteRequest;
    expect(req.entityKind).toBe('space');
    expect(req.cnsiGuid).toBe('c1');
    expect(req.deleteGuid).toBe('s1');
    expect(req.deleteName).toBe('demo-space');

    await firstValueFrom(req.call());
    expect(http.delete).toHaveBeenCalledWith('/pp/v1/cf/spaces/c1/s1', { observe: 'response' });
  });

  it('defaults deleteName + cnsiName to the guid when omitted', async () => {
    const controller = makeController({});
    await runCfDelete(controller, makeHttp(), {
      cnsiGuid: 'c1', entityKind: 'route', deleteGuid: 'r1', path: '/pp/v1/cf/routes/c1/r1',
    });
    const req = (controller.delete as any).mock.calls[0][0] as DeleteRequest;
    expect(req.deleteName).toBe('r1');
    expect(req.cnsiName).toBe('c1');
  });

  it('throws the terminal error when the delete fails', async () => {
    const boom = new Error('association_not_empty');
    const controller = makeController({ state: 'failure', error: boom });
    await expect(
      runCfDelete(controller, makeHttp(), {
        cnsiGuid: 'c1', entityKind: 'space', deleteGuid: 's1', path: '/pp/v1/cf/spaces/c1/s1',
      }),
    ).rejects.toBe(boom);
  });

  it('throws the terminal error when the delete is blocked', async () => {
    const boom = new Error('CF-AssociationNotEmpty');
    const controller = makeController({ state: 'blocked', reason: 'has-dependents', error: boom });
    await expect(
      runCfDelete(controller, makeHttp(), {
        cnsiGuid: 'c1', entityKind: 'organization', deleteGuid: 'o1', path: '/pp/v1/cf/orgs/c1/o1',
      }),
    ).rejects.toBe(boom);
  });

  it('resolves deleted on success', async () => {
    const controller = makeController({});
    await expect(
      runCfDelete(controller, makeHttp(), {
        cnsiGuid: 'c1', entityKind: 'space', deleteGuid: 's1', path: '/pp/v1/cf/spaces/c1/s1',
      }),
    ).resolves.toBe('deleted');
  });

  it('resolves unknown when the delete ended with an unknown result', async () => {
    const controller = makeController({ state: 'unknown' });
    await expect(
      runCfDelete(controller, makeHttp(), {
        cnsiGuid: 'c1', entityKind: 'space', deleteGuid: 's1', path: '/pp/v1/cf/spaces/c1/s1',
      }),
    ).resolves.toBe('unknown');
  });
});

// Recorded backend answers: deleting a service instance behind a sync or
// async broker, resolved on either path, ends the same way.
describe('runCfDelete — service instance, recorded backend answers', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  for (const broker of ['sync', 'async']) {
    for (const path of RESOLVE_PATHS) {
      it(`deletes: ${broker} broker, ${path} path`, async () => {
        const httpMock = TestBed.inject(HttpTestingController);
        const done = runCfDelete(TestBed.inject(EntityDeleteController), TestBed.inject(HttpClient), {
          cnsiGuid: 'cnsi-1', entityKind: serviceInstancesEntityType, deleteGuid: 'si-1',
          path: '/pp/v1/cf/service_instances/cnsi-1/si-1',
        });
        await answerServiceWrite(httpMock, '/pp/v1/cf/service_instances/cnsi-1/si-1', serviceWriteContract(`${broker}-service-instance-delete`), path);

        await expect(done).resolves.toBe('deleted');
      });
    }
  }
});
