import { computed, Injector, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { EndpointModel } from '../../../../store/src/public-api';
import { EndpointsDataService } from '../../../../store/src/services/endpoints-data.service';
import { GitApiRequest } from './scm-base';
import { GitLabSCM } from './gitlab-scm';

// The SCM gets the root injector from its factory, and getAPI() runs per
// request (the deploy-from-git name check runs it per keystroke), so the
// endpoint lookup must stop watching the endpoint list once it has answered.
describe('BaseSCM endpoint lookup', () => {
  it('stops reading the endpoint list after the request resolves', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const list = signal<EndpointModel[]>([{ guid: 'git-1', user: { name: 'u' } } as EndpointModel]);
    let reads = 0;
    const endpointsData = {
      endpointsList: computed(() => {
        reads++;
        return list();
      }),
    } as unknown as EndpointsDataService;
    const scm = new GitLabSCM('git-1', undefined, endpointsData, TestBed.inject(Injector));

    const requests: GitApiRequest[] = [];
    scm.getAPI().subscribe(r => requests.push(r));
    TestBed.tick();
    expect(requests.map(r => r.url)).toEqual(['/api/v1/proxy/git-1']);
    const readsWhileResolving = reads;

    list.set([]);
    TestBed.tick();
    list.set([{ guid: 'git-1' } as EndpointModel]);
    TestBed.tick();

    expect(reads).toBe(readsWhileResolving);
    expect(requests).toHaveLength(1);
  });
});
