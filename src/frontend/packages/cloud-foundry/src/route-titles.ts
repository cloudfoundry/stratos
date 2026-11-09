import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { endpointTitle, paramTitle, parentTitle } from '@stratosui/core';
import { firstValueFrom } from 'rxjs';

import { EndpointDataRegistry } from './services/endpoint-data/endpoint-data.registry';
import { OrgDataRegistry } from './services/endpoint-data/org-data.registry';
import { SpaceDataRegistry } from './services/endpoint-data/space-data.registry';

// Route `title` resolvers for the Cloud Foundry entity pages (SC 2.4.2): the
// document title carries the entity's name. Names come from what the app has
// already loaded where a shared cache exists; otherwise one GET of the
// entity. A failed lookup keeps the section's title.

const param = (route: ActivatedRouteSnapshot, name: string) => route.paramMap.get(name) ?? '';

function nameOrParent(route: ActivatedRouteSnapshot, url: string, cached?: string): Promise<string> {
  if (cached) {
    return Promise.resolve(cached);
  }
  const http = inject(HttpClient);
  return firstValueFrom(http.get<{ name: string }>(url)).then(r => r.name, () => parentTitle(route));
}

const prefixed = (prefix: string | undefined, name: string) => (prefix ? `${prefix} - ${name}` : name);

export const cfEndpointTitle = endpointTitle();

/** `:endpointId/:id` — the application's name, from the apps list cache or one GET. */
export const appTitle: ResolveFn<string> = route => {
  const cf = param(route, 'endpointId');
  const id = param(route, 'id');
  const lists = inject(EndpointDataRegistry).peek(cf);
  const cached = [...(lists?.apps() ?? []), ...(lists?.recentApps() ?? [])].find(a => a.guid === id)?.name;
  return nameOrParent(route, `/pp/v1/cf/apps/${cf}/${id}`, cached);
};

/** `organizations/:orgId` — through the org data service the page shares. */
export const orgTitle: ResolveFn<string> = route => {
  const org = inject(OrgDataRegistry).acquire(param(route, 'endpointId'), param(route, 'orgId'));
  return firstValueFrom(org.load(), { defaultValue: undefined })
    .then(() => org.org()?.name ?? parentTitle(route), () => parentTitle(route));
};

/** `organizations/:orgId/spaces/:spaceId` — through the space data service the page shares. */
export const spaceTitle: ResolveFn<string> = route => {
  const space = inject(SpaceDataRegistry).acquire(param(route, 'endpointId'), param(route, 'spaceId'));
  return firstValueFrom(space.load(), { defaultValue: undefined })
    .then(() => space.space()?.name ?? parentTitle(route), () => parentTitle(route));
};

/** `:type/:endpointId/:serviceInstanceId[/action]` — "Action - instance name". */
export function serviceInstanceTitle(prefix?: string): ResolveFn<string> {
  return route => {
    const cf = param(route, 'endpointId');
    const id = param(route, 'serviceInstanceId');
    const cached = inject(EndpointDataRegistry).peek(cf)?.serviceInstances().find(si => si.guid === id)?.name;
    return nameOrParent(route, `/pp/v1/cf/service_instances/${cf}/${id}`, cached).then(n => prefixed(prefix, n));
  };
}

/** `:endpointId/:serviceId[/create]` in the marketplace — "[Action - ]offering name". */
export function serviceOfferingTitle(prefix?: string): ResolveFn<string> {
  return route => {
    const cf = param(route, 'endpointId');
    const id = param(route, 'serviceId');
    const cached = inject(EndpointDataRegistry).peek(cf)?.serviceOfferings().find(o => o.guid === id)?.name;
    return nameOrParent(route, `/pp/v1/cf/service_offerings/${cf}/${id}`, cached).then(n => prefixed(prefix, n));
  };
}

export const orgQuotaTitle: ResolveFn<string> = route =>
  nameOrParent(route, `/pp/v1/cf/organization_quotas/${param(route, 'endpointId')}/${param(route, 'quotaId')}`);

export const spaceQuotaTitle: ResolveFn<string> = route =>
  nameOrParent(route, `/pp/v1/cf/space_quotas/${param(route, 'endpointId')}/${param(route, 'quotaId')}`);

export const cellTitle = paramTitle('cellId', id => `Cell: ${id}`);
