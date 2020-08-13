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
      total: 10
    };
    const endpoint4Res = {
      entities: [{ data2: 'ThisIsData5' }],
      total: 15
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
      maxedStateStartAt: () => null
    })(resData);
    expect(handled.successes.length).toBe(2);
    expect(handled.successes[0].entities[0].data1).toBe(endpoint2Res.entities[0].data1);
    expect(handled.successes[0].entities[0].__stratosEndpointGuid__).toBe(endpoint2Guid);
    expect(handled.successes[1].entities[0].data2).toBe(endpoint4Res.entities[0].data2);
    expect(handled.successes[1].entities[0].__stratosEndpointGuid__).toBe(endpoint4Guid);
    expect(handled.successes[1].entities[0].data2).toBe(endpoint4Res.entities[0].data2);
    expect(handled.successes[1].entities[0].__stratosEndpointGuid__).toBe(endpoint4Guid);
  });
});
