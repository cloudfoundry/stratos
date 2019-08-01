import { buildRequestEntityPipe } from './build-entity-request.pipe';
import { HttpRequest } from '@angular/common/http';
import { RequestOptions } from '@angular/http';
import { Headers, URLSearchParams } from '@angular/http';

describe('build-entity-request-pipe', () => {
  it(' use HttpRequest', () => {
    const testUrl = 'testUrl';
    const request = buildRequestEntityPipe('fetch', new HttpRequest<any>('GET', testUrl));
    const urlSplit = request.url.split('/');
    expect(urlSplit[urlSplit.length - 1]).toBe(testUrl);
    expect(request instanceof HttpRequest).toBe(true);
  });
  it(' create HttpRequest from RequestOptions', () => {
    const testUrl = 'testUrl';
    const testHeader1 = 'testheader1';
    const testHeader2 = 'testheader2';
    const testParam1 = 'testParam1';
    const testParam2 = 'testParam2';
    const testBodyKey1 = 'testBodyKey1';
    const testBodyKey2 = 'testBodyKey2';
    const headers = new Headers({
      [testHeader1]: testHeader1,
      [testHeader2]: testHeader2
    });
    const params = new URLSearchParams();
    params.set(testParam1, testParam1);
    params.set(testParam2, testParam2);
    const body = {
      [testBodyKey1]: testBodyKey1,
      [testBodyKey2]: testBodyKey2
    };
    const options = {
      url: testUrl,
      method: 'GET',
      headers,
      params,
      body
    } as RequestOptions;
    const request = buildRequestEntityPipe('fetch', options);
    const urlSplit = request.url.split('/');
    expect(urlSplit[urlSplit.length - 1]).toBe(testUrl);
    expect(request.method).toBe('GET');
    expect(request.headers.get(testHeader1)).toBe(testHeader1);
    expect(request.headers.get(testHeader2)).toBe(testHeader2);
    expect(request.params.get(testParam1)).toBe(testParam1);
    expect(request.params.get(testParam2)).toBe(testParam2);
    expect(request.body[testBodyKey1]).toBe(testBodyKey1);
    expect(request.body[testBodyKey2]).toBe(testBodyKey2);
    expect(request instanceof HttpRequest).toBe(true);
  });
});
