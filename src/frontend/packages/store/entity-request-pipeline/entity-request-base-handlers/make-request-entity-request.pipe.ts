import { MakeEntityRequestPipe } from '../entity-request-pipeline.types';

export const makeRequestEntityPipe: MakeEntityRequestPipe = (
  httpClient,
  request
) => {
  return httpClient.request(request);
};
