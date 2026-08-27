import { describe, it, expect } from 'vitest';

import type { EndpointModel } from '@stratosui/store';
import { endpointDropdownOptions } from './endpoint-dropdown-options';

const ep = (guid: string, name?: string): EndpointModel => ({ guid, name } as EndpointModel);

describe('endpointDropdownOptions', () => {
  // The backend returns endpoints unordered (no ORDER BY on listCNSIs) and the
  // store keeps insertion order, so a lab with two CFs showed "duplicate"
  // above "Cloud Foundry" purely because of its guid.
  it('sorts the endpoints by name regardless of the order they arrive in', () => {
    const opts = endpointDropdownOptions([
      ep('2b466124', 'duplicate'),
      ep('dbe7222c', 'Cloud Foundry'),
    ]);
    expect(opts.map(o => o.label)).toEqual(['All', 'Cloud Foundry', 'duplicate']);
  });

  it('keeps All pinned first even though it would not sort there', () => {
    const opts = endpointDropdownOptions([ep('g1', 'Alpha'), ep('g2', 'AAA')]);
    expect(opts[0]).toEqual({ label: 'All', value: null });
    expect(opts.map(o => o.label).slice(1)).toEqual(['AAA', 'Alpha']);
  });

  it('sorts case-insensitively, so case does not split the list', () => {
    const opts = endpointDropdownOptions([ep('g1', 'zeta'), ep('g2', 'Alpha'), ep('g3', 'beta')]);
    expect(opts.map(o => o.label)).toEqual(['All', 'Alpha', 'beta', 'zeta']);
  });

  it('orders embedded numbers naturally rather than lexically', () => {
    const opts = endpointDropdownOptions([ep('g1', 'cf10'), ep('g2', 'cf2'), ep('g3', 'cf1')]);
    expect(opts.map(o => o.label)).toEqual(['All', 'cf1', 'cf2', 'cf10']);
  });

  it('carries the guid through as each option value', () => {
    const opts = endpointDropdownOptions([ep('dbe7222c', 'Cloud Foundry'), ep('2b466124', 'duplicate')]);
    expect(opts).toEqual([
      { label: 'All', value: null },
      { label: 'Cloud Foundry', value: 'dbe7222c' },
      { label: 'duplicate', value: '2b466124' },
    ]);
  });

  it('falls back to the guid when an endpoint has no name', () => {
    const opts = endpointDropdownOptions([ep('zz-guid'), ep('g2', 'Alpha')]);
    expect(opts.map(o => o.label)).toEqual(['All', 'Alpha', 'zz-guid']);
  });

  it('returns just All for no endpoints, null or undefined', () => {
    const only = [{ label: 'All', value: null }];
    expect(endpointDropdownOptions([])).toEqual(only);
    expect(endpointDropdownOptions(null)).toEqual(only);
    expect(endpointDropdownOptions(undefined)).toEqual(only);
  });

  it('does not mutate the array it was given', () => {
    const input = [ep('g1', 'zeta'), ep('g2', 'alpha')];
    endpointDropdownOptions(input);
    expect(input.map(e => e.name)).toEqual(['zeta', 'alpha']);
  });
});
