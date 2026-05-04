import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';

import { JetStreamErrorResponse } from '../../jetstream';
import { JetstreamResponse } from '../entity-request-pipeline.types';
import { handleJetstreamResponsePipeFactory, JetstreamError } from './handle-multi-endpoints.pipe';

describe('handle-multi-endpoint-pipe', () => {
  it(' should handle error and success', () => {
    const url = 'url123';
    const endpoint1Guid = 'endpoint1';
    const endpoint2Guid = 'endpoint2';
    const endpoint3Guid = 'endpoint3';
    const endpoint4Guid = 'endpoint4';
    const endpoint2Res = {
      data1: 'ThisIsData'
    };
    const endpoint4Res = {
      data2: 'ThisIsData5'
    };
    const resData = {
      [endpoint1Guid]: [{
        error: {
          statusCode: 1,
          status: '123'
        },
        errorResponse: 'test'
      } as JetStreamErrorResponse],
      [endpoint3Guid]: [{
        error: {
          statusCode: 12,
          status: '4'
        },
        errorResponse: 'test4324'
      } as JetStreamErrorResponse],
      [endpoint2Guid]: [endpoint2Res],
      [endpoint4Guid]: [endpoint4Res, endpoint4Res]
    } as JetstreamResponse;
    const handled = handleJetstreamResponsePipeFactory(url)(resData);
    expect(handled.errors.length).toBe(2);
    expect(handled.errors[0] instanceof JetstreamError).toBe(true);
    expect(handled.errors[0].errorCode).toBe(1 + '');
    expect(handled.errors[0].guid).toBe(endpoint1Guid);
    expect(handled.errors[0].url).toBe(url);
    expect(handled.errors[1] instanceof JetstreamError).toBe(true);
    expect(handled.errors[1].errorCode).toBe(12 + '');
    expect(handled.errors[1].guid).toBe(endpoint3Guid);
    expect(handled.errors[1].url).toBe(url);
    expect(handled.successes.length).toBe(2);
    expect(handled.successes[0].entities[0].data1).toBe(endpoint2Res.data1);
    expect(handled.successes[1].entities[0].data2).toBe(endpoint4Res.data2);
    expect(handled.successes[1].entities[1].data2).toBe(endpoint4Res.data2);
  });

  it(' should handle custom data getter', () => {
    const url = 'url123';
    const endpoint2Guid = 'endpoint2';
    const endpoint4Guid = 'endpoint4';
    const endpoint2Res = {
      entities: [{ data1: 'ThisIsData', }],
      total: 10,
    };
    const endpoint4Res = {
      entities: [{ data2: 'ThisIsData5' }],
      total: 15,
    };
    const resData = {
      [endpoint2Guid]: [endpoint2Res],
      [endpoint4Guid]: [endpoint4Res, endpoint4Res]
    } as JetstreamResponse;
    const handled = handleJetstreamResponsePipeFactory(url, {
      getEntitiesFromResponse: (page) => {
        return page.entities;
      },
      getTotalEntities: (res) => Object.values(res).reduce((total, pages) => {
        return total + pages[0].total;
      }, 0),
      getPaginationParameters: () => ({ page: '1' }),
      getTotalPages: () => 4,
      canIgnoreMaxedState: () => of(false),
      maxedStateStartAt: () => null,
    })(resData);
    expect(handled.successes.length).toBe(2);
    expect(handled.successes[0].entities[0].data1).toBe(endpoint2Res.entities[0].data1);
    expect(handled.successes[0].entities[0].__stratosEndpointGuid__).toBe(endpoint2Guid);
    expect(handled.successes[1].entities[0].data2).toBe(endpoint4Res.entities[0].data2);
    expect(handled.successes[1].entities[0].__stratosEndpointGuid__).toBe(endpoint4Guid);
    expect(handled.successes[1].entities[0].data2).toBe(endpoint4Res.entities[0].data2);
    expect(handled.successes[1].entities[0].__stratosEndpointGuid__).toBe(endpoint4Guid);
  });

  it('runs getEntitiesFromResponse on a single (non-array) response so V3-native flat resources get wrapped pre-normalize', () => {
    // V3-native single-resource: handler returns a flat object, no resources/pagination envelope.
    const cnsi = 'endpoint1';
    const resData = {
      [cnsi]: { guid: 'org-1', name: 'opensource', status: 'active' }
    } as JetstreamResponse;
    const wrappedSentinel = { metadata: { guid: 'org-1', url: '' }, entity: { guid: 'org-1', name: 'opensource' } };
    const handled = handleJetstreamResponsePipeFactory('url123', {
      // Adapter mirrors v3EntitiesFromResponse: wrap a flat resource with .guid into Stratos shape.
      getEntitiesFromResponse: (resp) => resp?.guid ? [wrappedSentinel] : [],
      getTotalEntities: () => 1,
      getTotalPages: () => 1,
      getPaginationParameters: () => ({ page: '1' }),
      canIgnoreMaxedState: () => of(false),
      maxedStateStartAt: () => null,
    })(resData);
    expect(handled.errors.length).toBe(0);
    expect(handled.successes.length).toBe(1);
    expect(handled.successes[0].entities.length).toBe(1);
    expect(handled.successes[0].entities[0].metadata.guid).toBe('org-1');
    expect(handled.successes[0].entities[0].entity.name).toBe('opensource');
    expect(handled.successes[0].entities[0].__stratosEndpointGuid__).toBe(cnsi);
  });

  it('passes through a single (non-array) response unchanged when no getEntitiesFromResponse adapter is registered (legacy V2 single-resource)', () => {
    // V2 single-resource arrives already wrapped by the proxy: {metadata, entity}
    const cnsi = 'endpoint1';
    const v2Wrapped = { metadata: { guid: 'org-2', url: '' }, entity: { name: 'legacy' } };
    const resData = { [cnsi]: v2Wrapped } as JetstreamResponse;
    const handled = handleJetstreamResponsePipeFactory('url123')(resData);
    expect(handled.successes.length).toBe(1);
    expect(handled.successes[0].entities.length).toBe(1);
    expect(handled.successes[0].entities[0].metadata.guid).toBe('org-2');
    expect(handled.successes[0].entities[0].entity.name).toBe('legacy');
    expect(handled.successes[0].entities[0].__stratosEndpointGuid__).toBe(cnsi);
  });
});
