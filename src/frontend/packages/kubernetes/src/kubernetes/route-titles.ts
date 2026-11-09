import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { endpointTitle, paramTitle } from '@stratosui/core';

import { getHelmReleaseDetailsFromGuid } from './workloads/store/workloads-entity-factory';

// Route `title` resolvers for the Kubernetes and Helm pages (SC 2.4.2). The
// names are all in the URL already, except the endpoint's.

export const kubeEndpointTitle = endpointTitle();
export const nodeTitle = paramTitle('nodeName');
export const podTitle = paramTitle('podName');
export const releaseTitle = paramTitle('guid', guid => getHelmReleaseDetailsFromGuid(guid).releaseTitle);

/** The chart view's heading is the version when the URL has one, else the chart. */
export const chartTitle: ResolveFn<string> = (route: ActivatedRouteSnapshot) =>
  route.paramMap.get('version') ?? route.paramMap.get('chartName') ?? '';
