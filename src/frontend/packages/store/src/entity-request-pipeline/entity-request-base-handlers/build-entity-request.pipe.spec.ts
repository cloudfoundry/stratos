import { buildRequestEntityPipe } from './build-entity-request.pipe';
import { HttpRequest } from '@angular/common/http';

describe('build-entity-request-pipe', () => {
  it(' use HttpRequest', () => {
    const testUrl = 'testUrl';
    const request = buildRequestEntityPipe('fetch', new HttpRequest<any>('GET', testUrl));
    const urlSplit = request.url.split('/');
    expect(urlSplit[urlSplit.length - 1]).toBe(testUrl);
    expect(request instanceof HttpRequest).toBe(true);
  });
});
