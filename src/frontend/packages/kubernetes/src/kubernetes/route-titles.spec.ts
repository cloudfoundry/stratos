import { ActivatedRouteSnapshot, RouterStateSnapshot, convertToParamMap } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { chartTitle, releaseTitle } from './route-titles';

const routeWith = (params: Record<string, string>) =>
  ({ paramMap: convertToParamMap(params), parent: null }) as unknown as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('kubernetes route titles', () => {
  it('names a workload from the release part of its guid', () => {
    expect(releaseTitle(routeWith({ guid: 'ep-1:default:my-release' }), state)).toBe('my-release');
  });

  it('names a chart by version when one is in the URL, else by chart name', () => {
    expect(chartTitle(routeWith({ chartName: 'nginx', version: '1.2.3' }), state)).toBe('1.2.3');
    expect(chartTitle(routeWith({ chartName: 'nginx' }), state)).toBe('nginx');
  });
});
