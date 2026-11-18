import { describe, it, expect } from 'vitest';
import { UrlPartsPipe } from './url-parts.pipe';

describe('UrlPartsPipe', () => {
  const pipe = new UrlPartsPipe();

  it('ends a part after each dot', () => {
    expect(pipe.transform('https://api.sys.example.io')).toEqual(['https://', 'api.', 'sys.', 'example.', 'io']);
  });

  it('keeps the two slashes of the scheme together', () => {
    expect(pipe.transform('https://a.io')[0]).toBe('https://');
  });

  it('ends a part after each path slash', () => {
    expect(pipe.transform('https://a.io/v3/apps')).toEqual(['https://', 'a.', 'io/', 'v3/', 'apps']);
  });

  it('loses no characters', () => {
    const url = 'https://autoscaler.system.ocf.example.lab.io:8443/a/b?c=d.e';
    expect(pipe.transform(url).join('')).toBe(url);
  });

  it('has no parts for an empty address', () => {
    expect(pipe.transform('')).toEqual([]);
    expect(pipe.transform(undefined)).toEqual([]);
  });
});
