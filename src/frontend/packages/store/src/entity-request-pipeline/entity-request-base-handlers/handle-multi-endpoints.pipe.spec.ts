import { handleMultiEndpointsPipeFactory, JetstreamError } from './handle-multi-endpoints.pipe';
import { JetstreamResponse } from '../entity-request-pipeline.types';
import { JetStreamErrorResponse } from '../../../../core/src/jetstream.helpers';

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
      [endpoint1Guid]: {
        error: {
          statusCode: 1,
          status: '123'
        },
        errorResponse: 'test'
      } as JetStreamErrorResponse,
      [endpoint3Guid]: {
        error: {
          statusCode: 12,
          status: '4'
        },
        errorResponse: 'test4324'
      } as JetStreamErrorResponse,
      [endpoint2Guid]: endpoint2Res,
      [endpoint4Guid]: [endpoint4Res, endpoint4Res]
    } as JetstreamResponse;
    const handled = handleMultiEndpointsPipeFactory(url)(resData);
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
      data1: 'ThisIsData'
    };
    const endpoint4Res = {
      data2: 'ThisIsData5'
    };
    const resData = {
      [endpoint2Guid]: { entities: endpoint2Res },
      [endpoint4Guid]: { entities: [endpoint4Res, endpoint4Res] }
    } as JetstreamResponse;
    const handled = handleMultiEndpointsPipeFactory(url, (res) => res.entities)(resData);
    expect(handled.successes.length).toBe(2);
    expect(handled.successes[0].entities[0].data1).toBe(endpoint2Res.data1);
    expect(handled.successes[1].entities[0].data2).toBe(endpoint4Res.data2);
    expect(handled.successes[1].entities[1].data2).toBe(endpoint4Res.data2);
  });
});
